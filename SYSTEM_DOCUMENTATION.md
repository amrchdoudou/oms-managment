# Mstore Admin (DHD COD Manager) - System Documentation

This file serves as a ledger of all the functions and features built into this system. As new features are requested, added, or modified, this file will be updated to reflect those changes.

## 1. Application Architecture
- **Framework:** React + Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **UI Components:** shadcn/ui components (Dialog, Input, Select, Tabs, etc.), custom CSS styling

## 2. Storefront (Client-side)
- `StoreFront.tsx`: Main entry point for the customer interface.
- `ProductPage.tsx`: Single product view for the store.
- **Pixels (Tracking):** Loads pixels (Meta, TikTok, etc.) globally to track conversions (`pixelService.ts`).

## 3. Authentication
- `Login.tsx` & `Signup.tsx`: Client and Admin login interface.

## 4. Admin Dashboard (`/admin`)
### 4.1. Dashboard (`Dashboard.tsx`)
- Displays overall statistics: Total Revenue, Conversion Rate, Total Orders, Average Order Value.
- Tracks recent synchronizations with Ecotrack.

### 4.2. Products (`ProductsAdmin.tsx`)
- Lists all products in the store.
- Displays product images, names, prices, and stock.
- Allows editing product details and navigating to the Product Designer or Form Builder.

### 4.3. Product Designer (`ProductDesignerAdmin.tsx` & `ProductContentBuilder.tsx`)
- **Product Content Builder:** A visual editor to design landing pages for specific products.
- **Section Types Supported:**
  1. `hero`: Hero banner with images.
  2. `features`: List of product features/benefits.
  3. `image-with-text`: Image combined with description.
  4. `image-only`: Full-width image display.
  5. `image-gallery`: Grid gallery of images.
  6. `rich-text`: HTML/WYSIWYG editor.
  7. `video`: Video embeds.
  8. `form`: Checkout/Lead forms.
  9. `reviews`: Customer reviews.
  10. `recommended-products`: Upsells/Cross-sells.
- Preview mode allows viewing the landing page in Mobile or Desktop layouts.

### 4.4. Form Builder (`FormBuilderAdmin.tsx`)
- Customizes checkout and lead-gen forms for products.

### 4.5. Store Builder (`StoreBuilderAdmin.tsx`)
- Manages general storefront blocks and layout customization.

### 4.6. Orders Management (`OrdersAdmin.tsx`)
- **Key Stats:** View Total Orders, Confirmed, Cancelled, and Unanswered counts.
- **Bulk Selection:** Select multiple orders for grouped actions.
- **Custom Styling:** High-end visual cards and shadow layouts for data tables and statistics.
- **Features:**
  - View Order ID, Tracking Number, Client Name, and total price.
  - Quick-Call feature: Phone numbers are clickable (`tel:` links) to rapidly call clients directly through system phone dialer apps.
  - Delivery Location: Wilaya and Commune selection with "Stop Desk" (relais/pickup points) indicator.
  - **Statuses:** Nouveau (New), Confirmé (Confirmed), Annulé (Canceled), Pas répondu (No answer), En attente (Waiting), Expédié (Shipped), En livraison (Out for delivery), Livré non encaissé, Encaissé non payé, Suspendu.
- **Order Creation Modal:** Create a new order manually (add client name, phone, chosen wilaya, commune, associated product, price, stop desk option). Uses `ALGERIA_WILAYAS` data.
- **Delivery Synchronization:**
  - Sync orders with tracking status directly to Ecotrack and Yalidine.
  - Perform bulk export or creation of parcels to Yalidine and Ecotrack.

### 4.7. Shipping Fees (`ShippingFeesAdmin.tsx`)
- View and edit shipping cost structure by Wilaya (48/58 Wilayas in Algeria).
- Configure "Home Delivery" (Domicile) vs "Stop Desk" (Point Relais) rates.

### 4.8. Settings (`SettingsAdmin.tsx`)
- Modifies broader storefront configurations, themes, admin user management, API keys for Delivery Providers (Yalidine, Ecotrack), and Pixel IDs.

---

*(Note: Whenever an operational function changes in the system, this document will be updated.)*
