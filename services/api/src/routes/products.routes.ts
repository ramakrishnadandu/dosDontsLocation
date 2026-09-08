import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateQuery } from "../middleware/validate";
import { getActiveDealsForProduct, getProductById, searchProducts } from "@locaguide/runtime";

export const productsRouter = Router();

const SearchQuery = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

productsRouter.get(
  "/search",
  validateQuery(SearchQuery),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof SearchQuery>;
    const items = await searchProducts(q.q, q.category, q.limit);
    res.json({ items });
  }),
);

productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await getProductById(req.params.id!);
    res.json(product);
  }),
);

productsRouter.get(
  "/:id/deals",
  asyncHandler(async (req, res) => {
    const deals = await getActiveDealsForProduct(req.params.id!);
    res.json({ items: deals });
  }),
);
