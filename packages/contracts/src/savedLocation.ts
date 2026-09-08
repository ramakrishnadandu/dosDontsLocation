import { z } from "zod";

/**
 * Section 48 (Favorites/Saved Locations). A saved location either points at
 * a known Entity (favorited from search/details) or is a freeform place the
 * user added by pasting a Google Maps link/address - see
 * packages/domain/src/googleMaps for how sourceUrl gets parsed into
 * name/latitude/longitude server-side.
 */
export const SavedLocation = z.object({
  id: z.string(),
  entityId: z.string().nullable(),
  label: z.string(),
  note: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: z.string().datetime(),
});
export type SavedLocation = z.infer<typeof SavedLocation>;

export const AddSavedLocationInput = z
  .object({
    entityId: z.string().optional(),
    label: z.string().min(1).max(140).optional(),
    note: z.string().max(1000).optional(),
    sourceUrl: z.string().url().max(2000).optional(),
  })
  .refine((v) => Boolean(v.entityId || v.label || v.sourceUrl), {
    message: "Provide at least one of entityId, label, or sourceUrl.",
  });
export type AddSavedLocationInput = z.infer<typeof AddSavedLocationInput>;
