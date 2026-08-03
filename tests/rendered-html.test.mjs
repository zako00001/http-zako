import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the finished digital atelier instead of the starter preview", async () => {
  const [home, page, layout, content, packageJson] = await Promise.all([
    readFile(new URL("app/HomeExperience.tsx", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("lib/site-content.ts", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(content, /五等分的zako/);
  assert.match(home, /heroFirst/);
  assert.match(home, /AETHER CONSOLE|content\.projects/);
  assert.match(page, /getSiteContent/);
  assert.match(layout, /generateMetadata/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(`${home}${page}${layout}`, /codex-preview|SkeletonPreview/);
});

test("keeps editing controls in the protected studio surface", async () => {
  const [home, studio, studioPage, settingsRoute, contentRoute] = await Promise.all([
    readFile(new URL("app/HomeExperience.tsx", root), "utf8"),
    readFile(new URL("app/studio/BackgroundStudio.tsx", root), "utf8"),
    readFile(new URL("app/studio/page.tsx", root), "utf8"),
    readFile(new URL("app/api/site-settings/route.ts", root), "utf8"),
    readFile(new URL("app/api/site-content/route.ts", root), "utf8"),
  ]);

  assert.doesNotMatch(home, /发布全部修改|type="color"/);
  assert.match(studio, /网站名称/);
  assert.match(studio, /发布全部修改/);
  assert.match(studio, /type="color"/);
  assert.match(studioPage, /requireChatGPTUser/);
  assert.match(settingsRoute, /getChatGPTUser/);
  assert.match(contentRoute, /getChatGPTUser/);
});
