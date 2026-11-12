import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = "https://prasad-ydvv.github.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function logDatabaseError(label: string, error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}) {
  console.error(label, JSON.stringify({
    message: error.message ?? "No message returned",
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  }));
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin") ?? "";

  if (origin && origin !== ALLOWED_ORIGIN) {
    return jsonResponse({ error: "Request not allowed." }, 403);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    console.error("TRACKING_DIAGNOSTIC: required Supabase environment variable is missing", JSON.stringify({
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(serviceKey),
    }));
    return jsonResponse({ error: "Tracking is temporarily unavailable." }, 503);
  }

  let input: { order_reference?: unknown; phone?: unknown };
  try {
    input = await req.json();
  } catch {
    return jsonResponse({
      error: "Enter your order reference and mobile number.",
    }, 400);
  }

  const reference = String(input.order_reference ?? "").trim();
  const phone = String(input.phone ?? "").replace(/\D/g, "");

  if (!/^LS-[A-Z0-9-]{6,40}$/i.test(reference) || !/^[6-9][0-9]{9}$/.test(phone)) {
    return jsonResponse({
      error: "Enter a valid order reference and 10-digit registered mobile number.",
    }, 400);
  }

  const forwardedFor = req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const clientIp = forwardedFor.split(",")[0].trim().slice(0, 80) || "unknown";
  const ipHash = await sha256(clientIp + ":" + serviceKey);

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Remove expired hashes. Only hashed IP values are stored.
  const expiry = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { error: cleanupError } = await db
    .from("order_tracking_attempts")
    .delete()
    .lt("attempted_at", expiry);

  if (cleanupError) {
    logDatabaseError("TRACKING_DIAGNOSTIC: rate-limit cleanup failed", cleanupError);
  }

  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count, error: countError } = await db
    .from("order_tracking_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("attempted_at", cutoff);

  if (countError) {
    logDatabaseError("TRACKING_DIAGNOSTIC: rate-limit count failed", countError);
    return jsonResponse({
      error: "Tracking is temporarily unavailable. Please try again later.",
    }, 503);
  }

  if ((count ?? 0) >= 8) {
    return jsonResponse({
      error: "Too many attempts. Please wait 15 minutes and try again.",
    }, 429);
  }

  const { error: insertError } = await db
    .from("order_tracking_attempts")
    .insert({ ip_hash: ipHash });

  if (insertError) {
    logDatabaseError("TRACKING_DIAGNOSTIC: rate-limit insert failed", insertError);
    return jsonResponse({
      error: "Tracking is temporarily unavailable. Please try again later.",
    }, 503);
  }

  const { data, error: orderError } = await db
    .from("orders")
    .select("order_reference, order_status, created_at, updated_at")
    .eq("order_reference", reference)
    .eq("phone", phone)
    .maybeSingle();

  if (orderError) {
    logDatabaseError("TRACKING_DIAGNOSTIC: orders lookup failed", orderError);
    return jsonResponse({
      error: "We could not check your order right now. Please try again later.",
    }, 503);
  }

  if (!data) {
    return jsonResponse({
      error: "We couldn't find an order matching those details. Check your reference and registered mobile number.",
    }, 404);
  }

  return jsonResponse({
    order_reference: data.order_reference,
    order_status: data.order_status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  });
});
