import { env } from "cloudflare:workers";

export type ProjectContent = {
  name: string;
  type: string;
  note: string;
};

export type SiteContent = {
  brandName: string;
  locationLabel: string;
  heroFirst: string;
  heroSecond: string;
  tagline: string;
  manifestoPrefix: string;
  manifestoHighlight: string;
  manifestoSuffix: string;
  introNote: string;
  contactFirst: string;
  contactSecond: string;
  contactEmail: string;
  projects: ProjectContent[];
};

type SiteContentInput = Partial<Omit<SiteContent, "projects">> & {
  projects?: unknown;
};

type SiteContentRow = Omit<SiteContent, "projects"> & {
  projects_json: string;
};

export const defaultSiteContent: SiteContent = {
  brandName: "五等分的zako",
  locationLabel: "SHANGHAI · 2026",
  heroFirst: "DIGITAL",
  heroSecond: "ATELIER.",
  tagline: "设计界面，也设计它们发生的空间。",
  manifestoPrefix: "在秩序与未知之间，构建",
  manifestoHighlight: "安静而有生命力",
  manifestoSuffix: "的数字体验。",
  introNote:
    "Visual systems, interfaces and experiments shaped by clarity, motion and material.",
  contactFirst: "LET'S MAKE",
  contactSecond: "THE NEXT THING.",
  contactEmail: "hello@example.com",
  projects: [
    {
      name: "AETHER CONSOLE",
      type: "INTERFACE SYSTEM",
      note: "将复杂信息压缩成安静、清晰的操作界面。",
    },
    {
      name: "LUMEN ARCHIVE",
      type: "DIGITAL IDENTITY",
      note: "围绕光、秩序和时间建立的数字视觉语言。",
    },
    {
      name: "FIELD NOTES",
      type: "EXPERIMENTAL EDITORIAL",
      note: "持续记录界面、字体与日常观察的实验空间。",
    },
  ],
};

const createSiteContentTableSql = `
  CREATE TABLE IF NOT EXISTS site_content (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    location_label TEXT NOT NULL,
    hero_first TEXT NOT NULL,
    hero_second TEXT NOT NULL,
    tagline TEXT NOT NULL,
    manifesto_prefix TEXT NOT NULL,
    manifesto_highlight TEXT NOT NULL,
    manifesto_suffix TEXT NOT NULL,
    intro_note TEXT NOT NULL,
    contact_first TEXT NOT NULL,
    contact_second TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    projects_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

function getDatabase(): D1Database | null {
  return env.DB ?? null;
}

async function ensureSiteContent() {
  const database = getDatabase();
  if (!database) return null;

  await database.prepare(createSiteContentTableSql).run();
  await database
    .prepare(
      `INSERT OR IGNORE INTO site_content
        (id, brand_name, location_label, hero_first, hero_second, tagline,
         manifesto_prefix, manifesto_highlight, manifesto_suffix, intro_note,
         contact_first, contact_second, contact_email, projects_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      "global",
      defaultSiteContent.brandName,
      defaultSiteContent.locationLabel,
      defaultSiteContent.heroFirst,
      defaultSiteContent.heroSecond,
      defaultSiteContent.tagline,
      defaultSiteContent.manifestoPrefix,
      defaultSiteContent.manifestoHighlight,
      defaultSiteContent.manifestoSuffix,
      defaultSiteContent.introNote,
      defaultSiteContent.contactFirst,
      defaultSiteContent.contactSecond,
      defaultSiteContent.contactEmail,
      JSON.stringify(defaultSiteContent.projects),
      new Date().toISOString(),
    )
    .run();
  return database;
}

function cleanText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim().replace(/\s+/g, " ").slice(0, maxLength);
  return cleaned || fallback;
}

function sanitizeProjects(value: unknown): ProjectContent[] {
  const source = Array.isArray(value) ? value : defaultSiteContent.projects;
  return defaultSiteContent.projects.map((fallback, index) => {
    const item = source[index] as Partial<ProjectContent> | undefined;
    return {
      name: cleanText(item?.name, fallback.name, 52),
      type: cleanText(item?.type, fallback.type, 52),
      note: cleanText(item?.note, fallback.note, 120),
    };
  });
}

