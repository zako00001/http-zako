import { getSiteSettings } from "@/lib/site-settings";
import { getSiteContent } from "@/lib/site-content";
import { HomeExperience } from "./HomeExperience";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, content] = await Promise.all([
    getSiteSettings(),
    getSiteContent(),
  ]);
  return <HomeExperience settings={settings} content={content} />;
}
