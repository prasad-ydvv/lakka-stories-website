# LAKKA STORIES private storefront deployment plan

## Intended architecture
- Public hostname: `lakkastories.in` and `www.lakkastories.in` -> dedicated Cloudflare Pages project serving only `launch-gate/`.
- Private test hostname: `preview.lakkastories.in` -> separate Cloudflare Pages project serving the full storefront from the production storefront repository root.
- Manager portal: separate protected deployment; do not place manager HTML or owner tools in the public launch-gate project.
- Backend: existing Supabase project `jdoxpxoyhppjglmdvnfq`; do not change database policies or production secrets as part of DNS setup.

## Private Pages project
1. Create a separate Pages project connected to `prasad-ydvv/lakka-stories-website`.
2. Use `main` as the production branch and repository root as the static output directory (no build command).
3. Do not attach the public apex or `www` domain to this project.
4. Add `preview.lakkastories.in` only after the Cloudflare zone is Active and the project deployment is verified.
5. Create a Cloudflare Access self-hosted application for `preview.lakkastories.in` and allow only the owner's explicitly approved email identity. Use a one-time PIN or identity provider login; never use a shared public bypass.
6. In Pages > Settings > General, enable the Access policy for preview deployments. Also protect the project's `*.pages.dev` hostname with an Access application; Cloudflare documents that the preview policy alone does not protect the base `*.pages.dev` hostname or custom domains.
7. Verify unauthenticated requests to the custom preview hostname, base `pages.dev` hostname, and preview deployment URLs are denied before entering customer or manager workflows.

## Public launch-gate project
- Connect the same repository to a separate Pages project.
- Set production branch to `staging/cloudflare-launch-gate-2026-11-21`.
- Keep build command blank and output directory `launch-gate`.
- Attach apex and `www` only after Cloudflare zone activation, then verify both resolve to the Coming Soon page.
- Do not add any link from the public page to private preview or manager addresses.

## Security and release gates
- Cloudflare Access protects the web interface; it does not replace Supabase Row Level Security or API authorization.
- Confirm Supabase RLS and Edge Function authorization independently. Do not rely on hidden URLs or robots.txt/noindex for access control.
- Do not expose Supabase service-role keys, Razorpay secret keys, customer records, manager IDs, or internal source files in client-side code.
- Keep payment testing in Razorpay test mode until the account and production flow are approved. Verify server-side payment signature/order validation before any live charge.
- Before launch, test public Coming Soon page, Access allow/deny behavior, storefront product reads, order creation, payment success/failure, order tracking, and manager actions with appropriate test accounts.
- Keep the existing production `main` branch and current live website unchanged until the new Pages projects and DNS have been verified.

## Current state
Preparation only. No Cloudflare Pages project has been created, no DNS record has been changed in Cloudflare, and no production deployment has been switched by this plan.
