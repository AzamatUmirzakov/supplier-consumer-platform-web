"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ConditionalSidebar() {
  const pathname = usePathname();

  // Hide sidebar on auth routes
  if (pathname?.startsWith("/auth")) {
    return null;
  }

  return <Sidebar />;
}
