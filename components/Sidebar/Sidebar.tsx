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
  const logout = useAuthStore((state) => state.logout);

  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);
  const availableLocales = [
    { code: "ru", label: "RU" },
    { code: "en", label: "EN" },
    { code: "kz", label: "KZ" },
  ];
  const currentLocale = typeof window !== "undefined" ? localStorage.getItem("NEXT_LOCALE") || "en" : "en";

  const pages = [
    { name: t("dashboard"), path: '/' },
    { name: t("catalogs"), path: '/catalog' },
    { name: t("linkings"), path: '/linkings' },
    { name: t("orders"), path: '/orders' },
    { name: t("complaints"), path: '/complaints' },
    { name: t("chats"), path: '/chat' },
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
            <div className="px-4 py-2 border-t border-[#2a2a2a]">
              <div className="mb-2 text-sm text-gray-400">{t("language")}</div>
              <div className="flex gap-2">
                {availableLocales.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      try {
                        localStorage.setItem("NEXT_LOCALE", l.code);
                        // Also set cookie for server-side rendering
                        document.cookie = `NEXT_LOCALE=${l.code}; path=/; max-age=${60 * 60 * 24 * 365}`;
                      } catch (e) {
                        console.error("Failed to set locale:", e);
                      }
                      // small delay to ensure storage write
                      setTimeout(() => window.location.reload(), 50);
                    }}
                    className={`cursor-pointer px-3 py-1 rounded text-sm font-medium transition-colors ${currentLocale === l.code ? "bg-gray-200 text-black" : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
                      }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
              className="cursor-pointer block w-full text-left px-4 py-2 hover:bg-[#3a3a3a] transition-colors text-red-400 hover:text-red-300"
            >
              {t("logout")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;