import { requireChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { getEditorAccess, getSiteSettings } from "@/lib/site-settings";
import { getSiteContent } from "@/lib/site-content";
import { BackgroundStudio } from "./BackgroundStudio";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await requireChatGPTUser("/studio");
  const [settings, content, access] = await Promise.all([
    getSiteSettings(),
    getSiteContent(),
    getEditorAccess(user.email),
  ]);

  return (
    <BackgroundStudio
      initialSettings={settings}
      initialContent={content}
      displayName={user.displayName}
      email={user.email}
      canEdit={access.canEdit}
      claimed={access.claimed}
      signOutPath={chatGPTSignOutPath("/")}
    />
  );
}
