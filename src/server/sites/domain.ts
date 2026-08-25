import { AppError } from "@/server/http/errors";
import type { SiteEnvironment } from "@/generated/prisma/enums";

export function normalizeSiteDomain(input: string, environment: SiteEnvironment) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new AppError("BAD_REQUEST", 400, "Website domain must be a valid absolute URL");
  }
  if (url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
    throw new AppError("BAD_REQUEST", 400, "Website domain must contain only scheme, host, and optional port");
  }
  const localDevelopment = environment === "DEVELOPMENT" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(localDevelopment && url.protocol === "http:")) {
    throw new AppError("BAD_REQUEST", 400, "HTTPS is required except for local development sites");
  }
  return url.origin.toLowerCase();
}

export function siteSlug(name: string) {
  const slug = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  return slug || "site";
}
