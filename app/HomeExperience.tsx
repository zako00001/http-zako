"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { SiteSettings } from "@/lib/site-settings";
import type { SiteContent } from "@/lib/site-content";

type HomeExperienceProps = {
  settings: SiteSettings;
  content: SiteContent;
};

const projectVariants = ["rings", "grid", "beam"] as const;

export function HomeExperience({ settings, content }: HomeExperienceProps) {
  const style = {
    "--accent": settings.accent,
    "--secondary": settings.secondary,
    "--intensity": settings.intensity / 100,
    "--motion": `${Math.max(8, 48 - settings.motion * 0.38)}s`,
  } as CSSProperties;

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--pointer-x",
      `${event.clientX - rect.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--pointer-y",
      `${event.clientY - rect.top}px`,
    );
  }

  return (
    <main
      className={`site-shell theme-${settings.theme}${settings.grain ? " has-grain" : ""}`}
      style={style}
      onPointerMove={handlePointerMove}
    >
      <div className="ambient-background" aria-hidden="true">
        <div className="orbital-field">
          {Array.from({ length: 18 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <div className="aurora-field">
          <span className="aurora aurora-one" />
          <span className="aurora aurora-two" />
          <span className="aurora aurora-three" />
        </div>
        <div className="monolith-field">
          <span />
          <span />
          <span />
        </div>
        <div className="pointer-light" />
      </div>

      <header className="glass-nav">
        <a className="brand-mark" href="#top" aria-label="返回首页">
          <span>W</span>
          <span className="brand-word">{content.brandName}</span>
        </a>
        <nav aria-label="主导航">
          <a href="#work">作品</a>
          <a href="#about">关于</a>
          <a href={`mailto:${content.contactEmail}`}>联系</a>
        </nav>
        <a className="nav-status" href="/studio">
          <span aria-hidden="true" />
          Studio
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-kicker">
          <span>INDEPENDENT DIGITAL ATELIER</span>
          <span>{content.locationLabel}</span>
        </div>

        <div className="hero-orbit" aria-hidden="true">
          <span className="orbit-core" />
          <span className="orbit-ring orbit-ring-one" />
          <span className="orbit-ring orbit-ring-two" />
          <span className="orbit-index">00 / 03</span>
        </div>

        <h1>
          <span>{content.heroFirst}</span>
          <span className="hero-outline">{content.heroSecond}</span>
        </h1>

        <div className="hero-footer">
          <p>{content.tagline}</p>
          <a href="#work">
            EXPLORE WORK
            <span aria-hidden="true">↘</span>
          </a>
        </div>
      </section>

      <section className="manifesto" id="about">
        <p className="section-label">[ POSITION / 01 ]</p>
        <div>
          <p className="manifesto-copy">
            {content.manifestoPrefix}<span>{content.manifestoHighlight}</span>{content.manifestoSuffix}
          </p>
          <p className="manifesto-note">
            {content.introNote}
          </p>
        </div>
      </section>

      <section className="work-section" id="work">
        <div className="section-heading">
          <p className="section-label">[ SELECTED WORK / 02 ]</p>
          <p>THREE STUDIES · CONTINUOUSLY EVOLVING</p>
        </div>

        <div className="project-list">
          {content.projects.map((project, index) => (
            <article className="project-card" key={`${project.name}-${index}`}>
              <div className={`project-visual visual-${projectVariants[index]}`}>
                <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="visual-object" aria-hidden="true" />
                <span className="project-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className="project-info">
                <p>{project.type}</p>
                <h2>{project.name}</h2>
                <p>{project.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section">
        <p className="section-label">[ NEXT SIGNAL / 03 ]</p>
        <h2>{content.contactFirst}<br />{content.contactSecond}</h2>
        <a className="glass-button" href={`mailto:${content.contactEmail}`}>
          START A CONVERSATION
          <span aria-hidden="true">↗</span>
        </a>
      </section>

      <footer>
        <p>© 2026 {content.brandName}</p>
        <p>DESIGNING EVERYDAY.</p>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}
