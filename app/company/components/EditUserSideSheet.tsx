"use client";
import { useState, useEffect } from "react";
import { User } from "@/lib/constants";

type EditUserSideSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    password?: string;
    role: string;
  }) => Promise<void>;
  onDelete?: (userId: number) => Promise<void>;
  user: User | null;
  currentUserId?: number;
  widthClass?: string;
};

export default function EditUserSideSheet(props: EditUserSideSheetProps) {
  const { isOpen, onClose, onSave, onDelete, user, currentUserId, widthClass } = props;

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    password: "",
    role: "employee",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        email: user.email,
        password: "",
        role: user.role,
      });
    }
  }, [user]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.email) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const dataToSave: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        email: formData.email,
        role: formData.role,
      };

      // Only include password if it's been changed
      if (formData.password) {
        dataToSave.password = formData.password;
      }

      await onSave(dataToSave);
      onClose();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      alert(`Failed to update user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !onDelete) return;

    // Prevent deleting current user
    if (currentUserId && user.user_id === currentUserId) {
      alert("You cannot delete your own account");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await onDelete(user.user_id);
      onClose();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(`Failed to delete user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`text-white absolute right-0 top-0 h-dvh w-full ${widthClass ? widthClass : "max-w-[380px]"} bg-[#1a1a1a] shadow-xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit User</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded px-3 py-1 bg-[#0a0a0a] cursor-pointer border border-black hover:border-white transition-colors"
          >
            Close
          </button>
        </div>
        <div className="p-4 overflow-auto h-[calc(100dvh-56px)]">
          <div className="space-y-4">
            {/* User ID (Read-only) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-400">
                User ID
              </label>
              <div className="bg-[#0a0a0a] px-2 py-2 rounded text-gray-500 border border-black/20">
                {user.user_id}
              </div>
            </div>

            {/* First Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-400">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="bg-[#0a0a0a] px-2 py-2 rounded text-white border border-black/20 focus:border-white transition-colors"
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-400">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="bg-[#0a0a0a] px-2 py-2 rounded text-white border border-black/20 focus:border-white transition-colors"
                placeholder="Doe"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-400">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-[#0a0a0a] px-2 py-2 rounded text-white border border-black/20 focus:border-white transition-colors"
                placeholder="john.doe@example.com"
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-400">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="bg-[#0a0a0a] px-2 py-2 rounded text-white border border-black/20 focus:border-white transition-colors"
                placeholder="+1234567890"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-400">
                Password <span className="text-gray-500 text-xs">(leave empty to keep current)</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-[#0a0a0a] px-2 py-2 rounded text-white border border-black/20 focus:border-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-400">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="bg-[#0a0a0a] px-2 py-2 rounded text-white border border-black/20 focus:border-white transition-colors"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            {/* Status (Read-only) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-gray-400">
                Status
              </label>
              <div className="bg-[#0a0a0a] px-2 py-2 rounded text-gray-500 border border-black/20 capitalize">
                {user.status}
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                className="w-full cursor-pointer py-2 rounded bg-[#0a0a0a] text-white font-semibold border border-black hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>

              {onDelete && currentUserId !== user.user_id && (
                <button
                  className="w-full cursor-pointer py-2 rounded bg-red-900 text-white font-semibold border border-red-700 hover:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDelete}
                  disabled={loading || user.status === 'suspended'}
                  title={user.status === 'suspended' ? 'Cannot delete suspended user' : ''}
                >
                  Delete User
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
