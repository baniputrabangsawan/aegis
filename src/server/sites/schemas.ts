import { z } from "zod";

export const siteEnvironmentSchema = z.enum(["PRODUCTION", "STAGING", "DEVELOPMENT"]);
export const securityModeSchema = z.enum(["MONITOR_ONLY", "MONITOR_AND_ENFORCE"]);

export const createSiteSchema = z.object({
  name: z.string().trim().min(2).max(80),
  domain: z.string().trim().min(1).max(2048),
  environment: siteEnvironmentSchema,
  securityMode: securityModeSchema.default("MONITOR_ONLY"),
  retentionDays: z.number().int().refine((value) => [30, 90, 180].includes(value), "Retention must be 30, 90, or 180 days"),
});

export const updateSiteSchema = createSiteSchema.partial().refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const createCredentialSchema = z.object({
  siteId: z.string().startsWith("site_").max(80),
  name: z.string().trim().min(2).max(80),
  environment: siteEnvironmentSchema,
  expiresAt: z.iso.datetime({ offset: true }).optional(),
});

export type CreateSiteInput = z.output<typeof createSiteSchema>;
export type UpdateSiteInput = z.output<typeof updateSiteSchema>;
export type CreateCredentialInput = z.output<typeof createCredentialSchema>;
