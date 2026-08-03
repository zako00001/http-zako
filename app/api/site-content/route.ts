import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  getSiteContent,
  updateSiteContent,
  type SiteContent,
} from "@/lib/site-content";

export async function GET() {
  return NextResponse.json(await getSiteContent());
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return NextResponse.json(
      { error: "请先使用管理员账号登录。" },
      { status: 401 },
    );
  }

  let input: Partial<SiteContent>;
  try {
    input = (await request.json()) as Partial<SiteContent>;
  } catch {
    return NextResponse.json({ error: "内容格式无效。" }, { status: 400 });
  }

  try {
    const content = await updateSiteContent(input, user.email);
    return NextResponse.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法保存内容。";
    const status = message.includes("administrator") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
