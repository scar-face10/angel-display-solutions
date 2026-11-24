# Angels Display Solutions â€” Desktop vs Mobile View Guide

This document provides a comprehensive visual and functional breakdown of how the **Angels Display Solutions** website looks and behaves across **Desktop** and **Mobile** viewports.

---

## 1. Design Philosophy & Theme

- **Aesthetic**: Minimalist luxury, high-end editorial jewellery brand architecture.
- **Color Palette**:
  - **Backgrounds**: Soft Warm Paper (`#efe8da` / `#e3d8c6`), Midnight Black (`#121212` / `#201e1b`) for high-contrast hero & service strips.
  - **Accents**: Muted Luxury Gold (`#c8a451`) and Champagne Gold (`#e4c98a`).
  - **Typography**: Editorial Serif (*Cormorant Garamond*) for headlines, Clean Modern Sans (*Inter / Manrope*) for body copy and navigational elements.
- **Container Max-Width**: `1440px` with fluid gutters `clamp(1.25rem, 5vw, 5.8rem)`.

---

## 2. Responsive Breakpoint Hierarchy

| Breakpoint | Target Devices | Key Layout Behavior |
| :--- | :--- | :--- |
| **> 900px** | Desktops, Laptops, Large Displays | Full multi-column grids, horizontal navigation bar, spacious side-by-side editorial sections. |
| **721px â€“ 900px** | Tablets / Small Laptops | 2-column grids for cards and shelves, tightened navigation spacing, compact headings. |
| **481px â€“ 720px** | Large Mobile Phones & Phablets | Hamburger menu activated, single-column story layouts, full-width form inputs, edge-to-edge carousel. |
| **â‰¤ 480px** | Standard & Compact Smartphones | Single-column gallery masonry, compact touch controls, simplified headers, stacked action buttons. |

---

## 3. Landing Page (`index.html`) Comparison

### A. Navigation & Header
* **Desktop View**:
  - Clean, fixed top navigation bar.
  - Left: Branded logo (`angels-logo-transparent.png`).
  - Center/Right: Full inline navigation links (`Home`, `About Us`, `Services`, `Gallery`, `Contact`).
  - Far Right: `Shop` button with interactive cart badge count.
* **Mobile View (â‰¤ 720px)**:
  - Header height shrinks for maximum screen real estate.
  - Inline navigation collapses behind an animated **hamburger toggle button** (three horizontal bars transitioning to an 'âœ•' when active).
  - Opening the menu reveals a slide-down/overlay sheet styled in frosted cream (`rgba(251, 247, 239, .94)`) with large, touch-friendly navigation links.
  - Shop badge remains accessible next to the hamburger toggle.

---

### B. Hero Section ("Designing spaces that make jewellery shine")
* **Desktop View**:
  - Dramatic dark background (`#121212`) with subtle gold radial ambient glows.
  - Large luxury headline (`clamp(2.5rem, 6vw, 4.8rem)`) with italicized emphasis: *"that make jewellery shine"*.
  - Sub-copy formatted to a readable `31rem` maximum width.
  - Vertical animated *"Scroll to explore"* label fixed along the bottom-right edge.
  - Dual call-to-action buttons: **"View our work â†—"** (solid gold/light) and **"Get a quote â†—"** (outlined).
* **Mobile View (â‰¤ 720px)**:
  - Heading font size automatically scales down via `clamp()` to prevent line overflows.
  - "Scroll to explore" indicator is hidden to save vertical space.
  - Call-to-action buttons stack or stretch horizontally for thumb accessibility.

---

### C. Hero Image Carousel
* **Desktop View**:
  - Positioned directly beneath the hero headline.
  - Contained horizontally with margins (`width: min(90vw, 1300px)`), providing a balanced frame on wide monitors.
  - Stage aspect ratio: `32 / 17`, presenting high-resolution display imagery with dark background framing (`#0a0a09`) and `object-fit: contain`.
  - Floating controls at bottom: Left/Right arrows (`â†` / `â†’`), slide indicator bars with active gold highlights, and a "Pause motion" toggle.
* **Mobile View (â‰¤ 720px)**:
  - Width adapts to `calc(100% - (var(--gutter) * 2))`, extending cleanly to the mobile margins.
  - Touch-friendly swipe and enlarged tap targets for previous/next arrows.
  - Images maintain aspect ratio without any awkward cropping.

---

### D. Service Highlight Strip
* **Desktop View**:
  - Sleek horizontal band across the viewport with dark contrast.
  - 4 columns: `01 Premium Jewellery Display`, `02 Showroom Interiors`, `03 Visual Merchandising`, `04 Packaging Solutions`.
* **Mobile View**:
  - Reorganizes into a compact 2x2 grid or stacked list for readability without horizontal scrolling.

---

### E. Section 01: About The Studio
* **Desktop View**:
  - Asymmetric two-column editorial layout:
    - **Left Column**: High-resolution studio photograph (`IMG_5224_ef46a5a0.WEBP`) set inside an architectural gold offset guide-line frame, with an image counter (`01 / 04`) and caption strip.
    - **Right Column**: Eyebrow kicker, narrative paragraph, pull quote highlighted with a vertical gold line, highlight bullets, and a 3-part structured facts grid (**Focus**, **Approach**, **Capabilities**).
* **Mobile View (â‰¤ 720px)**:
  - Switches to a single vertical column.
  - Photograph takes top priority with responsive width (`min(100%, 572px)`), perfectly centered.
  - Story paragraphs, pull quote, and fact cards stack neatly beneath the image with touch-optimized line spacing.

