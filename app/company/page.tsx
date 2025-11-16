"use client";

import { useCitiesStore } from "@/lib/cities-store";
import { useCompanyStore } from "@/lib/company-store";
import { useAuthStore } from "@/lib/useAuthStore";
import { useEffect, useState } from "react";
import { User } from "@/lib/constants";
import AddUserSideSheet from "./components/AddUserSideSheet";
import EditUserSideSheet from "./components/EditUserSideSheet";

function CompanyPage() {
  const { company, users, loading, error, getCompanyDetails, fetchUsers, addUser, updateUser, deleteUser } = useCompanyStore();
  const currentUser = useAuthStore((state) => state.user);
  const cities = useCitiesStore(state => state.cities);
  const city = cities.find(city => String(city.city_id) === company.location);

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    getCompanyDetails();
    fetchUsers();
    useCitiesStore.getState().fetchCities();
  }, [getCompanyDetails, fetchUsers]);

  if (loading && !company.company_id) {
    return (
      <div className="py-5 px-10 flex-1">
        <h1 className="text-4xl font-bold mb-6">Company</h1>
        <p className="text-gray-400">Loading company information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-5 px-10 flex-1">
        <h1 className="text-4xl font-bold mb-6">Company</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="py-5 px-10 flex-1">
      <h1 className="text-4xl font-bold mb-6">Company</h1>

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
              <span className="text-4xl text-gray-600">🏢</span>
            </div>
          )}

          {/* Company Details */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">{company.name}</h2>
            {company.description && (
              <div className="mt-2 mb-2">
                <p className="text-gray-300">{company.description}</p>
              </div>
            )}
            <div className="space-y-2">
              <div>
                <span className="text-gray-400 text-sm">Location: </span>
                <span className="text-white">{city?.city_name || company.location}</span>
              </div>
              {/* <div>
                <span className="text-gray-400 text-sm">Status: </span>
                <span className={`px-2 py-1 rounded text-sm ${company.status === 'active' ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
                  }`}>
                  {company.status}
                </span>
              </div> */}
              <div>
                <span className="text-gray-400 text-sm">Company ID: </span>
                <span className="text-gray-500">{company.company_id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Section */}
      <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Staff Members</h2>
          <button
            onClick={() => setIsAddSheetOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add User
          </button>
        </div>

        {loading && users.length === 0 ? (
          <p className="text-gray-400">Loading staff...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-400">No staff members found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#4a4a4a]">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Phone</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
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
