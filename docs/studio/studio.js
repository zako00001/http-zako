const configUrl = "../site-config.json";
const draftKey = "wudengfen-zako-static-studio-draft-v1";
let onlineConfig;
let config;

const clone = (value) => JSON.parse(JSON.stringify(value));

function getPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function setPath(object, path, nextValue) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((value, key) => value[key], object);
  target[last] = nextValue;
}

async function fetchOnlineConfig() {
  const response = await fetch(`${configUrl}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("无法读取线上配置");
  return response.json();
}

function fillForm() {
  document.querySelectorAll("[data-field]").forEach((field) => {
    const value = getPath(config, field.dataset.field);
    if (field.type === "checkbox") field.checked = Boolean(value);
    else if (field.type === "radio") field.checked = field.value === value;
    else field.value = value ?? "";
  });
  renderPreview();
}

function renderPreview() {
  const preview = document.querySelector("#live-preview");
  const background = config.background;
  preview.classList.remove("theme-orbital", "theme-aurora", "theme-monolith", "preview-grain");
  preview.classList.add(`theme-${background.theme}`);
  if (background.grain) preview.classList.add("preview-grain");
  preview.style.setProperty("--accent", background.accent);
  preview.style.setProperty("--secondary", background.secondary);
  preview.style.setProperty("--intensity", Number(background.intensity) / 100);
  preview.style.setProperty("--motion", `${Math.max(8, 48 - Number(background.motion) * 0.38)}s`);
  document.querySelector("#preview-brand").textContent = config.brandName;
  document.querySelector("#preview-tagline").textContent = config.tagline;
  document.querySelector("#preview-first").textContent = config.heroFirst;
  document.querySelector("#preview-second").textContent = config.heroSecond;
  document.querySelector("#preview-location").textContent = config.locationLabel;
  document.querySelector("#preview-project").textContent = config.projects?.[0]?.name ?? "PROJECT 01";
  document.querySelector("#intensity-output").textContent = `${Math.round(background.intensity)}%`;
  document.querySelector("#motion-output").textContent = `${Math.round(background.motion)}%`;
}

function saveDraft() {
  localStorage.setItem(draftKey, JSON.stringify(config));
}

function handleFieldChange(event) {
  const field = event.target.closest("[data-field]");
  if (!field) return;
  let value = field.value;
  if (field.type === "checkbox") value = field.checked;
  if (field.type === "range") value = Number(field.value);
  setPath(config, field.dataset.field, value);
  saveDraft();
  renderPreview();
}

function configText() {
  return `${JSON.stringify(config, null, 2)}\n`;
}

function showMessage(message, type = "success") {
  const element = document.querySelector("#action-message");
  element.textContent = message;
  element.dataset.type = type;
}

async function copyConfig() {
  try {
    await navigator.clipboard.writeText(configText());
    showMessage("已复制。现在点击“打开 GitHub 更新页”，按 Ctrl+A，再按 Ctrl+V。", "success");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = configText();
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showMessage("已复制。现在打开 GitHub 更新页并粘贴。", "success");
  }
}

function downloadConfig() {
  const blob = new Blob([configText()], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "site-config.json";
  link.click();
  URL.revokeObjectURL(link.href);
  showMessage("配置文件已下载。通常使用“复制发布内容”会更简单。", "success");
}

async function resetOnline() {
  if (!window.confirm("确定放弃这台电脑里的草稿，恢复 GitHub 上已经发布的内容吗？")) return;
  onlineConfig = await fetchOnlineConfig();
  config = clone(onlineConfig);
  localStorage.removeItem(draftKey);
  fillForm();
  showMessage("已恢复线上内容。", "success");
}

async function initialize() {
  try {
    onlineConfig = await fetchOnlineConfig();
    const savedDraft = localStorage.getItem(draftKey);
    config = savedDraft ? JSON.parse(savedDraft) : clone(onlineConfig);
    fillForm();
  } catch (error) {
    showMessage(`工作台读取失败：${error.message}`, "error");
  }
}

document.querySelector(".editor-panel").addEventListener("input", handleFieldChange);
document.querySelector(".editor-panel").addEventListener("change", handleFieldChange);
document.querySelector("#copy-config").addEventListener("click", copyConfig);
document.querySelector("#download-config").addEventListener("click", downloadConfig);
document.querySelector("#reset-online").addEventListener("click", resetOnline);

await initialize();
