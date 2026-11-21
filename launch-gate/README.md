# LAKKA STORIES public launch gate

This folder contains the temporary public-facing Coming Soon page.

## Cloudflare Pages project configuration
- Git repository: `prasad-ydvv/lakka-stories-website`
- Production branch: `staging/cloudflare-launch-gate-2026-11-21` (temporary launch-gate branch)
- Build command: leave blank (static HTML; no build step)
- Build output directory: `launch-gate`
- Root directory: repository root (leave default)
- Custom domains: add `lakkastories.in` and `www.lakkastories.in` only after Cloudflare zone is Active and DNS records have been reviewed.

Do not merge this branch into `main` merely to publish the Coming Soon page. Keep the existing production storefront branch unchanged until private preview and launch checks are ready.

The page deliberately uses `noindex,nofollow` while the store is under preparation.
