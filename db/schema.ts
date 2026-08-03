import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const siteSettings = sqliteTable("site_settings", {
  id: text("id").primaryKey(),
  theme: text("theme").notNull(),
  accent: text("accent").notNull(),
  secondary: text("secondary").notNull(),
  intensity: real("intensity").notNull(),
  motion: real("motion").notNull(),
  grain: integer("grain", { mode: "boolean" }).notNull(),
  adminEmail: text("admin_email"),
  updatedAt: text("updated_at").notNull(),
});

export const siteContent = sqliteTable("site_content", {
  id: text("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  locationLabel: text("location_label").notNull(),
  heroFirst: text("hero_first").notNull(),
  heroSecond: text("hero_second").notNull(),
  tagline: text("tagline").notNull(),
  manifestoPrefix: text("manifesto_prefix").notNull(),
  manifestoHighlight: text("manifesto_highlight").notNull(),
  manifestoSuffix: text("manifesto_suffix").notNull(),
  introNote: text("intro_note").notNull(),
  contactFirst: text("contact_first").notNull(),
  contactSecond: text("contact_second").notNull(),
  contactEmail: text("contact_email").notNull(),
  projectsJson: text("projects_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});
