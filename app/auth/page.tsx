"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FormContainer from "./components/FormContainer";
import Link from "next/link";
import useAuthStore from "@/lib/useAuthStore";
import { useTranslations } from "next-intl";

function AuthPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const t = useTranslations("Auth");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      router.push("/");
    } catch (err: any) {
      console.error("Login error:", err.message);
    }
  };

  return (
    <FormContainer>
      <h1 className="text-2xl font-bold mb-2">{t("login")}</h1>
      {error && (
        <div className="mb-4 p-3 rounded bg-red-900/30 border border-red-500 text-red-400 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mt-1">
          <input
            id="email"
            name="email"
            placeholder={t("email")}
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
          />
        </div>

        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            placeholder={t("password")}
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("signing_in") : t("sign_in")}
          </button>
        </div>
        <div>
          <Link href="/auth/register" className="text-sm text-white hover:underline">
            {t("register_link")}
          </Link>
        </div>
      </form>
    </FormContainer>
  );
}

export default AuthPage;