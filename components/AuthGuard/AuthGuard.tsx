"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/lib/useAuthStore";

const PUBLIC_ROUTES = ["/auth", "/auth/login", "/auth/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isClient, setIsClient] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only check authentication after client-side hydration is complete
    if (!isClient) return;

    const isPublicRoute = PUBLIC_ROUTES.some(route =>
      pathname === route || pathname.startsWith(route + "/")
    );

    if (!isAuthenticated && !isPublicRoute) {
      router.push("/auth");
    }
  }, [isAuthenticated, pathname, router, isClient]);

  // Don't render anything on server-side or before hydration to prevent mismatch
  if (!isClient) {
    return null;
  }

  return <>{children}</>;
}
