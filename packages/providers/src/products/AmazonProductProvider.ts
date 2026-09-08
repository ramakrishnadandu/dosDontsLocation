import type { Product } from "@locaguide/contracts";
import { ProviderError } from "@locaguide/shared";
import type { ProductProvider, ProductSearchQuery } from "./ProductProvider";

/**
 * Placeholder adapter for the Amazon Product Advertising API (PA-API 5.0).
 *
 * NOT IMPLEMENTED beyond the interface: PA-API requires AWS Signature V4
 * request signing, an approved Associates account, and a live affiliate
 * relationship to test against - none of which are available in this
 * environment. Wiring the signer up is a well-scoped follow-up (see
 * docs/provider-architecture.md). Required credentials: AMAZON_API_KEY,
 * AMAZON_API_SECRET, and an Amazon Associates partner tag.
 *
 * This class exists so the ProductProvider abstraction and provider
 * registry are already in place; swap MockProductProvider for this once
 * credentials + signing are wired up. It always reports isConfigured=false
 * so the application safely falls back to the mock provider.
 */
export class AmazonProductProvider implements ProductProvider {
  readonly name = "amazon";
  readonly isConfigured = false;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly apiSecret: string | undefined,
  ) {}

  async search(_query: ProductSearchQuery): Promise<Product[]> {
    throw new ProviderError(
      this.name,
      "Amazon Product Advertising API integration is not yet implemented. Configure AMAZON_API_KEY/AMAZON_API_SECRET and implement request signing, or use MockProductProvider.",
    );
  }

  async getById(_id: string): Promise<Product | null> {
    throw new ProviderError(this.name, "Amazon Product Advertising API integration is not yet implemented.");
  }

  async getProductsForEntity(_entityId: string): Promise<Product[]> {
    // Amazon has no concept of "sold at this physical location" - always
    // empty rather than guessing, same reasoning as ProductProvider's doc
    // comment. Never reached anyway since isConfigured is always false.
    return [];
  }
}
