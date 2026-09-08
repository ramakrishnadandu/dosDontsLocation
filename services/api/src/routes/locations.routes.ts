import { Router } from "express";
import { z } from "zod";
import { EntityCategory } from "@locaguide/contracts";
import { asyncHandler } from "../middleware/asyncHandler";
import { optionalAuth } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { getEntityById, searchByText, searchNearby, generateBriefing, getAspectSignals, listOpinionsForEntity } from "@locaguide/runtime";

export const locationsRouter = Router();

const NearbyQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().positive().max(50000).default(1500),
  category: EntityCategory.optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

locationsRouter.get(
  "/nearby",
  validateQuery(NearbyQuery),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof NearbyQuery>;
    const results = await searchNearby({
      location: { latitude: q.lat, longitude: q.lng },
      radiusMeters: q.radiusMeters,
      category: q.category,
      limit: q.limit,
    });
    res.json({ items: results });
  }),
);

const SearchQuery = z.object({
  q: z.string().min(1).max(200),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  category: EntityCategory.optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

locationsRouter.get(
  "/search",
  validateQuery(SearchQuery),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof SearchQuery>;
    const results = await searchByText({
      query: q.q,
      near: q.lat !== undefined && q.lng !== undefined ? { latitude: q.lat, longitude: q.lng } : undefined,
      category: q.category,
      limit: q.limit,
    });
    res.json({ items: results });
  }),
);

locationsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const entity = await getEntityById(req.params.id!);
    res.json(entity);
  }),
);

/**
 * The core LocaGuide "briefing" endpoint (section 2/43): identifies the
 * location, gathers evidence (facts, review signals, community opinions),
 * and returns an evidence-grounded set of DO/CONSIDER/WATCH/MUST_SEE/
 * SPENDING/GENERAL_TIPS/HEALTH_AWARE items.
 */
locationsRouter.get(
  "/:id/intelligence",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const evidence = await generateBriefing(req.params.id!, req.user?.id);
    res.json({ entityId: req.params.id, evidence });
  }),
);

locationsRouter.get(
  "/:id/reviews/signals",
  asyncHandler(async (req, res) => {
    const timeWindow = (req.query.timeWindow as string) ?? "recent";
    const signals = await getAspectSignals(req.params.id!, timeWindow as never);
    res.json({ items: signals });
  }),
);

locationsRouter.get(
  "/:id/community",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const result = await listOpinionsForEntity(req.params.id!, page, pageSize);
    res.json(result);
  }),
);
