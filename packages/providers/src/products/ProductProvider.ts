import type { Deal, Product } from "@locaguide/contracts";

export interface ProductSearchQuery {
  query: string;
  category?: string;
  limit?: number;
}

/**
 * Provider-agnostic interface for product/commerce data.
 * Implementations: MockProductProvider (always available),
 * AmazonProductProvider (requires an approved Product Advertising API
 * credential - see docs/provider-architecture.md).
 */
export interface ProductProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  search(query: ProductSearchQuery): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;

  /**
   * Products genuinely associated with a specific location (section 43's
   * PRODUCTS recommendation category). Returns [] rather than guessing by
   * category similarity - showing "products commonly found at malls" as if
   * they were confirmed to be sold at THIS mall would be exactly the kind
   * of fabrication section 42 forbids. A provider only returns something
   * here when it has a real product-location association to offer.
   */
  getProductsForEntity(entityId: string): Promise<Product[]>;
}

export interface DealProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  getActiveDealsForProduct(productId: string): Promise<Deal[]>;
}
