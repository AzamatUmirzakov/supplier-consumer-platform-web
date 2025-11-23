"use client";

import { useCitiesStore } from "@/lib/cities-store";
import { useCompanyStore } from "@/lib/company-store";
import { useAuthStore } from "@/lib/useAuthStore";
import { useEffect, useState } from "react";
import { User } from "@/lib/constants";
import AddUserSideSheet from "./components/AddUserSideSheet";
import EditUserSideSheet from "./components/EditUserSideSheet";
import { useTranslations } from "next-intl";

function CompanyPage() {
  const { company, users, loading, error, getCompanyDetails, fetchUsers, addUser, updateUser, deleteUser, updateCompany } = useCompanyStore();
  const currentUser = useAuthStore((state) => state.user);
  const cities = useCitiesStore(state => state.cities);
  const fetchCities = useCitiesStore(state => state.fetchCities);
  const city = cities.find(city => String(city.city_id) === company.location);
  const t = useTranslations("Company");

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    description: "",
    location: "",
    status: "",
  });

  const isOwner = currentUser?.role === "owner";

  useEffect(() => {
    getCompanyDetails();
    fetchUsers();
    fetchCities();
  }, [getCompanyDetails, fetchUsers, fetchCities]);

  // Update form when company data loads
  useEffect(() => {
    if (company.company_id) {
      setCompanyForm({
        name: company.name,
        description: company.description,
        location: company.location,
        status: company.status,
      });
    }
  }, [company]);

  const handleSaveCompany = async () => {
    try {
      await updateCompany(companyForm);
      setIsEditingCompany(false);
    } catch (error) {
      console.error("Failed to update company:", error);
    }
  };

  const handleCancelEdit = () => {
    setCompanyForm({
      name: company.name,
      description: company.description,
      location: company.location,
      status: company.status,
    });
    setIsEditingCompany(false);
  };

  if (loading && !company.company_id) {
    return (
      <div className="py-5 px-10 flex-1">
        <h1 className="text-4xl font-bold mb-6">{t("title")}</h1>
        <p className="text-gray-400">{t("loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-5 px-10 flex-1">
        <h1 className="text-4xl font-bold mb-6">{t("title")}</h1>
        <p className="text-red-500">{t("error", { error })}</p>
      </div>
    );
  }

  return (
    <div className="py-5 px-10 flex-1">
      <h1 className="text-4xl font-bold mb-6">{t("title")}</h1>

      {/* Company Information Section */}
      <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-6 mb-8">
        <div className="flex items-start gap-6">
          {/* Company Logo */}
          {company.logo_url ? (
            <div className="shrink-0">
              <img
                src={company.logo_url}
                alt={company.name}
                width={120}
                height={120}
                className="rounded-lg object-cover"
              />
            </div>
          ) : (
            <div className="shrink-0 w-[120px] h-[120px] bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}

          {/* Company Details */}
          <div className="flex-1">
            {!isEditingCompany ? (
              <>
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-3xl font-bold text-white">{company.name}</h2>
                  {isOwner && (
                    <button
                      onClick={() => setIsEditingCompany(true)}
                      className="cursor-pointer px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      {t("edit")}
                    </button>
                  )}
                </div>
                {company.description && (
                  <div className="mt-2 mb-2">
                    <p className="text-gray-300">{company.description}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400 text-sm">{t("location")}: </span>
                    <span className="text-white">{city?.city_name || company.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">{t("status")}: </span>
                    <span className={`px-2 py-1 rounded text-sm capitalize ${company.status === 'active' ? 'bg-green-900 text-green-200' :
                      company.status === 'suspended' ? 'bg-red-900 text-red-200' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                      {company.status === 'active' ? t("status_active") : company.status === 'suspended' ? t("status_suspended") : company.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">{t("company_id")}: </span>
                    <span className="text-gray-500">{company.company_id}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      {t("company_name")}
                    </label>
                    <input
                      type="text"
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      {t("description")}
                    </label>
                    <textarea
                      value={companyForm.description}
                      onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      {t("location")}
                    </label>
                    <select
                      value={companyForm.location}
                      onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">{t("select_city")}</option>
                      {cities.map((city) => (
                        <option key={city.city_id} value={String(city.city_id)}>
                          {city.city_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      {t("status")}
                    </label>
                    <select
                      value={companyForm.status}
                      onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="active">{t("status_active")}</option>
                      <option value="suspended">{t("status_suspended")}</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveCompany}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                    >
                      {t("save")}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Staff Section */}
      <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{t("staff_title")}</h2>
          <button
            onClick={() => setIsAddSheetOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            {t("add_user")}
          </button>
        </div>

        {loading && users.length === 0 ? (
          <p className="text-gray-400">{t("loading_staff")}</p>
        ) : users.length === 0 ? (
          <p className="text-gray-400">{t("no_staff")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#4a4a4a]">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">{t("table.name")}</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">{t("table.email")}</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">{t("table.phone")}</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">{t("table.role")}</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">{t("table.status")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.user_id}
                    onClick={() => {
                      setSelectedUser(user);
                      // Small delay to allow form data to update before animation starts
                      setTimeout(() => setIsEditSheetOpen(true), 0);
                    }}
                    className="border-b border-[#4a4a4a] cursor-pointer hover:bg-[#3a3a3a] transition-colors"
                  >
                    <td className="py-3 px-4 text-white">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{user.email}</td>
                    <td className="py-3 px-4 text-gray-300">{user.phone_number}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-sm capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm capitalize ${user.status === 'active'
                        ? 'bg-green-900 text-green-200'
                        : user.status === 'pending'
                          ? 'bg-yellow-900 text-yellow-200'
                          : 'bg-gray-700 text-gray-300'
                        }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Side Sheet */}
      <AddUserSideSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSave={addUser}
      />

      {/* Edit User Side Sheet */}
      <EditUserSideSheet
        isOpen={isEditSheetOpen}
        onClose={() => {
          setIsEditSheetOpen(false);
          // Delay clearing selected user until after animation completes
          setTimeout(() => setSelectedUser(null), 300);
        }}
        onSave={(userData) => {
          if (selectedUser) {
            return updateUser(selectedUser.user_id, userData);
          }
          return Promise.resolve();
        }}
        onDelete={deleteUser}
        user={selectedUser}
        currentUserId={currentUser?.user_id}
      />
    </div>
  );
}

export default CompanyPage;
