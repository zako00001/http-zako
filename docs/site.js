const fallbackConfig = {
  brandName: "五等分的zako",
  locationLabel: "SHANGHAI · 2026",
  heroFirst: "DIGITAL",
  heroSecond: "ATELIER.",
  tagline: "设计界面，也设计它们发生的空间。",
  manifestoPrefix: "在秩序与未知之间，构建",
  manifestoHighlight: "安静而有生命力",
  manifestoSuffix: "的数字体验。",
  introNote: "以清晰的系统、克制的动效和轻盈的材质，持续记录界面、字体与日常观察。",
  contactFirst: "LET'S MAKE",
  contactSecond: "THE NEXT THING.",
  contactEmail: "hello@example.com",
  background: {
    theme: "orbital",
    accent: "#dfff00",
    secondary: "#3758ff",
    intensity: 58,
    motion: 46,
    grain: true,
  },
  projects: [
    { name: "AETHER CONSOLE", type: "INTERFACE SYSTEM", note: "将复杂信息压缩成安静、清晰的操作界面。" },
    { name: "LUMEN ARCHIVE", type: "DIGITAL IDENTITY", note: "围绕光、秩序和时间建立的数字视觉语言。" },
    { name: "FIELD NOTES", type: "EXPERIMENTAL EDITORIAL", note: "持续记录界面、字体与日常观察的实验空间。" },
  ],
};

const themes = new Set(["orbital", "aurora", "monolith"]);

function cleanConfig(value) {
  const background = value?.background ?? {};
  return {
    ...fallbackConfig,
    ...value,
    background: {
      ...fallbackConfig.background,
      ...background,
      theme: themes.has(background.theme) ? background.theme : fallbackConfig.background.theme,
    },
    projects: Array.isArray(value?.projects) && value.projects.length
      ? value.projects.slice(0, 3)
      : fallbackConfig.projects,
  };
}

function setText(key, value) {
  document.querySelectorAll(`[data-content="${key}"]`).forEach((element) => {
    element.textContent = value;
  });
}

function renderProjects(projects) {
  const variants = ["rings", "grid", "beam"];
  const list = document.querySelector("#project-list");
  list.replaceChildren();
  projects.forEach((project, index) => {
    const article = document.createElement("article");
    article.className = "project-card";
    article.innerHTML = `
      <div class="project-visual visual-${variants[index] ?? "rings"}">
        <span class="project-number">${String(index + 1).padStart(2, "0")}</span>
        <div class="visual-object" aria-hidden="true"></div>
        <span class="project-arrow" aria-hidden="true">↗</span>
      </div>
      <div class="project-info">
        <p class="project-type"></p>
        <h2></h2>
        <p class="project-note"></p>
      </div>`;
    article.querySelector(".project-type").textContent = project.type ?? "PROJECT";
    article.querySelector("h2").textContent = project.name ?? "UNTITLED";
    article.querySelector(".project-note").textContent = project.note ?? "";
    list.append(article);
  });
}

function applyConfig(config) {
  const shell = document.querySelector("#site-shell");
  const background = config.background;
  shell.classList.remove("theme-orbital", "theme-aurora", "theme-monolith", "has-grain");
  shell.classList.add(`theme-${background.theme}`);
  if (background.grain) shell.classList.add("has-grain");
  shell.style.setProperty("--accent", background.accent);
  shell.style.setProperty("--secondary", background.secondary);
  shell.style.setProperty("--intensity", Number(background.intensity) / 100);
  shell.style.setProperty("--motion", `${Math.max(8, 48 - Number(background.motion) * 0.38)}s`);

  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === "string") setText(key, value);
  });
  document.querySelectorAll("[data-email-link]").forEach((link) => {
    link.href = `mailto:${config.contactEmail}`;
  });
  document.title = config.brandName;
  renderProjects(config.projects);
}

async function loadConfig() {
  try {
    const response = await fetch(`./site-config.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("配置文件读取失败");
    return cleanConfig(await response.json());
  } catch (error) {
    console.warn(error);
    return fallbackConfig;
  }
}

const shell = document.querySelector("#site-shell");
shell.addEventListener("pointermove", (event) => {
  shell.style.setProperty("--pointer-x", `${event.clientX}px`);
  shell.style.setProperty("--pointer-y", `${event.clientY}px`);
}, { passive: true });

applyConfig(await loadConfig());
