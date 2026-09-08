import type { Deal, Product } from "@locaguide/contracts";

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-product-1",
    title: "AeroFlow Wireless Headphones",
    brand: "AeroFlow",
    category: "electronics",
    price: 2499,
    currency: "INR",
    rating: 4.3,
    reviewCount: 1840,
    availability: "IN_STOCK",
    seller: "Demo Electronics Store",
    source: "mock",
    sourceProductId: "demo-product-1",
    warranty: "1 year manufacturer warranty",
    returnInformation: "10-day return window, unopened packaging",
    isDemoData: true,
    fetchedAt: new Date().toISOString(),
  },
  {
    id: "demo-product-2",
    title: "TrailPro Running Shoes",
    brand: "TrailPro",
    category: "footwear",
    price: 3299,
    currency: "INR",
    rating: 4.1,
    reviewCount: 960,
    availability: "IN_STOCK",
    seller: "Demo Sportswear",
    source: "mock",
    sourceProductId: "demo-product-2",
    warranty: null,
    returnInformation: "15-day return window",
    isDemoData: true,
    fetchedAt: new Date().toISOString(),
  },
];

/**
 * Explicit demo entity -> product associations for the PRODUCTS
 * recommendation category (section 43). Deliberately a real, named
 * mapping rather than "products in a similar category" - see
 * ProductProvider#getProductsForEntity's doc comment for why a category
 * guess would be a hallucination-control violation.
 */
export const DEMO_ENTITY_PRODUCT_LINKS: Record<string, string[]> = {
  "demo-mall-1": ["demo-product-1", "demo-product-2"],
};

export const DEMO_DEALS: Deal[] = [
  {
    id: "demo-deal-1",
    productId: "demo-product-1",
    merchant: "Demo Electronics Store",
    price: 1999,
    originalPrice: 2499,
    discountPercent: 20,
    currency: "INR",
    validFrom: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: "mock",
    verifiedAt: new Date().toISOString(),
  },
];
