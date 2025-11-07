"use client";
import { useState } from "react";
import FormContainer from "../components/FormContainer";

type CompanyType = "supplier" | "consumer";

const RegisterPage = () => {
  const [companyType, setCompanyType] = useState<CompanyType | null>(null);
  const [formState, setFormState] = useState(1);
  const [companyPhotoName, setCompanyPhotoName] = useState<string>("");
  const [ownerPhotoName, setOwnerPhotoName] = useState<string>("");

  const handleNext = () => {
    if (companyType === null && formState === 1) {
      alert("Please select a company type to proceed.");
      return;
    }
    setFormState(formState + 1);
  }

  const handlePrevious = () => {
    setFormState(formState - 1);
  }

  return (
    <FormContainer>
      <h1 className="text-2xl font-bold mb-2">Register</h1>
      <form action="">
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
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
            <div className="mt-2">
              <input type="text"
                id="companyDescription"
                name="companyDescription"
                placeholder="Company Description"
                required
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
            <div className="mt-2">
              <input type="text"
                id="companyLocation"
                name="companyLocation"
                placeholder="Company Location"
                required
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
            <div className="mt-2">
              <input
                type="file"
                name="companyPhoto"
                id="companyPhoto"
                className="hidden"
                accept="image/*"
                onChange={(e) => setCompanyPhotoName(e.target.files?.[0]?.name || "")}
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
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
          </div>
        )}
        {formState === 4 && (
          <div>
            <div className="mt-2">
              <input
                id="ownerName"
                name="ownerName"
                placeholder="Owner Name"
                type="text"
                required
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
                className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
              />
            </div>
            <div className="mt-2">
              <input
                type="file"
                name="ownerPhoto"
                id="ownerPhoto"
                className="hidden"
                accept="image/*"
                onChange={(e) => setOwnerPhotoName(e.target.files?.[0]?.name || "")}
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
            </div>
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
            <button type="submit" className="w-full py-3 px-4 rounded-lg bg-white text-black font-medium transition-all hover:bg-gray-100 cursor-pointer">
              Register
            </button>
          </div>
        )}
      </form>
    </FormContainer>
  );
};

export default RegisterPage;