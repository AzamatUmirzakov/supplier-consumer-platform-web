"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/useAuthStore";

const Sidebar = () => {
  const t = useTranslations("Sidebar");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);

  const pages = [
    { name: t("dashboard"), path: '/' },
    { name: t("catalogs"), path: '/catalog' },
    { name: t("linkings"), path: '/linkings' },
    { name: t("orders"), path: '/orders' },
    { name: t("complaints"), path: '/complaints' },
  ];

  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="w-1/6 h-screen bg-black text-white p-4 flex flex-col justify-between">
      <ul className="space-y-2">
        {pages.map((page) => (
          <li key={page.name}>
            <Link className={isActive(page.path) ? "border-b-2 border-white" : "border-b-2 border-black"} href={page.path}>{page.name}</Link>
          </li>
        ))}
      </ul>
      <div className="relative" ref={menuRef}>
        <div
          className="flex items-center space-x-4 cursor-pointer hover:bg-[#3a3a3a] p-2 rounded-lg transition-colors"
          onClick={() => setShowMenu(!showMenu)}
        >
          <Image
            src="/avatar.png"
            alt="Avatar"
            className="rounded-full w-15 h-15"
            width={100}
            height={100}
          />
          <p className="text-center">
            {user ? `${user.first_name} ${user.last_name}` : "Guest"}
          </p>
        </div>

        {showMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg overflow-hidden">
            <Link
              href="/profile"
              className="block px-4 py-2 hover:bg-[#3a3a3a] transition-colors"
              onClick={() => setShowMenu(false)}
            >
              {t("profile")}
            </Link>
            <Link
              href="/company"
              className="block px-4 py-2 hover:bg-[#3a3a3a] transition-colors"
              onClick={() => setShowMenu(false)}
            >
              {t("company")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;