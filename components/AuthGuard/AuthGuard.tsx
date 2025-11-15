"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/lib/useAuthStore";

const PUBLIC_ROUTES = ["/auth", "/auth/login", "/auth/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
      pathname === route || pathname.startsWith(route + "/")
    );

    if (!isAuthenticated && !isPublicRoute) {
      router.push("/auth");
    }
  }, [isAuthenticated, pathname, router]);

  return <>{children}</>;
}
