import { create } from "zustand";
import { persist } from "zustand/middleware";
import { API_BASE } from "./constants";
import { AuthStore } from "@/lib/constants";


export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      loading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            let errorMessage = "Login failed";
            try {
              const errorData = await response.json();
              errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          const accessToken = data.access_token;
          const refreshToken = data.refresh_token;

          // Fetch user data with the access token
          const userResponse = await fetch(`${API_BASE}/user/me`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          });

          if (!userResponse.ok) {
            throw new Error("Failed to fetch user data");
          }

          const userData = await userResponse.json();

          set({
            isAuthenticated: true,
            accessToken,
            refreshToken,
            user: userData,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error instanceof TypeError
            ? "Failed to connect to server. Make sure the API server is running at http://127.0.0.1:8000"
            : error.message;
          set({
            error: errorMessage,
            loading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (registrationData) => {
        set({ loading: true, error: null });
        console.log("Sending registration data:", JSON.stringify(registrationData, null, 2));
        try {
          const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(registrationData),
          });

          if (!response.ok) {
            let errorMessage = "Registration failed";
            let responseText = "";
            try {
              responseText = await response.text();
              console.log("Response status:", response.status);
              console.log("Response body:", responseText);

              const errorData = JSON.parse(responseText);
              errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
            } catch (e) {
              errorMessage = `Server error: ${response.status} ${response.statusText} - ${responseText}`;
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          const accessToken = data.access_token;
          const refreshToken = data.refresh_token;

          // Fetch user data with the access token
          const userResponse = await fetch(`${API_BASE}/user/me`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          });

          if (!userResponse.ok) {
            throw new Error("Failed to fetch user data");
          }

          const userData = await userResponse.json();

          set({
            isAuthenticated: true,
            accessToken,
            refreshToken,
            user: userData,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error instanceof TypeError
            ? "Failed to connect to server. Make sure the API server is running at http://127.0.0.1:8000"
            : error.message;
          set({
            error: errorMessage,
            loading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          user: null,
          error: null,
        });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      uploadPhotos: async (files: File[]) => {
        if (files.length === 0) {
          return [];
        }

        const uploadedUrls: string[] = [];

        try {
          for (const file of files) {
            // Step 1: Get the presigned S3 URL
            const fileExtension = file.name.split(".").pop() || "jpg";
            const uploadUrlResponse = await fetch(
              `${API_BASE}/uploads/upload-url?ext=${fileExtension}`,
              {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${useAuthStore.getState().accessToken}`,
                },
              }
            );

            if (!uploadUrlResponse.ok) {
              let errorMessage = "Failed to get upload URL";
              try {
                const errorData = await uploadUrlResponse.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
              } catch (e) {
                errorMessage = `Server error: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`;
              }
              throw new Error(errorMessage);
            }

            const uploadUrlData = await uploadUrlResponse.json();
            console.log("Upload URL response:", uploadUrlData);

            // const s3PresignedUrl = uploadUrlData.finalurl;
            const s3PresignedUrl = uploadUrlData.put_url.url;
            if (!s3PresignedUrl) {
              throw new Error("No presigned URL received from server");
            }

            // Step 2: Upload the file to S3
            const { url, fields } = uploadUrlData.put_url;
            const formData = new FormData();
            Object.entries(fields).forEach(([key, value]) => {
              formData.append(key, value as string);
            });
            formData.append("file", file);
            console.log("Uploading file to S3 with fields:", fields);

            const uploadResponse = await fetch(s3PresignedUrl, {
              method: "POST",
              // headers: {
              //   "Content-Type": file.type || "application/octet-stream",
              // },
              body: formData,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload to S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
            }

            console.log("File uploaded successfully to S3");

            // Step 3: Upload the url to the backend
            const company_id = useAuthStore.getState().user?.company_id;
            console.log(company_id)
            const fileUrl = uploadUrlData.finalurl;
            const urlUploadResponse = await fetch(
              `${API_BASE}/uploads/companies/${company_id}/photo?file_url=${encodeURIComponent(fileUrl)}`,
              {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${useAuthStore.getState().accessToken}`,
                },
              });

            if (!urlUploadResponse.ok) {
              throw new Error(`Failed to register file URL: ${urlUploadResponse.status} ${urlUploadResponse.statusText}`);
            }

            console.log("File URL registered successfully");
            uploadedUrls.push(fileUrl);
          }

          return uploadedUrls;
        } catch (error: any) {
          const errorMessage = error instanceof TypeError
            ? "Failed to connect to server for file upload"
            : error.message;
          set({ error: errorMessage });
          throw error;
        }
      },


    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
