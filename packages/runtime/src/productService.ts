import type { Deal, Product } from "@locaguide/contracts";
import { NotFoundError } from "@locaguide/shared";
import { buildProviderRegistry } from "./registry";

export async function searchProducts(query: string, category?: string, limit = 20): Promise<Product[]> {
  const { productProvider } = buildProviderRegistry();
  return productProvider.search({ query, category, limit });
}

export async function getProductById(id: string): Promise<Product> {
  const { productProvider } = buildProviderRegistry();
  const product = await productProvider.getById(id);
  if (!product) throw new NotFoundError("PRODUCT_NOT_FOUND", "Product could not be found.");
  return product;
}

export async function getActiveDealsForProduct(productId: string): Promise<Deal[]> {
  const { dealProvider } = buildProviderRegistry();
  return dealProvider.getActiveDealsForProduct(productId);
}
