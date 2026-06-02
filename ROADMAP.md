# EXTRAALAYER - Technical Analysis & Implementation Roadmap

## 1. Brand & Business Rules
- **Brand Name:** EXTRAALAYER
- **Tagline:** Layer Up. Stand Out.
- **Brand Personality:** Premium, Streetwear, Gen-Z, Luxury, Minimal
- **Design Direction:** Dark luxury aesthetic, mobile-first, smooth animations, premium typography. (References: Represent Clothing, Zara Men, Snitch, Culture Kings, Urban Monkey). Avoid generic e-commerce and default Bootstrap styles.
- **Target Audience & Scope:** **MEN'S FASHION ONLY.** All flows, categories, filters, and admin forms must strictly cater to men's clothing. (Remove Women/Unisex).

## 2. Technical Analysis Report

### Current Architecture Overview
- **Backend:** Node.js (v22+) with Express.js. Uses ES Modules.
- **Frontend:** Server-side rendered using EJS templates (located in `/views`).
- **Database:** MongoDB via Mongoose.
- **Authentication:** Custom JWT-based authentication (Access & Refresh tokens) with bcrypt and OTP verification.
- **Payments:** Razorpay integration.
- **Shipping/Delivery:** Delhivery integration.

### Existing Functionality
- **User Auth:** Registration, login, JWT token generation. Roles: `customer`, `admin`.
- **Product Management:** Add/Update/Delete products via Admin routes.
- **Cart System:** Basic cart implementation.
- **Order Management:** Order creation, status tracking, Admin views for order states.
- **Image Upload:** Cloudinary integration via Multer.
- **Admin Panel:** EJS-based admin dashboard routing.

### Missing Functionality (To Build for EXTRAALAYER)
- **Wishlist System:** Missing schema, API, and UI (Product Card, Details Page, Header Icon, Dedicated Page).
- **Taxonomy & Collections:** Existing system only supports 'men/women/unisex'. Needs overhaul to support the new men's-only specific Main Categories and Collections.
- **Advanced Filtering:** No backend or frontend support for category, collection, price, color, size, etc.
- **Modern UI/UX:** Current EJS UI does not meet the premium, dark luxury, mobile-first requirements.
- **SEO & Performance:** Missing Product/Collection SEO, OpenGraph, Sitemap, Structured Data, Canonical URLs. Needs to hit 90+ Lighthouse targets.
- **Expanded Admin Capabilities:** Missing logic for returns, exchanges, support tickets, reviews, coupons, tags, and homepage sections.

### Technical Debt & Issues
- **UI/UX Problems:** EJS requires significant styling and client-side JS to meet the "smooth animations" and Gen-Z aesthetics required.
- **Database Improvements Needed:** `Product` schema must drop "women/unisex", expand for tags/variants, and `Wishlist`, `Review`, `Coupon`, `SupportTicket` schemas must be created.
- **Performance:** Ensure Server-Side Rendering does not bottleneck the 90+ Lighthouse target.

---

## 3. Phased Implementation Plan

### Phase 1: Database & Backend Foundation (Complete)
* **Objective:** Expand schema for men's streetwear and build backend features.
* **Tasks:**
  1. **Update Product Schema:** Remove 'women'/'unisex'. Add fields for:
     - *Categories:* Oversized T-Shirts, Oversized Shirts, Shirts, T-Shirts, Hoodies, Sweatshirts, Cargo Pants, Joggers, Jeans, Jackets, Co-Ord Sets, Accessories.
     - *Collections:* Anime, Acid Wash, Minimal, Graphic, Typography, Vintage Wash, Premium Essentials, New Arrivals, Best Sellers, Limited Drops.
  2. **Create Wishlist Schema:** Persistent storage for user wishlists.
  3. **Create Support Schemas:** Returns, Exchanges, Reviews, Coupons, and Support Tickets.
  4. **API Updates:** Update product fetching to support robust filtering. Build Wishlist API endpoints.

### Phase 2: Admin Panel Overhaul
* **Objective:** Upgrade admin to manage the new streetwear catalog and business operations.
* **Tasks:**
  1. **Taxonomy Management:** Add UI/Logic to Create/Manage Categories, Subcategories, Collections, and Product Tags.
  2. **Operations Management:** Add pages to Manage Returns, Manage Exchanges, and Manage Support Tickets.
  3. **Marketing/Sales Management:** Add pages to Manage Coupons, Manage Reviews.
  4. **Storefront Management:** Add capability to Manage Homepage Sections.
  5. **Inventory:** Update views (`inventory.ejs`, `AddProducts.ejs`) for the new men's-only product fields.

### Phase 3: Frontend Redesign & Homepage Generation
* **Objective:** Implement the "EXTRAALAYER" brand identity.
* **Tasks:**
  1. **Theming & Design:** Apply the Dark Luxury aesthetic, premium typography, and mobile-first approach (Avoid generic Bootstrap).
  2. **Homepage Sections:** Implement Hero Banner, Shop By Category, New Arrivals, Trending Products, Anime Collection, Acid Wash Collection, Best Sellers, Customer Reviews, Instagram Gallery, and Newsletter.
  3. **Product UI:** Redesign product cards with high conversion elements and smooth animations.
  4. **Wishlist UI:** Integrate wishlist visibility on Product Cards, Product Details Page, Header Icon, and a Dedicated Wishlist Page.

### Phase 4: Content Pages, SEO & Performance
* **Objective:** Flesh out brand narrative, optimize search visibility, and hit performance targets.
* **Tasks:**
  1. **Policy Pages:** Populate the markdown placeholders and render them dynamically in EJS.
  2. **Technical SEO:** Implement Product SEO, Collection SEO, OpenGraph tags, Sitemap generation, Structured Data (JSON-LD), and Canonical URLs.
  3. **Performance Optimization:** Asset minification, image optimization (Cloudinary transformations), and caching to hit targets:
     - Lighthouse Performance: 90+
     - SEO: 95+
     - Accessibility: 90+

### Phase 5: Testing & Deployment Prep
* **Objective:** Ensure all business rules and targets are met before launch.
* **Tasks:**
  1. Verify all flows are strictly Men's fashion.
  2. Load testing and performance target validation.
  3. Mobile responsiveness and cross-browser QA.
  4. Pre-commit checks and final code review.