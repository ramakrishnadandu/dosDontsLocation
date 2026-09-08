import { z } from "zod";

export const Product = z.object({
  id: z.string(),
  title: z.string(),
  brand: z.string().nullable(),
  category: z.string(),
  price: z.number().nonnegative().nullable(),
  currency: z.string().length(3).nullable(),
  rating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative().nullable(),
  availability: z.enum(["IN_STOCK", "OUT_OF_STOCK", "LIMITED", "UNKNOWN"]),
  seller: z.string().nullable(),
  source: z.string(),
  sourceProductId: z.string(),
  warranty: z.string().nullable(),
  returnInformation: z.string().nullable(),
  isDemoData: z.boolean().default(false),
  fetchedAt: z.string().datetime(),
});
export type Product = z.infer<typeof Product>;

export const ProductAnalysis = z.object({
  productId: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  reviewThemes: z.array(z.string()),
  valueConsiderations: z.array(z.string()),
  alternativeProductIds: z.array(z.string()),
  generatedAt: z.string().datetime(),
});
export type ProductAnalysis = z.infer<typeof ProductAnalysis>;

export const Deal = z.object({
  id: z.string(),
  productId: z.string(),
  merchant: z.string(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().nullable(),
  discountPercent: z.number().min(0).max(100).nullable(),
  currency: z.string().length(3),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  source: z.string(),
  verifiedAt: z.string().datetime(),
});
export type Deal = z.infer<typeof Deal>;

export function isDealActive(deal: Pick<Deal, "validFrom" | "validUntil">, now: Date = new Date()): boolean {
  const nowMs = now.getTime();
  return new Date(deal.validFrom).getTime() <= nowMs && nowMs <= new Date(deal.validUntil).getTime();
}
