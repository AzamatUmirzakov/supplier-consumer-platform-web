"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormContainer from "../components/FormContainer";
import useAuthStore from "@/lib/useAuthStore";
import { useCitiesStore } from "@/lib/cities-store";

type CompanyType = "supplier" | "consumer";

const RegisterPage = () => {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const uploadPhotos = useAuthStore((state) => state.uploadPhotos);

  const cities = useCitiesStore((state) => state.cities);
  const fetchCities = useCitiesStore((state) => state.fetchCities);

  const [companyType, setCompanyType] = useState<CompanyType | null>(null);
  const [formState, setFormState] = useState(1);
  const [companyPhotoName, setCompanyPhotoName] = useState<string>("");
  const [ownerPhotoName, setOwnerPhotoName] = useState<string>("");
  const [companyPhotoFile, setCompanyPhotoFile] = useState<File | null>(null);
  const [ownerPhotoFile, setOwnerPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    companyDescription: "",
    companyLocation: "", // Will store city_id
    companyLocationName: "", // Will store city_name for display
    email: "",
    password: "",
    ownerFirstName: "",
    ownerLastName: "",
    ownerNumber: "",
    ownerEmail: "",
  });

  useEffect(() => {
    fetchCities();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }; const handleNext = () => {
    if (companyType === null && formState === 1) {
      alert("Please select a company type to proceed.");
      return;
    }
    setFormState(formState + 1);
  }

  const handlePrevious = () => {
    setFormState(formState - 1);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Register with uploaded URLs
      await register({
        company: {
          name: formData.companyName,
          description: formData.companyDescription,
          location: formData.companyLocation,
          company_type: companyType!,
        },
        user: {
          first_name: formData.ownerFirstName,
          last_name: formData.ownerLastName,
          phone_number: formData.ownerNumber,
          email: formData.ownerEmail,
          password: formData.password,
          role: "owner",
          locale: "en",
        },
      });

      // Collect files to upload
      // const filesToUpload = [companyPhotoFile, ownerPhotoFile].filter(Boolean) as File[];
      // let uploadedUrls: string[] = [];

      // // Upload files if any are provided
      // if (filesToUpload.length > 0) {
      //   uploadedUrls = await uploadPhotos(filesToUpload);
      // }

      await uploadPhotos([companyPhotoFile].filter(Boolean) as File[]);

      router.push("/");
    } catch (err: any) {
      console.error("Registration error:", err.message);
    }
  }

  return (
    <FormContainer>
      <h1 className="text-2xl font-bold mb-2">Register</h1>
      {error && (
        <div className="mb-4 p-3 rounded bg-red-900/30 border border-red-500 text-red-400 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {formState === 1 && (
          <div>
            <label className="block text-sm font-medium mb-2">Company Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCompanyType("supplier")}
                className={`flex-1 cursor-pointer py-3 px-4 rounded-lg border-2 font-medium transition-all ${companyType === "supplier"
                  ? "bg-white text-black border-white"
                  : "text-white border-gray-300 hover:border-white"
                  }`}
              >
                Supplier Company
              </button>
              <button
                type="button"
                onClick={() => setCompanyType("consumer")}
                className={`flex-1 cursor-pointer py-3 px-4 rounded-lg border-2 font-medium transition-all ${companyType === "consumer"
                  ? "bg-white text-black border-white"
                  : "text-white border-gray-300 hover:border-white"
                  }`}
              >
                Consumer Company
              </button>
            </div>
          </div>
        )}
        {formState === 2 && (
          <div>
            <div className="mt-2">
              <input
                id="companyName"
                name="companyName"
                placeholder="Company Name"
                type="text"
                required
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
            <div className="mt-2">
              <input type="text"
                id="companyDescription"
                name="companyDescription"
                placeholder="Company Description"
                required
                value={formData.companyDescription}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
            <div className="mt-2">
              <select
                id="companyLocation"
                name="companyLocation"
                required
                value={formData.companyLocation}
                onChange={(e) => {
                  const selectedCity = cities.find(c => String(c.city_id) === String(e.target.value));
                  if (selectedCity) {
                    setFormData(prev => ({
                      ...prev,
                      companyLocation: String(selectedCity.city_id),
                      companyLocationName: selectedCity.city_name
                    }));
                  }
                }}
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm  text-white"
              >
                <option value="">Select a city</option>
                {cities.map((city) => (
                  <option key={city.city_id} value={String(city.city_id)}>
                    {city.city_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2">
              <input
                type="file"
                name="companyPhoto"
                id="companyPhoto"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  setCompanyPhotoName(e.target.files?.[0]?.name || "");
                  setCompanyPhotoFile(e.target.files?.[0] || null);
                }}
              />
              <label
                htmlFor="companyPhoto"
                className="block w-full text-center cursor-pointer py-3 px-4 rounded-lg border-2 border-gray-300 text-white font-medium transition-all hover:border-white hover:bg-gray-800"
              >
                Upload Company Photo
              </label>
              {companyPhotoName && (
                <p className="mt-1 text-sm text-gray-300">Selected: {companyPhotoName}</p>
              )}
            </div>
          </div>
        )}
        {formState === 3 && (
          <div>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                placeholder="Email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>

            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
          </div>
        )}
        {formState === 4 && (
          <div>
            <div className="mt-2">
              <input
                id="ownerFirstName"
                name="ownerFirstName"
                placeholder="Owner First Name"
                type="text"
                required
                value={formData.ownerFirstName}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
            <div className="mt-2">
              <input
                id="ownerLastName"
                name="ownerLastName"
                placeholder="Owner Last Name"
                type="text"
                required
                value={formData.ownerLastName}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
            <div className="mt-2">
              <input
                id="ownerNumber"
                name="ownerNumber"
                placeholder="Owner Phone Number"
                type="tel"
                required
                value={formData.ownerNumber}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
            <div className="mt-2">
              <input
                id="ownerEmail"
                name="ownerEmail"
                placeholder="Owner Email"
                type="email"
                autoComplete="email"
                required
                value={formData.ownerEmail}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
            {/* <div className="mt-2">
              <input
                type="file"
                name="ownerPhoto"
                id="ownerPhoto"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  setOwnerPhotoName(e.target.files?.[0]?.name || "");
                  setOwnerPhotoFile(e.target.files?.[0] || null);
                }}
              />
              <label
                htmlFor="ownerPhoto"
                className="block w-full text-center cursor-pointer py-3 px-4 rounded-lg border-2 border-gray-300 text-white font-medium transition-all hover:border-white hover:bg-gray-800"
              >
                Upload Owner Photo
              </label>
              {ownerPhotoName && (
                <p className="mt-1 text-sm text-gray-300">Selected: {ownerPhotoName}</p>
              )}
            </div> */}
          </div>
        )}
        <div className="mt-3.5 flex gap-2 justify-stretch">
          {formState > 1 && (
            <button onClick={handlePrevious} type="button" className="flex-1 py-3 px-4 rounded-lg bg-gray-300 text-black font-medium transition-all hover:bg-white cursor-pointer">
              Previous
            </button>
          )}
          {formState < 4 && (
            <button onClick={handleNext} type="button" className="flex-1 py-3 px-4 rounded-lg bg-gray-300 text-black font-medium transition-all hover:bg-white cursor-pointer">
              Next
            </button>
          )}
        </div>
        {formState == 4 && (
          <div className="mt-3.5">
            <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-lg bg-white text-black font-medium transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        )}
      </form>
    </FormContainer>
  );
};

export default RegisterPage;