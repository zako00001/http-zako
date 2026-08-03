"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { SiteContent } from "@/lib/site-content";
import type { BackgroundTheme, SiteSettings } from "@/lib/site-settings";

type BackgroundStudioProps = {
  initialSettings: SiteSettings;
  initialContent: SiteContent;
  displayName: string;
  email: string;
  canEdit: boolean;
  claimed: boolean;
  signOutPath: string;
};

type EditorMode = "identity" | "background" | "projects";

const themes: Array<{
  id: BackgroundTheme;
  name: string;
  description: string;
}> = [
  { id: "orbital", name: "轨道网格", description: "几何圆阵与鼠标光场" },
  { id: "aurora", name: "光谱雾", description: "缓慢漂移的柔和色域" },
  { id: "monolith", name: "极夜光柱", description: "克制的暗色深度与竖向光线" },
];

export function BackgroundStudio({
  initialSettings,
  initialContent,
  displayName,
  email,
  canEdit,
  claimed,
  signOutPath,
}: BackgroundStudioProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<EditorMode>("identity");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const previewStyle = {
    "--preview-accent": settings.accent,
    "--preview-secondary": settings.secondary,
    "--preview-intensity": settings.intensity / 100,
    "--preview-speed": `${Math.max(7, 40 - settings.motion * 0.3)}s`,
  } as CSSProperties;

  function updateContent<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  function updateProject(index: number, key: "name" | "type" | "note", value: string) {
    updateContent(
      "projects",
      content.projects.map((project, projectIndex) =>
        projectIndex === index ? { ...project, [key]: value } : project,
      ),
    );
  }

  async function saveEverything() {
    if (!canEdit) return;
    setStatus("saving");
    setMessage("");

    const settingsResponse = await fetch("/api/site-settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    const settingsResult = (await settingsResponse.json()) as {
      error?: string;
      settings?: SiteSettings;
    };

    if (!settingsResponse.ok || !settingsResult.settings) {
      setStatus("error");
      setMessage(settingsResult.error ?? "保存失败，请稍后再试。");
      return;
    }

    const contentResponse = await fetch("/api/site-content", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(content),
    });
    const contentResult = (await contentResponse.json()) as {
      error?: string;
      content?: SiteContent;
    };

    if (!contentResponse.ok || !contentResult.content) {
      setStatus("error");
      setMessage(contentResult.error ?? "文字内容没有保存成功，请重试。");
      return;
    }

    setSettings(settingsResult.settings);
    setContent(contentResult.content);
    setStatus("saved");
    setMessage(claimed ? "全部修改已发布到网站。" : "管理员身份已锁定，全部修改已发布。");
  }

  return (
    <main className="studio-shell">
      <header className="studio-header">
        <a href="/" className="studio-brand">{content.brandName} / STUDIO</a>
        <div>
          <span>{displayName}</span>
          <a href="/" target="_blank" rel="noreferrer">查看网站</a>
          <a href={signOutPath}>退出</a>
        </div>
      </header>

      <section className="studio-intro">
        <div>
          <p className="section-label">[ VISUAL SITE EDITOR ]</p>
          <h1>站长工作台</h1>
        </div>
        <p>
          像填写表格一样修改网站。右侧会立即预览效果，满意后点击一次发布即可。
        </p>
      </section>

      {!canEdit && (
        <div className="studio-warning" role="alert">
          当前账号 {email} 不是这个网站的管理员，因此只能查看设置。
        </div>
      )}

      <div className="studio-tabs" role="tablist" aria-label="编辑内容分类">
        <button className={mode === "identity" ? "active" : ""} onClick={() => setMode("identity")}>
          01 名称与文案
        </button>
        <button className={mode === "background" ? "active" : ""} onClick={() => setMode("background")}>
          02 背景与颜色
        </button>
        <button className={mode === "projects" ? "active" : ""} onClick={() => setMode("projects")}>
          03 作品内容
        </button>
      </div>

      <div className="studio-grid">
        <section className="studio-controls" aria-label="网站编辑设置">
          {mode === "identity" && (
            <>
              <fieldset disabled={!canEdit}>
                <legend>品牌与首页标题</legend>
                <label className="text-control">
                  <span>网站名称</span>
                  <input value={content.brandName} maxLength={40} onChange={(event) => updateContent("brandName", event.target.value)} />
                </label>
                <label className="text-control">
                  <span>地点 / 年份小字</span>
                  <input value={content.locationLabel} maxLength={40} onChange={(event) => updateContent("locationLabel", event.target.value)} />
                </label>
                <div className="two-column-fields">
                  <label className="text-control">
                    <span>大标题第一行</span>
                    <input value={content.heroFirst} maxLength={18} onChange={(event) => updateContent("heroFirst", event.target.value)} />
                  </label>
                  <label className="text-control">
                    <span>大标题第二行</span>
                    <input value={content.heroSecond} maxLength={18} onChange={(event) => updateContent("heroSecond", event.target.value)} />
                  </label>
                </div>
                <label className="text-control">
                  <span>首页一句话介绍</span>
                  <input value={content.tagline} maxLength={80} onChange={(event) => updateContent("tagline", event.target.value)} />
                </label>
              </fieldset>

              <fieldset disabled={!canEdit}>
                <legend>关于与联系</legend>
                <label className="text-control">
                  <span>关于文字：前半段</span>
                  <input value={content.manifestoPrefix} maxLength={60} onChange={(event) => updateContent("manifestoPrefix", event.target.value)} />
                </label>
                <label className="text-control accent-field">
                  <span>关于文字：强调部分</span>
                  <input value={content.manifestoHighlight} maxLength={40} onChange={(event) => updateContent("manifestoHighlight", event.target.value)} />
                </label>
                <label className="text-control">
                  <span>关于文字：结尾</span>
                  <input value={content.manifestoSuffix} maxLength={60} onChange={(event) => updateContent("manifestoSuffix", event.target.value)} />
                </label>
                <label className="text-control">
                  <span>补充说明</span>
                  <textarea value={content.introNote} maxLength={220} rows={3} onChange={(event) => updateContent("introNote", event.target.value)} />
                </label>
                <div className="two-column-fields">
                  <label className="text-control">
                    <span>联系标题第一行</span>
                    <input value={content.contactFirst} maxLength={28} onChange={(event) => updateContent("contactFirst", event.target.value)} />
                  </label>
                  <label className="text-control">
                    <span>联系标题第二行</span>
                    <input value={content.contactSecond} maxLength={28} onChange={(event) => updateContent("contactSecond", event.target.value)} />
                  </label>
                </div>
                <label className="text-control">
                  <span>联系邮箱</span>
                  <input type="email" value={content.contactEmail} maxLength={120} onChange={(event) => updateContent("contactEmail", event.target.value)} />
                </label>
              </fieldset>
            </>
          )}

          {mode === "background" && (
            <>
              <fieldset disabled={!canEdit}>
                <legend>背景模式</legend>
                <div className="theme-options">
                  {themes.map((theme) => (
                    <label key={theme.id} className={settings.theme === theme.id ? "selected" : ""}>
                      <input
                        type="radio"
                        name="theme"
                        value={theme.id}
                        checked={settings.theme === theme.id}
                        onChange={() => setSettings({ ...settings, theme: theme.id })}
                      />
                      <span>{theme.name}</span>
                      <small>{theme.description}</small>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset disabled={!canEdit}>
                <legend>颜色</legend>
                <div className="color-controls">
                  <label>
                    <span>主光色</span>
                    <input type="color" value={settings.accent} onChange={(event) => setSettings({ ...settings, accent: event.target.value })} />
                  </label>
                  <label>
                    <span>辅光色</span>
                    <input type="color" value={settings.secondary} onChange={(event) => setSettings({ ...settings, secondary: event.target.value })} />
                  </label>
                </div>
              </fieldset>

              <fieldset disabled={!canEdit}>
                <legend>材质与动态</legend>
                <label className="range-control">
                  <span><b>光效强度</b><output>{Math.round(settings.intensity)}%</output></span>
                  <input type="range" min="0" max="100" value={settings.intensity} onChange={(event) => setSettings({ ...settings, intensity: Number(event.target.value) })} />
                </label>
                <label className="range-control">
                  <span><b>动态速度</b><output>{Math.round(settings.motion)}%</output></span>
                  <input type="range" min="0" max="100" value={settings.motion} onChange={(event) => setSettings({ ...settings, motion: Number(event.target.value) })} />
                </label>
                <label className="toggle-control">
                  <span><b>细微颗粒</b><small>增加屏幕材质感</small></span>
                  <input type="checkbox" checked={settings.grain} onChange={(event) => setSettings({ ...settings, grain: event.target.checked })} />
                </label>
              </fieldset>
            </>
          )}

          {mode === "projects" && (
            <fieldset disabled={!canEdit}>
              <legend>首页三张作品卡片</legend>
              <p className="field-help">先填写项目类型，再填写标题和一句简短介绍。</p>
              <div className="project-editors">
                {content.projects.map((project, index) => (
                  <section key={index}>
                    <h2>作品 {String(index + 1).padStart(2, "0")}</h2>
                    <label className="text-control">
                      <span>项目类型</span>
                      <input value={project.type} maxLength={52} onChange={(event) => updateProject(index, "type", event.target.value)} />
                    </label>
                    <label className="text-control">
                      <span>项目名称</span>
                      <input value={project.name} maxLength={52} onChange={(event) => updateProject(index, "name", event.target.value)} />
                    </label>
                    <label className="text-control">
                      <span>一句话介绍</span>
                      <textarea value={project.note} maxLength={120} rows={2} onChange={(event) => updateProject(index, "note", event.target.value)} />
                    </label>
                  </section>
                ))}
              </div>
            </fieldset>
          )}

          <button className="studio-save" onClick={saveEverything} disabled={!canEdit || status === "saving"}>
            {status === "saving" ? "正在发布…" : "发布全部修改"}
          </button>
          {message && <p className={`studio-message ${status}`}>{message}</p>}
        </section>

        <aside className="studio-preview-wrap">
          <p>实时预览 · 修改后立即显示</p>
          <div
            className={`studio-preview preview-${settings.theme}${settings.grain ? " preview-grain" : ""}`}
            style={previewStyle}
          >
            <div className="preview-effects" aria-hidden="true">
              {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
            </div>
            <div className="preview-glass">
              <span>{content.brandName}</span>
              <span>STUDIO</span>
            </div>
            <div className="preview-copy">
              <small>{content.tagline}</small>
              <strong>{content.heroFirst}<br />{content.heroSecond}</strong>
            </div>
            <div className="preview-caption">
              <span>{content.locationLabel}</span>
              <span>{content.projects[0]?.name}</span>
            </div>
          </div>
          <p className="preview-tip">这是缩略预览。发布后，首页会使用相同的名称、文字、颜色与背景。</p>
        </aside>
      </div>
    </main>
  );
}
