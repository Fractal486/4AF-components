import type { Metadata } from "next";
import { SidebarLayoutFullscreen } from "./fullscreen-view";

export const metadata: Metadata = {
  title: "Sidebar Layout — full screen — 4AF",
  description: "Full-screen preview of the 4AF Sidebar Layout component.",
};

export default function Page() {
  return <SidebarLayoutFullscreen />;
}
