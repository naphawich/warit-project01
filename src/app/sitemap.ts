import type { MetadataRoute } from "next";
import { courses } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/courses", "/privacy", "/terms"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
  const coursePages = courses.map((c) => ({
    url: `${SITE_URL}/courses/${c.id}`,
  }));
  return [...pages, ...coursePages];
}
