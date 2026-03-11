# Juventus Sops Nexus

## Current State
New project — no existing code.

## Requested Changes (Diff)

### Add
- Full hybrid marketplace and tech platform webstore for Juventus Sops brand
- Homepage with hero, shop categories, why choose us, featured products/services, mission, CTA, footer sections
- Digital Products catalog: AI Prompt Packs, Health Tech Content, eBooks & White Papers, Digital Courses, Health Tips & Educational Content, Ghostwritten Materials, Visual & Multimedia Assets, Kids Storybooks
- Digital Services catalog: Graphics & Web Design, CAC & SCUML Registration, Chatbot Development, Mini WebStore Creation, Social Media Growth, Token Creation & Minting
- User authentication (sign up / sign in)
- Shopping cart with add/remove/checkout flow
- Admin panel to manage products and services (add, edit, delete items per category)
- Sample placeholder products pre-seeded in each category for admin to update
- Footer with social links (Instagram, WhatsApp, LinkedIn, X/Twitter) and contact email
- Brand colors: Deep Blue, Neon Purple, Light Gold

### Modify
- N/A (new project)

### Remove
- N/A

## Implementation Plan
1. Select authorization and blob-storage components
2. Generate Motoko backend with: user auth, product/service CRUD (by category), cart management, order placement
3. Build React frontend:
   - Public homepage with all 7 sections
   - Products page with category filter
   - Services page
   - Cart sidebar/page
   - Auth modal (sign up / sign in)
   - Admin dashboard (product/service management per category)
   - Footer with social links and contact info
4. Seed sample products for each category
5. Deploy
