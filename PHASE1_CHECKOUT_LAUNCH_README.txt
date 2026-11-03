LAKKA STORIES — PHASE 1 CUSTOMER CHECKOUT PACKAGE
=================================================

This package combines the existing LAKKA STORIES website with:
- Shopping cart and quantity controls
- WhatsApp cart enquiry
- COD order-request form
- Mumbai Supabase Edge Function source
- Manager page with an Orders panel

IMPORTANT: The backend has already been deployed and successfully tested in
the LAKKA-STORIES-MUMBAI project. The test order and its order item were
verified in the database. Do not rerun the order schema SQL or recreate the
Edge Function just because these source files are included.

CONFIGURATION
- The checkout page is configured with the same Mumbai project URL and
  browser-safe publishable key as the latest working homepage.
- The manager page uses the existing manager sign-in flow.
- No service-role or secret key is included in browser files.
- WhatsApp ordering remains an enquiry; COD is an order request.
- The store must manually verify price, availability and shipping before
  confirming an order.

NEXT STEPS
1. Extract this ZIP into a new folder on your computer.
2. Open the extracted folder in VS Code.
3. Test locally using Live Server:
   - Homepage loads and products/images appear.
   - Add a published product to cart.
   - Change quantity and remove an item.
   - WhatsApp enquiry opens the configured business chat with cart details.
   - COD checkout accepts test details and submits to Mumbai Supabase.
   - A success message displays an order reference.
4. Open the manager page included in this package and verify that the new
   order appears in its Orders panel. Do not publish until this is verified.
5. Once local tests pass, upload the package's website files to the root of
   the existing GitHub repository, preserving the images folder. Include
   index.html, product.html, cart.html, checkout.html, cart.js and images.
   The manager HTML can be kept privately and should not be published as a
   public repository page.
6. After GitHub Pages deploys, repeat one end-to-end test on the live site.

TEST DATA AND PRIVACY
- Use dummy customer details for tests, never a real customer's details.
- Do not share Supabase secret keys, service-role keys, passwords or OTPs.
- The customer checkout sends delivery details to the private orders table.
- Do not collect payment details; this build does not process payments.

CURRENT LIMITATIONS
- COD request is not a confirmed order or payment.
- Delivery charges and final payable amount require manual confirmation.
- Supplier prices and product availability must be verified by the owner.
- Duplicate submission protection is limited to disabling the submit button
  during a request; it is not a full idempotency system.
- Before real sales, complete privacy, shipping, return/refund, consumer
  disclosures and applicable GST checks.
