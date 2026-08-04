const base = document.documentElement.dataset.base || ".";
const page = document.body.dataset.page || "home";

const withBase = (path = "") => {
  if (/^(?:https?:|mailto:|#)/.test(path)) return path;
  return path ? `${base}/${path}` : `${base}/`;
};

const [siteResponse, postsResponse] = await Promise.all([
  fetch(`${base}/content/site.json?v=${Date.now()}`, { cache: "no-store" }),
  fetch(`${base}/content/posts.json?v=${Date.now()}`, { cache: "no-store" }),
]);

if (!siteResponse.ok || !postsResponse.ok) {
  throw new Error("博客内容读取失败，请稍后刷新页面。");
}

const site = await siteResponse.json();
const posts = (await postsResponse.json()).sort((a, b) => b.date.localeCompare(a.date));

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function postUrl(post) {
  return withBase(`posts/${post.slug}/`);
}

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty("--accent", site.theme.accent);
  root.style.setProperty("--secondary", site.theme.secondary);
  root.style.setProperty("--paper", site.theme.paper);
  root.style.setProperty("--ink", site.theme.ink);
  document.body.dataset.background = site.theme.backgroundStyle;
  document.body.classList.toggle("has-grain", Boolean(site.theme.grain));
}

function renderHeader() {
  const header = document.querySelector("#site-header");
  if (!header) return;
  const activePage = page === "post" ? "blog" : page;
  header.innerHTML = `
    <div class="nav-wrap page-width">
      <a class="site-brand" href="${withBase()}">
        <span>${escapeHtml(site.brandMonogram)}</span>
        <strong>${escapeHtml(site.brandName)}</strong>
      </a>
      <nav aria-label="主导航">
        ${site.navigation.map((item) => {
          const key = item.href ? item.href.replace("/", "") : "home";
          return `<a href="${withBase(item.href)}"${key === activePage ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`;
        }).join("")}
      </nav>
      <button class="search-open" type="button" data-search-open aria-label="搜索文章"><span>搜索</span><i aria-hidden="true"></i></button>
    </div>`;
}

function renderFooter() {
  const footer = document.querySelector("#site-footer");
  if (!footer) return;
  footer.innerHTML = `
    <div class="footer-main page-width">
      <div><a class="footer-brand" href="${withBase()}">${escapeHtml(site.brandName)}</a><p>${escapeHtml(site.footerNote)}</p></div>
      <div class="footer-links">${site.navigation.map((item) => `<a href="${withBase(item.href)}">${escapeHtml(item.label)}</a>`).join("")}</div>
      <div class="footer-links">${site.socialLinks.map((item) => `<a href="${withBase(item.url)}"${item.url.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${escapeHtml(item.label)}</a>`).join("")}</div>
    </div>
    <div class="footer-bottom page-width"><span>© ${escapeHtml(site.copyrightYear)} ${escapeHtml(site.brandName)}</span><span>STATIC, QUIET, INDEPENDENT.</span><a href="#top">回到顶部 ↑</a></div>`;
}

function coverMarkup(style, index = "") {
  return `<div class="post-cover cover-${escapeHtml(style)}" aria-hidden="true"><span class="cover-index">${index}</span><i></i><i></i><i></i></div>`;
}

function postCard(post, index) {
  return `<article class="post-card">
    <a class="post-card-cover" href="${postUrl(post)}">${coverMarkup(post.coverStyle, String(index + 1).padStart(2, "0"))}</a>
    <div class="post-card-body">
      <div class="post-meta"><span>${escapeHtml(post.category)}</span><time datetime="${post.date}">${formatDate(post.date)}</time></div>
      <h3><a href="${postUrl(post)}">${escapeHtml(post.title)}</a></h3>
      <p>${escapeHtml(post.excerpt)}</p>
      <div class="post-card-foot"><span>${escapeHtml(post.readTime)}</span><a aria-label="阅读《${escapeHtml(post.title)}》" href="${postUrl(post)}">阅读文章 ↗</a></div>
    </div>
  </article>`;
}

function renderHome() {
  document.querySelector("#hero-eyebrow").textContent = site.heroEyebrow;
  document.querySelector("#hero-title").textContent = site.heroTitle;
  document.querySelector("#hero-intro").textContent = site.heroIntro;

  const featured = posts.find((post) => post.slug === site.featuredSlug) || posts[0];
  document.querySelector("#featured-post").innerHTML = `<article class="featured-post">
    <a href="${postUrl(featured)}" class="featured-cover">${coverMarkup(featured.coverStyle, "01")}</a>
    <div class="featured-copy">
      <div class="post-meta"><span>${escapeHtml(featured.category)}</span><time datetime="${featured.date}">${formatDate(featured.date)}</time><span>${escapeHtml(featured.readTime)}</span></div>
      <h3><a href="${postUrl(featured)}">${escapeHtml(featured.title)}</a></h3>
      <p>${escapeHtml(featured.excerpt)}</p>
      <div class="tag-row">${featured.tags.map((tag) => `<span># ${escapeHtml(tag)}</span>`).join("")}</div>
      <a class="solid-button" href="${postUrl(featured)}">开始阅读</a>
    </div>
  </article>`;

  document.querySelector("#latest-posts").innerHTML = posts.filter((post) => post.slug !== featured.slug).slice(0, 4).map(postCard).join("");
  document.querySelector("#topic-cloud").innerHTML = site.topics.map((topic, index) => `<a href="${withBase(`blog/?topic=${encodeURIComponent(topic)}`)}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(topic)}<i>↗</i></a>`).join("");
  document.querySelector("#profile-name").textContent = site.profile.name;
  document.querySelector("#profile-role").textContent = `${site.profile.role} · ${site.profile.location}`;
  document.querySelector("#profile-bio").textContent = site.profile.bio;
  document.querySelector("#profile-status").textContent = site.profile.status;
}

function renderPostList(filteredPosts) {
  document.querySelector("#result-count").textContent = `共 ${filteredPosts.length} 篇文章`;
  document.querySelector("#all-posts").innerHTML = filteredPosts.length
    ? filteredPosts.map((post, index) => `<article class="list-post">
        <a class="list-cover" href="${postUrl(post)}">${coverMarkup(post.coverStyle, String(index + 1).padStart(2, "0"))}</a>
        <div><div class="post-meta"><span>${escapeHtml(post.category)}</span><time datetime="${post.date}">${formatDate(post.date)}</time><span>${escapeHtml(post.readTime)}</span></div><h2><a href="${postUrl(post)}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.excerpt)}</p><div class="tag-row">${post.tags.map((tag) => `<span># ${escapeHtml(tag)}</span>`).join("")}</div></div>
      </article>`).join("")
    : `<div class="empty-state"><strong>没有找到对应文章。</strong><p>试试更短的关键词或选择其他分类。</p></div>`;
}

function renderBlog() {
  const categories = ["全部", ...new Set(posts.map((post) => post.category))];
  const filterWrap = document.querySelector("#category-filters");
  const search = document.querySelector("#post-search");
  let active = new URLSearchParams(location.search).get("topic") || "全部";
  if (!categories.includes(active) && !site.topics.includes(active)) active = "全部";

  filterWrap.innerHTML = categories.map((category) => `<button type="button" data-category="${escapeHtml(category)}"${category === active ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${escapeHtml(category)}</button>`).join("");

  const update = () => {
    const query = search.value.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      const categoryMatch = active === "全部" || post.category === active || post.tags.includes(active);
      const searchable = `${post.title} ${post.excerpt} ${post.category} ${post.tags.join(" ")}`.toLowerCase();
      return categoryMatch && (!query || searchable.includes(query));
    });
    renderPostList(filtered);
  };

  filterWrap.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    active = button.dataset.category;
    filterWrap.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    update();
  });
  search.addEventListener("input", update);
  update();
}

function renderArchive() {
  const oldestPost = posts[posts.length - 1];
  document.querySelector("#archive-summary").textContent = `从 ${formatDate(oldestPost.date)} 到今天，共留下 ${posts.length} 篇文章。`;
  const groups = posts.reduce((result, post) => {
    const year = post.date.slice(0, 4);
    if (!result[year]) result[year] = [];
    result[year].push(post);
    return result;
  }, {});
  document.querySelector("#archive-list").innerHTML = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).map(([year, items]) => `<section class="archive-year"><h2>${year}</h2><div>${items.map((post) => `<article><time datetime="${post.date}">${post.date.slice(5).replace("-", ".")}</time><a href="${postUrl(post)}">${escapeHtml(post.title)}</a><span>${escapeHtml(post.category)}</span></article>`).join("")}</div></section>`).join("");
}

function renderAbout() {
  document.querySelector("#about-heading").textContent = site.about.heading;
  document.querySelector("#about-paragraphs").innerHTML = site.about.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  document.querySelector("#about-principles").innerHTML = site.about.principles.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  document.querySelector("#about-uses").innerHTML = site.about.uses.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  document.querySelector("#about-status").textContent = site.profile.status;
  document.querySelector("#about-location").textContent = `${site.profile.role}\n${site.profile.location}`;
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function markdownToHtml(markdown = "") {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const result = [];
  let paragraph = [];
  let inCode = false;
  let code = [];
  let list = null;
  const flushParagraph = () => {
    if (paragraph.length) result.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (list) result.push(`</${list}>`);
    list = null;
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushParagraph(); closeList();
      if (inCode) { result.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); code = []; }
      inCode = !inCode;
      continue;
    }
    if (inCode) { code.push(line); continue; }
    if (!line.trim()) { flushParagraph(); closeList(); continue; }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) { flushParagraph(); closeList(); const level = heading[1].length; result.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
    if (line.startsWith("> ")) { flushParagraph(); closeList(); result.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`); continue; }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      const nextList = bullet ? "ul" : "ol";
      if (list !== nextList) { closeList(); result.push(`<${nextList}>`); list = nextList; }
      result.push(`<li>${inlineMarkdown((bullet || numbered)[1])}</li>`);
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph(); closeList();
  if (inCode && code.length) result.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return result.join("");
}

function renderPost() {
  const slug = document.body.dataset.slug;
  const post = posts.find((item) => item.slug === slug);
  if (!post) { location.replace(withBase("404.html")); return; }
  document.title = `${post.title}｜${site.brandName}`;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.content = post.excerpt;
  document.querySelector("#post-category").textContent = post.category;
  document.querySelector("#post-date").textContent = formatDate(post.date);
  document.querySelector("#post-date").dateTime = post.date;
  document.querySelector("#post-read-time").textContent = post.readTime;
  document.querySelector("#post-title").textContent = post.title;
  document.querySelector("#post-excerpt").textContent = post.excerpt;
  document.querySelector("#post-cover").innerHTML = coverMarkup(post.coverStyle, "READ");
  document.querySelector("#article-body").innerHTML = markdownToHtml(post.content);
  document.querySelector("#post-tags").innerHTML = post.tags.map((tag) => `<a href="${withBase(`blog/?topic=${encodeURIComponent(tag)}`)}"># ${escapeHtml(tag)}</a>`).join("");
  const currentIndex = posts.indexOf(post);
  const adjacent = [posts[currentIndex - 1], posts[currentIndex + 1]].filter(Boolean);
  document.querySelector("#related-posts").innerHTML = adjacent.map((item) => `<a href="${postUrl(item)}"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.title)}</strong><i>阅读 ↗</i></a>`).join("");
  const progress = document.querySelector("#reading-progress");
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  }, { passive: true });
}

function setupSearch() {
  const dialog = document.querySelector("#search-dialog");
  const input = document.querySelector("#global-search");
  const results = document.querySelector("#global-search-results");
  document.querySelectorAll("[data-search-open]").forEach((button) => button.addEventListener("click", () => { dialog.showModal(); input.focus(); }));
  const update = () => {
    const query = input.value.trim().toLowerCase();
    const found = query ? posts.filter((post) => `${post.title} ${post.excerpt} ${post.category} ${post.tags.join(" ")}`.toLowerCase().includes(query)).slice(0, 6) : posts.slice(0, 4);
    results.innerHTML = found.map((post) => `<a href="${postUrl(post)}"><span>${escapeHtml(post.category)} · ${formatDate(post.date)}</span><strong>${escapeHtml(post.title)}</strong></a>`).join("");
  };
  input.addEventListener("input", update);
  update();
}

applyTheme();
renderHeader();
renderFooter();
setupSearch();

if (page === "home") renderHome();
if (page === "blog") renderBlog();
if (page === "archive") renderArchive();
if (page === "about") renderAbout();
if (page === "post") renderPost();
