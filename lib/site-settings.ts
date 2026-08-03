import { env } from "cloudflare:workers";

export const backgroundThemes = ["orbital", "aurora", "monolith"] as const;

export type BackgroundTheme = (typeof backgroundThemes)[number];

export type SiteSettings = {
  theme: BackgroundTheme;
  accent: string;
  secondary: string;
  intensity: number;
  motion: number;
  grain: boolean;
};

type SiteSettingsRow = {
  theme: string;
  accent: string;
  secondary: string;
  intensity: number;
  motion: number;
  grain: number;
  admin_email: string | null;
};

export const defaultSiteSettings: SiteSettings = {
  theme: "orbital",
  accent: "#dfff00",
  secondary: "#3758ff",
  intensity: 72,
  motion: 46,
  grain: true,
};

const createSettingsTableSql = `
  CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY,
    theme TEXT NOT NULL,
    accent TEXT NOT NULL,
    secondary TEXT NOT NULL,
    intensity REAL NOT NULL,
    motion REAL NOT NULL,
    grain INTEGER NOT NULL,
    admin_email TEXT,
    updated_at TEXT NOT NULL
  )
`;

function getDatabase(): D1Database | null {
  return env.DB ?? null;
}

async function ensureSiteSettings() {
  const database = getDatabase();
  if (!database) return null;

  await database.prepare(createSettingsTableSql).run();
  await database
    .prepare(
      `INSERT OR IGNORE INTO site_settings
        (id, theme, accent, secondary, intensity, motion, grain, admin_email, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
    )
    .bind(
      "global",
      defaultSiteSettings.theme,
      defaultSiteSettings.accent,
      defaultSiteSettings.secondary,
      defaultSiteSettings.intensity,
      defaultSiteSettings.motion,
      defaultSiteSettings.grain ? 1 : 0,
      new Date().toISOString(),
    )
    .run();

  return database;
}

function normalizeTheme(value: string): BackgroundTheme {
  return backgroundThemes.includes(value as BackgroundTheme)
    ? (value as BackgroundTheme)
    : defaultSiteSettings.theme;
}

function normalizeColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : fallback;
}

function normalizeNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(100, Math.max(0, numeric));
}

function rowToSettings(row: SiteSettingsRow): SiteSettings {
  return {
    theme: normalizeTheme(row.theme),
    accent: normalizeColor(row.accent, defaultSiteSettings.accent),
    secondary: normalizeColor(row.secondary, defaultSiteSettings.secondary),
    intensity: normalizeNumber(row.intensity, defaultSiteSettings.intensity),
    motion: normalizeNumber(row.motion, defaultSiteSettings.motion),
    grain: Boolean(row.grain),
  };
}

export function sanitizeSettings(value: Partial<SiteSettings>): SiteSettings {
  return {
    theme: normalizeTheme(String(value.theme ?? defaultSiteSettings.theme)),
    accent: normalizeColor(value.accent, defaultSiteSettings.accent),
    secondary: normalizeColor(value.secondary, defaultSiteSettings.secondary),
    intensity: normalizeNumber(value.intensity, defaultSiteSettings.intensity),
    motion: normalizeNumber(value.motion, defaultSiteSettings.motion),
    grain: value.grain !== false,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const database = await ensureSiteSettings();
    if (!database) return defaultSiteSettings;

    const row = await database
      .prepare(
        `SELECT theme, accent, secondary, intensity, motion, grain, admin_email
         FROM site_settings WHERE id = ?`,
      )
      .bind("global")
      .first<SiteSettingsRow>();

    return row ? rowToSettings(row) : defaultSiteSettings;
  } catch {
    return defaultSiteSettings;
  }
}

export async function getEditorAccess(email: string) {
  const database = await ensureSiteSettings();
  if (!database) return { canEdit: true, claimed: false };

  const row = await database
    .prepare("SELECT admin_email FROM site_settings WHERE id = ?")
    .bind("global")
    .first<{ admin_email: string | null }>();

  const adminEmail = row?.admin_email?.toLowerCase() ?? null;
  return {
    canEdit: adminEmail === null || adminEmail === email.toLowerCase(),
    claimed: adminEmail !== null,
  };
}

export async function updateSiteSettings(
  value: Partial<SiteSettings>,
  userEmail: string,
) {
  const database = await ensureSiteSettings();
  if (!database) throw new Error("The global settings database is unavailable.");

  const settings = sanitizeSettings(value);
  const result = await database
    .prepare(
      `UPDATE site_settings
       SET theme = ?, accent = ?, secondary = ?, intensity = ?, motion = ?,
           grain = ?, admin_email = COALESCE(admin_email, ?), updated_at = ?
       WHERE id = ? AND (admin_email IS NULL OR lower(admin_email) = lower(?))`,
    )
    .bind(
      settings.theme,
      settings.accent,
      settings.secondary,
      settings.intensity,
      settings.motion,
      settings.grain ? 1 : 0,
      userEmail,
      new Date().toISOString(),
      "global",
      userEmail,
    )
    .run();

  if (!result.meta.changes) {
    throw new Error("This site is already claimed by another administrator.");
  }

  return settings;
}
