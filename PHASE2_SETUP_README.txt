LAKKA STORIES — PHASE 2 COD ORDER REQUEST BUILD
================================================

WHAT IS INCLUDED
- Existing Phase 1 website and images, preserved.
- cart.html now has a COD order-request checkout link.
- checkout.html collects customer name, mobile (required), email (optional),
  address, PIN code, city, state and optional delivery notes.
- Supabase Edge Function validates product IDs and quantities and reads
  selling prices from the private products table server-side.
- PHASE2_orders_schema.sql creates private orders and order_items tables.
- supabase/functions/submit-order-request/index.ts is the server function.
- LAKKA_STORIES_Mumbai_Manager_Phase2.html adds an Orders panel to the
  supplied manager page while retaining product management.

IMPORTANT CURRENT LIMITATIONS
- Checkout is an ORDER REQUEST, not a confirmed order or payment.
- Every request requires owner review. Delivery fee and final payable amount
  are not collected/confirmed by this build.
- The function uses current product rows; products not published are rejected.
  If availability is not "available" or selling price is zero, line price is
  marked for confirmation. Even otherwise, owner review remains required.
- Customer order data is private; only the configured manager UID can read
  and update it.
- No WhatsApp business number has been changed or guessed.
- No files have been uploaded to GitHub and no database changes have been run.

SETUP — DO NOT SKIP ORDER
1. Make a backup of the current Mumbai database and current manager HTML.
2. Review PHASE2_orders_schema.sql. It contains the known manager UID
   5eaca531-3d59-4878-822c-da9c359dd259. Verify that it is still the correct
   authorised manager UID before running it in Mumbai Supabase SQL Editor.
3. Run the SQL in the Mumbai project only, after review.
4. Deploy the Edge Function folder using Supabase CLI linked to the Mumbai
   project. Set server-side secrets:
      SUPABASE_URL=https://gsesangwrryzbpudusfl.supabase.co
      SUPABASE_SERVICE_ROLE_KEY=<Mumbai project service role secret>
   Never paste the service role secret into HTML, GitHub, chat or this ZIP.
5. Deploy function submit-order-request. config.toml sets verify_jwt=false
   because public checkout uses the publishable key; the function itself
   validates all fields and uses server-side service-role access.
6. Open checkout.html and replace:
   PASTE_MUMBAI_SUPABASE_PUBLISHABLE_KEY_HERE
   with the Mumbai publishable key. This key is designed for browser use.
   Do not insert a secret/service-role key.
7. Open LAKKA_STORIES_Mumbai_Manager_Phase2.html. Use it in place of the
   previous manager file only after local testing. It uses the same Mumbai
   URL and existing publishable-key/login flow.
8. Test with a deliberately unpublished/test product first. The Edge Function
   rejects unpublished products. Do not use a real customer's personal data.
9. Check that a test order appears in the manager Orders panel; update its
   status; confirm a public browser cannot read orders or order_items.
10. Delete the test order via manager/database after test and verify cleanup.
11. Only then consider updating GitHub Pages.

DEPLOYMENT COMMANDS (run from the project root in a terminal with Supabase CLI):
  supabase login
  supabase link --project-ref gsesangwrryzbpudusfl
  supabase secrets set SUPABASE_URL=https://gsesangwrryzbpudusfl.supabase.co
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<secret>
  supabase functions deploy submit-order-request

SECURITY NOTES
- Never expose service-role/secret keys in client-side code.
- Do not grant anon SELECT/INSERT/UPDATE on orders or order_items.
- Verify manager UID in SQL against Supabase Authentication before running.
- This is a first implementation. Before real sales, review privacy notice,
  consent wording, retention/deletion process, GST/consumer disclosures,
  courier/COD terms and security policies.
