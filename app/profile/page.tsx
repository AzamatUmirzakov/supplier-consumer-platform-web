"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/useAuthStore";

function ProfilePage() {
  const { user, loading, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    locale: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        email: user.email,
        locale: user.locale,
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        email: user.email,
        locale: user.locale,
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await updateUser(formData);
      setIsEditing(false);
    } catch (error: any) {
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!user) {
    return (
      <div className="py-5 px-10 flex-1">
        <h1 className="text-4xl font-bold mb-6">Profile</h1>
        <p className="text-gray-400">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="py-5 px-10 flex-1">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Profile</h1>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-600"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 max-w-2xl">
        <div className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              First Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                className="w-full px-4 py-2 bg-[#0d0d0d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-white text-lg">{user.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Last Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                className="w-full px-4 py-2 bg-[#0d0d0d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-white text-lg">{user.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-4 py-2 bg-[#0d0d0d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-white text-lg">{user.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleChange("phone_number", e.target.value)}
                className="w-full px-4 py-2 bg-[#0d0d0d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-white text-lg">{user.phone_number}</p>
            )}
          </div>

          {/* Locale */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Language/Locale
            </label>
            {isEditing ? (
              <select
                value={formData.locale}
                onChange={(e) => handleChange("locale", e.target.value)}
                className="w-full px-4 py-2 bg-[#0d0d0d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="ru">Russian</option>
                <option value="kz">Kazakh</option>
              </select>
            ) : (
              <p className="text-white text-lg">{user.locale}</p>
            )}
          </div>

          {/* Read-only fields */}
          <div className="pt-4 border-t border-gray-700">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                User ID
              </label>
              <p className="text-gray-500 text-lg">{user.user_id}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Role
              </label>
              <p className="text-gray-500 text-lg">{user.role}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              <p className="text-gray-500 text-lg">{user.status}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Company ID
              </label>
              <p className="text-gray-500 text-lg">{user.company_id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Member Since
              </label>
              <p className="text-gray-500 text-lg">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;