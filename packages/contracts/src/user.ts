import { z } from "zod";

export const Role = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "ANALYST",
  "SUPPORT",
  "USER",
]);
export type Role = z.infer<typeof Role>;

export const UserPublicProfile = z.object({
  id: z.string(),
  displayName: z.string(),
  reviewCount: z.number().int().nonnegative(),
  tipCount: z.number().int().nonnegative(),
  photoCount: z.number().int().nonnegative(),
  helpfulVotesReceived: z.number().int().nonnegative(),
  memberSince: z.string().datetime(),
});
export type UserPublicProfile = z.infer<typeof UserPublicProfile>;

export const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(128),
  displayName: z.string().min(2).max(60),
  preferredLanguage: z.enum(["en", "hi", "te"]).default("en"),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const Preferences = z.object({
  userId: z.string(),
  budgetLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable(),
  travelingWithFamily: z.boolean().nullable(),
  interests: z.array(z.string()).default([]),
  accessibilityRequirements: z.array(z.string()).default([]),
  preferredLanguage: z.enum(["en", "hi", "te"]).default("en"),
  dietaryPreferences: z.array(z.string()).default([]),
  updatedAt: z.string().datetime(),
});
export type Preferences = z.infer<typeof Preferences>;

export const UpdatePreferencesInput = Preferences.pick({
  budgetLevel: true,
  travelingWithFamily: true,
  interests: true,
  accessibilityRequirements: true,
  preferredLanguage: true,
  dietaryPreferences: true,
}).partial();
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesInput>;
