// Supabase Edge Function: submit-order-request
// Required Supabase secrets:
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY
// RESEND_API_KEY
//
// Never put secret keys in website/frontend code or GitHub.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const required = ["customer_name", "phone", "pin_code", "address", "city", "state"];
    for (const k of required) {
      if (typeof body[k] !== "string" || !body[k].trim()) return json({ error: `Missing ${k}` }, 400);
    }
    if (!/^[0-9]{10,15}$/.test(body.phone.replace(/[+\\s()-]/g, ""))) return json({ error: "Enter a valid mobile number." }, 400);
    if (!/^[0-9]{6}$/.test(body.pin_code)) return json({ error: "Enter a valid six-digit PIN code." }, 400);
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) return json({ error: "Cart is empty or contains too many items." }, 400);

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return json({ error: "Server is not configured." }, 500);
    const admin = createClient(url, key, { auth: { persistSession: false } });

    const ids = [...new Set(body.items.map((x: any) => String(x.product_id)))];
    if (ids.some((x: string) => !/^[0-9a-f-]{36}$/i.test(x))) return json({ error: "Invalid product reference." }, 400);
    const { data: products, error: pErr } = await admin.from("products")
      .select("id,name,selling_price,availability,is_published").in("id", ids);
    if (pErr) throw pErr;
    if (!products || products.length !== ids.length || products.some((p: any) => !p.is_published)) {
      return json({ error: "One or more products are unavailable. Please contact us." }, 409);
    }
    // Option A: only explicitly verified, orderable products may enter an order request.
    // Missing, unknown, made-to-order and out-of-stock values remain enquiry-only.
    const enquiryOnly = products.filter((p: any) => String(p.availability || "").trim().toLowerCase() !== "available");
    if (enquiryOnly.length) {
      return json({ error: "Some items are enquiry-only because availability is not verified. Please remove them from your cart and contact us on WhatsApp." , enquiry_only_products: enquiryOnly.map((p: any) => ({ id: p.id, name: p.name })) }, 409);
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));
    let subtotal = 0;
    const lines = [];
    for (const item of body.items) {
      const p: any = productMap.get(String(item.product_id));
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) return json({ error: "Invalid product quantity." }, 400);
      const unit = Number(p.selling_price) || 0;
      const pending = unit <= 0;
      const line = pending ? 0 : unit * qty;
      subtotal += line;
      lines.push({ product_id: p.id, product_name: p.name, quantity: qty, unit_price: pending ? 0 : unit,
        line_total: line, price_needs_confirmation: pending });
    }

    const ref = "LS-" + new Date().getFullYear() + "-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const { data: order, error: oErr } = await admin.from("orders").insert({
      order_reference: ref,
      customer_name: body.customer_name.trim().slice(0, 120),
      phone: body.phone.trim().slice(0, 20),
      email: typeof body.email === "string" ? body.email.trim().slice(0, 180) || null : null,
      pin_code: body.pin_code,
      address: body.address.trim().slice(0, 500),
      city: body.city.trim().slice(0, 100),
      state: body.state.trim().slice(0, 100),
      notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 300) || null : null,
      payment_method: "to_be_agreed",
      subtotal,
      price_needs_confirmation: true,
    }).select("id,order_reference").single();
    if (oErr) throw oErr;

    const { error: iErr } = await admin.from("order_items").insert(lines.map((x) => ({ ...x, order_id: order.id })));
    if (iErr) {
      const { error: deleteErr } = await admin.from("orders").delete().eq("id", order.id);
      if (deleteErr) console.error("Order rollback failed:", deleteErr);
      throw iErr;
    }

    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) console.error("RESEND_API_KEY is not configured.");
      else {
        const emailText = [
          "A new LAKKA STORIES order request was received.", "",
          `Order reference: ${order.order_reference}`,
          `Customer: ${body.customer_name.trim().slice(0, 120)}`,
          `Phone: ${body.phone.trim().slice(0, 20)}`,
          `City: ${body.city.trim().slice(0, 100)}`,
          `State: ${body.state.trim().slice(0, 100)}`,
          `Subtotal: Rs. ${subtotal.toFixed(2)}`,
          "Payment method: To be agreed with customer",
          "Price confirmation required: Yes", "",
          "Please review the order in the manager portal.",
          "Contact the customer to confirm price, availability, delivery and payment method.",
          "", "This is an order request, not a confirmed order.",
        ].join("\n");
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: "LAKKA STORIES <onboarding@resend.dev>", to: ["prasadydvv.0101@gmail.com"],
            subject: `New order request: ${order.order_reference}`, text: emailText }),
        });
        if (!emailResponse.ok) console.error("Order email notification failed:", emailResponse.status, await emailResponse.text());
        else console.log("Order email accepted by Resend:", (await emailResponse.json()).id);
      }
    } catch (emailError) { console.error("Order email notification error:", emailError); }

    return json({ success: true, order_reference: order.order_reference,
      message: "Order request received. It is not confirmed until the store verifies price, availability and delivery." }, 201);
  } catch (e) {
    console.error(e);
    return json({ error: "Unable to submit order request. Please try again or contact LAKKA STORIES." }, 500);
  }
});