export function sanitizeSiteContent(value: SiteContentInput): SiteContent {
  const email = cleanText(value.contactEmail, defaultSiteContent.contactEmail, 120);
  return {
    brandName: cleanText(value.brandName, defaultSiteContent.brandName, 40),
    locationLabel: cleanText(value.locationLabel, defaultSiteContent.locationLabel, 40),
    heroFirst: cleanText(value.heroFirst, defaultSiteContent.heroFirst, 18),
    heroSecond: cleanText(value.heroSecond, defaultSiteContent.heroSecond, 18),
    tagline: cleanText(value.tagline, defaultSiteContent.tagline, 80),
    manifestoPrefix: cleanText(value.manifestoPrefix, defaultSiteContent.manifestoPrefix, 60),
    manifestoHighlight: cleanText(value.manifestoHighlight, defaultSiteContent.manifestoHighlight, 40),
    manifestoSuffix: cleanText(value.manifestoSuffix, defaultSiteContent.manifestoSuffix, 60),
    introNote: cleanText(value.introNote, defaultSiteContent.introNote, 220),
    contactFirst: cleanText(value.contactFirst, defaultSiteContent.contactFirst, 28),
    contactSecond: cleanText(value.contactSecond, defaultSiteContent.contactSecond, 28),
    contactEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? email
      : defaultSiteContent.contactEmail,
    projects: sanitizeProjects(value.projects),
  };
}

function rowToContent(row: SiteContentRow): SiteContent {
  let projects: unknown = defaultSiteContent.projects;
  try {
    projects = JSON.parse(row.projects_json);
  } catch {
    projects = defaultSiteContent.projects;
  }
  return sanitizeSiteContent({ ...row, projects });
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const database = await ensureSiteContent();
    if (!database) return defaultSiteContent;
    const row = await database
      .prepare(
        `SELECT brand_name AS brandName, location_label AS locationLabel,
                hero_first AS heroFirst, hero_second AS heroSecond, tagline,
                manifesto_prefix AS manifestoPrefix,
                manifesto_highlight AS manifestoHighlight,
                manifesto_suffix AS manifestoSuffix, intro_note AS introNote,
                contact_first AS contactFirst, contact_second AS contactSecond,
                contact_email AS contactEmail, projects_json
         FROM site_content WHERE id = ?`,
      )
      .bind("global")
      .first<SiteContentRow>();
    return row ? rowToContent(row) : defaultSiteContent;
  } catch {
    return defaultSiteContent;
  }
}

export async function updateSiteContent(
  value: Partial<SiteContent>,
  userEmail: string,
) {
  const database = await ensureSiteContent();
  if (!database) throw new Error("The global content database is unavailable.");

  const admin = await database
    .prepare("SELECT admin_email FROM site_settings WHERE id = ?")
    .bind("global")
    .first<{ admin_email: string | null }>();

  if (!admin?.admin_email || admin.admin_email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error("This account is not the site administrator.");
  }

  const content = sanitizeSiteContent(value);
  await database
    .prepare(
      `UPDATE site_content SET
        brand_name = ?, location_label = ?, hero_first = ?, hero_second = ?,
        tagline = ?, manifesto_prefix = ?, manifesto_highlight = ?,
        manifesto_suffix = ?, intro_note = ?, contact_first = ?,
        contact_second = ?, contact_email = ?, projects_json = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      content.brandName,
      content.locationLabel,
      content.heroFirst,
      content.heroSecond,
      content.tagline,
      content.manifestoPrefix,
      content.manifestoHighlight,
      content.manifestoSuffix,
      content.introNote,
      content.contactFirst,
      content.contactSecond,
      content.contactEmail,
      JSON.stringify(content.projects),
      new Date().toISOString(),
      "global",
    )
    .run();
  return content;
}
