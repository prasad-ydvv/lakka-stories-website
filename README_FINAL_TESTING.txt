LAKKA STORIES — COMPLETE WEBSITE PACKAGE
==========================================

This package combines the latest customer-facing website design with the original
website's image assets and connected COD order-request support.

Included:
- index.html — updated homepage with Etikoppaka introduction and responsive layout
- product.html — latest product detail page
- cart.html, checkout.html, cart.js — latest customer-friendly cart and checkout
- images/ — hero-banner.jpg and the existing product fallback images
- Supabase Edge Function source for submit-order-request
- Supabase configuration, order schema/setup notes
- Existing manager dashboard file and project README

IMPORTANT — HERO IMAGE
The homepage references:
  images/hero-banner.jpg

Keep the images folder beside index.html. Do not move index.html out of this folder.
The hero banner image is included in this ZIP.

HOW TO TEST LOCALLY
1. Extract the ZIP.
2. Open the lakka-stories-website-main folder in VS Code.
3. Confirm that index.html and the images folder are side by side.
4. Start your local server (for example, VS Code Live Server).
5. Open the homepage and test desktop and mobile widths.
6. Test product details, Add to Cart, cart quantity/removal, checkout validation,
   and the order request flow.

PUBLISHING
Do not overwrite your currently working live website until local testing passes.
Keep a backup of your current project first.
The Supabase Edge Function must already be deployed and configured with its
server-side secrets for live order requests to work. Never put the Supabase
service-role key in frontend HTML or JavaScript.

This package does not mean the site has been deployed or that live order
submission has been verified in your hosting environment.

HOMEPAGE CLEANUP
- Removed the three-step Explore / Add to cart / Send order request panel as requested.
- Kept the Etikoppaka craft introduction and the three hero brand highlights.
