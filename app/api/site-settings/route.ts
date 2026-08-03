import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  getSiteSettings,
  updateSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return NextResponse.json(
      { error: "请先使用管理员账号登录。" },
      { status: 401 },
    );
  }

  let input: Partial<SiteSettings>;
  try {
    input = (await request.json()) as Partial<SiteSettings>;
  } catch {
    return NextResponse.json({ error: "设置格式无效。" }, { status: 400 });
  }

  try {
    const settings = await updateSiteSettings(input, user.email);
    return NextResponse.json({ settings, claimedBy: user.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法保存设置。";
    const status = message.includes("claimed") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