---

### F. Section 02: What We Are Into (Offerings)
* **Desktop View**:
  - Left-to-right split heading with decorative celestial orbit motif.
  - Multi-column grid showcasing service capabilities with subtle hover elevation and border illumination.
* **Mobile View**:
  - Cards transition to a 2-column grid at `â‰¤ 900px`, and down to a single full-width card stack at `â‰¤ 560px`.

---

### G. Section 03: What We Make (Services with Substance)
* **Desktop View**:
  - Editorial header with broad description note.
  - Detailed service list displaying numbers (`01`, `02`, etc.), titles, and detailed deliverable descriptions side-by-side.
* **Mobile View**:
  - Stacked vertical flow with clear typographic separation between categories and descriptions.

---

### H. Section 04: A Glimpse (Gallery Preview)
* **Desktop View**:
  - Split heading with direct text link `"Enter the gallery â†—"`.
  - Curated masonry/preview grid displaying showcase images with subtle zoom-on-hover effect and category badges.
* **Mobile View**:
  - 2-column or single-column cards with touch interactions and clear tap targets to view the full gallery.

---

### I. Section 05: Contact & Quote Request Form
* **Desktop View**:
  - Two-column split layout (`.contact-grid`):
    - **Left Side**: Contact information, live links for Email (`angelsdisplaysolutionsllp@gmail.com`), WhatsApp/Phone (`+91 7799881118`), and studio address.
    - **Right Side**: Clean enquiry form with fields for Name, Email, Project Brief, and a dark pill submission button (`Prepare enquiry â†—`).
* **Mobile View**:
  - Stacks into one seamless block: Contact details first (with tap-to-call and tap-to-WhatsApp links), followed directly by full-width input fields and an easily tappable submit button.

---

### J. Site Footer
* **Desktop View**:
  - 3-column top footer:
    1. Brand mark & motto (*"Your vision. Our creation."*).
    2. Contact details & direct email/phone links.
    3. Social channels (WhatsApp, Email â†—, Instagram â†—).
  - Bottom row: Copyright notice, service tagline, and `"Back to top â†‘"` smooth scroll link.
* **Mobile View (â‰¤ 560px)**:
  - Stacks vertically with generous padding between links to prevent accidental taps.
  - Back to top link remains readily accessible at the bottom.

---

## 4. Gallery & Shop Page (`gallery.html`) Comparison

### A. Category Filter Bar & Sub-Shelves
* **Desktop View**:
  - Horizontal filter button row (`All`, `Display`, `Interior`, `Furniture`, `Packaging`) with active pill states.
  - Sub-category shelves (e.g. *Visual Merchandise*, *Bridal Set*, *Counter Stands*) expand below as horizontal selector chips.
  - Subtitle: *"Tap an image to enlarge"*.
* **Mobile View**:
  - Filter bar allows horizontal touch scrolling or wraps cleanly, keeping filter chips within easy thumb reach.
  - Display type shelf adapts into a 2-column grid (`â‰¤ 900px` & `â‰¤ 560px`).

---

### B. Gallery Grid (Masonry Display)
* **Desktop View**:
  - Multi-column masonry grid (3 to 4 columns) showcasing jewellery stands, showroom shots, and presentation trays in their original aspect ratios.
  - Hovering reveals overlay captions and subtle focus elevation.
* **Mobile View**:
  - Tablet (â‰¤ 720px): 2 columns.
  - Mobile (â‰¤ 480px): Collapses into a **single column** (`column-count: 1`), giving each image maximum width and clarity for viewing fine jewelry craftsmanship.

---

### C. Lightbox Modal (Enlarged Image View)
* **Desktop View**:
  - Centered high-contrast modal dialog over a dimmed backdrop.
  - Side-by-side layout: high-resolution image on the left, image title, category tag, and descriptive caption on the right.
  - Previous/Next navigation buttons positioned on the flanks (`â†` and `â†’`).
  - Action buttons: direct **Email Enquiry** and **WhatsApp Enquiry** pre-filled with the item name.
* **Mobile View (â‰¤ 560px)**:
  - Dialog fills the mobile viewport safely (`max-height: 90vh`).
  - Image displays on top, followed by caption and stacked contact buttons below.
  - Large close button (`âœ•`) in the top corner for effortless closing with one hand.

---

### D. Cart Drawer / Enquire Panel
* **Desktop View**:
  - Off-canvas drawer sliding in from the right edge.
  - Shows selected items, pricing/quantity, running subtotal in INR (`â‚¹`), and checkout enquiry CTA.
* **Mobile View**:
  - Covers full or near-full screen width with backdrop tap-to-dismiss.

---

## 5. Summary Quick Reference

| Feature | Desktop Experience | Mobile Experience |
| :--- | :--- | :--- |
| **Menu** | Horizontal top header links | Hamburger menu with slide-down overlay |
| **Hero Image** | Contained wide stage (`min(90vw, 1300px)`) | Gutter-aligned full responsive width |
| **Gallery Grid** | 3 â€“ 4 column masonry | 2 columns (tablet) â†’ 1 column (phones) |
| **Story / About** | Side-by-side image & editorial column | Stacked image on top, story below |
| **Contact Form** | Two-column split layout | Stacked single-column with full-width fields |
| **Lightbox** | Horizontal split dialog with arrows | Vertical mobile-fitted dialog with tap controls |
| **Interactions** | Mouse hover states & subtle scaling | Touch gestures, tap targets, reduced motion friendly |


