export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type User = {
  user_id: number;
  role: string;
  status: string;
  created_at: string;
  first_name: string;
  locale: string;
  last_name: string;
  phone_number: string;
  email: string;
  company_id: number;
};

export type AuthStore = {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    company: {
      name: string;
      description: string;
      logo_url?: string;
      location: string;
      company_type: "supplier" | "consumer";
    };
    user: {
      first_name: string;
      last_name: string;
      phone_number: string;
      email: string;
      password: string;
      role: "owner";
      locale: string;
    };
  }) => Promise<void>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  uploadPhotos: (files: File[]) => Promise<string[]>;
  updateUser: (data: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    locale: string;
  }) => Promise<void>;
};