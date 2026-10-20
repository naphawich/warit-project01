import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Account, checkout, and admin pages are per-user — keep them out of search.
      disallow: ["/admin", "/api/", "/cart", "/checkout", "/learn", "/my-courses", "/profile"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
