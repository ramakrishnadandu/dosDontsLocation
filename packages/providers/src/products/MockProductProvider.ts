import type { Deal, Product } from "@locaguide/contracts";
import { isDealActive } from "@locaguide/contracts";
import type { DealProvider, ProductProvider, ProductSearchQuery } from "./ProductProvider";
import { DEMO_DEALS, DEMO_ENTITY_PRODUCT_LINKS, DEMO_PRODUCTS } from "./demoProducts";

export class MockProductProvider implements ProductProvider {
  readonly name = "mock";
  readonly isConfigured = true;

  constructor(private readonly products: Product[] = DEMO_PRODUCTS) {}

  async search(query: ProductSearchQuery): Promise<Product[]> {
    const needle = query.query.trim().toLowerCase();
    return this.products
      .filter((p) => !query.category || p.category === query.category)
      .filter((p) => p.title.toLowerCase().includes(needle) || (p.brand ?? "").toLowerCase().includes(needle))
      .slice(0, query.limit ?? 20);
  }

  async getById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async getProductsForEntity(entityId: string): Promise<Product[]> {
    const productIds = DEMO_ENTITY_PRODUCT_LINKS[entityId] ?? [];
    return productIds.map((id) => this.products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p));
  }
}

export class MockDealProvider implements DealProvider {
  readonly name = "mock";
  readonly isConfigured = true;

  constructor(private readonly deals: Deal[] = DEMO_DEALS) {}

  async getActiveDealsForProduct(productId: string): Promise<Deal[]> {
    return this.deals.filter((d) => d.productId === productId && isDealActive(d));
  }
}
