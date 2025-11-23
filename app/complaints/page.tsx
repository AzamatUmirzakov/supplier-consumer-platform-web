"use client";
import { useState, useEffect } from "react";
import { useComplaintsStore, Complaint, ComplaintHistory } from "@/lib/complaints-store";
import useAuthStore from "@/lib/useAuthStore";
import { useTranslations } from "next-intl";

function ComplaintsPage() {
  const t = useTranslations("Complaints");
  const user = useAuthStore((state) => state.user);
  const {
    complaints,
    escalatedComplaints,
    selectedComplaint: storeSelectedComplaint,
    complaintHistory: storeComplaintHistory,
    loading,
    error,
    fetchAssignedComplaints,
    fetchManagedComplaints,
    fetchEscalatedComplaints,
    fetchCompanyComplaints,
    fetchComplaintDetails,
    fetchComplaintHistory,
    escalateComplaint,
    claimComplaint,
    resolveComplaint,
    closeComplaint,
    setSelectedComplaint,
    clearError,
  } = useComplaintsStore();

  const [activeTab, setActiveTab] = useState<"assigned" | "managed" | "escalated" | "company">("assigned");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [resolveData, setResolveData] = useState({ resolution_notes: "", cancel_order: false });
  const [closeData, setCloseData] = useState({ resolution_notes: "", cancel_order: false });
  const [escalateData, setEscalateData] = useState({ notes: "" });

  // Determine user role
  const userRole = user?.role || "staff";
  const isStaff = userRole === "staff";
  const isManager = userRole === "manager";
  const isOwner = userRole === "owner";

  // Initial load based on role
  useEffect(() => {
    if (isOwner) {
      setActiveTab("company");
      fetchCompanyComplaints();
    } else if (isManager) {
      setActiveTab("managed");
      fetchManagedComplaints();
    } else {
      setActiveTab("assigned");
      fetchAssignedComplaints();
    }
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedId(null);
    setSelectedComplaint(null);

    switch (tab) {
      case "assigned":
        fetchAssignedComplaints();
        break;
      case "managed":
        fetchManagedComplaints();
        break;
      case "escalated":
        fetchEscalatedComplaints();
        break;
      case "company":
        fetchCompanyComplaints();
        break;
    }
  };

  const handleSelectComplaint = (complaint: Complaint) => {
    setSelectedId(complaint.complaint_id);
    // Set the complaint from list immediately so user sees it
    setSelectedComplaint(complaint);
    // Then fetch full details which will update the store
    fetchComplaintDetails(complaint.complaint_id);
    fetchComplaintHistory(complaint.complaint_id);
  };

  const handleEscalate = async () => {
    if (!selectedId) return;
    await escalateComplaint(selectedId, escalateData);
    setShowEscalateModal(false);
    setEscalateData({ notes: "" });
    setSelectedId(null);
    setSelectedComplaint(null);
  };

  const handleClaim = async (complaintId: number) => {
    await claimComplaint(complaintId);
    if (selectedId) {
      fetchComplaintDetails(selectedId);
      fetchComplaintHistory(selectedId);
    }
  };

  const handleResolve = async () => {
    if (!selectedId) return;
    await resolveComplaint(selectedId, resolveData);
    setShowResolveModal(false);
    setResolveData({ resolution_notes: "", cancel_order: false });

    // Clear selection since complaint status changed
    setSelectedId(null);
    setSelectedComplaint(null);

    // Refresh the current tab
    handleTabChange(activeTab);
  };

  const handleClose = async () => {
    if (!selectedId) return;
    await closeComplaint(selectedId, closeData);
    setShowCloseModal(false);
    setCloseData({ resolution_notes: "", cancel_order: false });

    // Clear selection since complaint is now closed
    setSelectedId(null);
    setSelectedComplaint(null);

    // Refresh the current tab
    handleTabChange(activeTab);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-600";
      case "in_progress":
        return "bg-yellow-600";
      case "escalated":
        return "bg-orange-600";
      case "resolved":
        return "bg-green-600";
      case "closed":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentComplaints = activeTab === "escalated" ? escalatedComplaints : complaints;

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* Left Sidebar - Complaints List */}
      <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-bold text-white mb-3">{t("title")}</h2>

          {/* Tabs */}
          <div className="flex flex-col gap-2">
            {isStaff && (
              <button
                onClick={() => handleTabChange("assigned")}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left cursor-pointer ${activeTab === "assigned"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                  }`}
              >
                {t("tabs.assigned")}
              </button>
            )}
            {(isManager || isOwner) && (
              <>
                <button
                  onClick={() => handleTabChange("managed")}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left cursor-pointer ${activeTab === "managed"
                    ? "bg-blue-600 text-white"
                    : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                    }`}
                >
                  {t("tabs.managed")}
                </button>
                <button
                  onClick={() => handleTabChange("escalated")}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left cursor-pointer ${activeTab === "escalated"
                    ? "bg-blue-600 text-white"
                    : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                    }`}
                >
                  {t("tabs.escalated")}
                </button>
              </>
            )}
            {isOwner && (
              <button
                onClick={() => handleTabChange("company")}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left cursor-pointer ${activeTab === "company"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                  }`}
              >
                {t("tabs.company")}
              </button>
            )}
          </div>
        </div>

        {/* Complaints List */}
        <div className="flex-1 overflow-y-auto">
          {loading && currentComplaints.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Loading...</p>
            </div>
          ) : currentComplaints.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center p-4">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>No complaints found</p>
              </div>
            </div>
          ) : (
            currentComplaints.map((complaint) => (
              <div
                key={complaint.complaint_id}
                onClick={() => handleSelectComplaint(complaint)}
                className={`p-4 cursor-pointer transition-colors border-b border-[#2a2a2a] ${selectedId === complaint.complaint_id
                  ? "bg-[#2a2a2a]"
                  : "hover:bg-[#222222]"
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">
                    {t("complaint")} #{complaint.complaint_id}
                  </h3>
                  <span
                    className={`${getStatusColor(
                      complaint.status
                    )} text-white text-xs px-2 py-1 rounded capitalize`}
                  >
                    {t(`status.${complaint.status}`)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                  {complaint.description}
                </p>
                <div className="text-xs text-gray-500">
                  <div>{t("order")} #{complaint.order_id}</div>
                  <div>{formatDate(complaint.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Complaint Details */}
      <div className="flex-1 bg-[#0a0a0a] flex flex-col overflow-hidden">
        {storeSelectedComplaint ? (
          <>
            {/* Complaint Header */}
            <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] p-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {t("complaint")} #{storeSelectedComplaint.complaint_id}
                </h1>
                {storeSelectedComplaint.status && (
                  <span
                    className={`${getStatusColor(
                      storeSelectedComplaint.status
                    )} text-white text-sm px-3 py-1.5 rounded capitalize`}
                  >
                    {t(`status.${storeSelectedComplaint.status}`)}
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-sm text-gray-400">
                <span>{t("order")} #{storeSelectedComplaint.order_id}</span>
                <span>•</span>
                <span>{formatDate(storeSelectedComplaint.created_at)}</span>
              </div>
            </div>

            {/* Complaint Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400">{t("loading_details")}</div>
                </div>
              ) : (
                <>
                  {/* Complaint Details */}
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">{t("details.title")}</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-400 text-sm">{t("details.complaint")}</span>
                        <p className="text-white mt-1">{storeSelectedComplaint.description || t("details.no_text")}</p>
                      </div>
                      {storeSelectedComplaint.creator_name && (
                        <div>
                          <span className="text-gray-400 text-sm">{t("details.created_by")}</span>
                          <p className="text-white">{storeSelectedComplaint.creator_name}</p>
                        </div>
                      )}
                      {storeSelectedComplaint.assigned_to_name && (
                        <div>
                          <span className="text-gray-400 text-sm">{t("details.assigned_to")}</span>
                          <p className="text-white">{storeSelectedComplaint.assigned_to_name}</p>
                        </div>
                      )}
                      {storeSelectedComplaint.claimed_by_name && (
                        <div>
                          <span className="text-gray-400 text-sm">{t("details.claimed_by")}</span>
                          <p className="text-white">{storeSelectedComplaint.claimed_by_name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {storeSelectedComplaint.status !== "resolved" && storeSelectedComplaint.status !== "closed" && (
                    (isStaff && storeSelectedComplaint.status !== "escalated" && !storeSelectedComplaint.claimed_by_user_id) ||
                    ((isManager || isOwner) && (storeSelectedComplaint.status === "escalated" || (storeSelectedComplaint.escalated_to_manager_id === user?.user_id || storeSelectedComplaint.escalated_to_owner_id === user?.user_id)))
                  ) && (
                      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-white mb-4">{t("actions.title")}</h3>
                        <div className="flex flex-wrap gap-3">
                          {/* Staff can escalate only if not claimed by anyone */}
                          {isStaff && storeSelectedComplaint.status !== "escalated" && !storeSelectedComplaint.claimed_by_user_id && (
                            <button
                              onClick={() => setShowEscalateModal(true)}
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium cursor-pointer"
                            >
                              {t("actions.escalate")}
                            </button>
                          )}

                          {/* Manager/Owner can only interact with escalated complaints */}
                          {(isManager || isOwner) && (
                            <>
                              {/* Show claim button if escalated but unclaimed */}
                              {storeSelectedComplaint.status === "escalated" && !storeSelectedComplaint.escalated_to_manager_id && !storeSelectedComplaint.escalated_to_owner_id && (
                                <button
                                  onClick={() => handleClaim(storeSelectedComplaint.complaint_id)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
                                >
                                  {t("actions.claim")}
                                </button>
                              )}

                              {/* Show resolve and close buttons only if claimed by current user */}
                              {(storeSelectedComplaint.escalated_to_manager_id === user?.user_id || storeSelectedComplaint.escalated_to_owner_id === user?.user_id) && (
                                <>
                                  <button
                                    onClick={() => setShowResolveModal(true)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium cursor-pointer"
                                  >
                                    {t("actions.resolve")}
                                  </button>
                                  <button
                                    onClick={() => setShowCloseModal(true)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer"
                                  >
                                    {t("actions.close")}
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                  {/* History */}
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">{t("history.title")}</h3>
                    {storeComplaintHistory.length === 0 ? (
                      <p className="text-gray-400 text-sm">{t("history.no_history")}</p>
                    ) : (
                      <div className="space-y-4">
                        {storeComplaintHistory.map((history) => (
                          <div
                            key={history.history_id}
                            className="border-l-2 border-blue-600 pl-4"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white font-medium">
                                  {t("history.status_changed")} <span className="capitalize">{t(`status.${history.new_status}`)}</span>
                                </p>
                                {history.notes && (
                                  <p className="text-gray-300 text-sm mt-1 italic">
                                    "{history.notes}"
                                  </p>
                                )}
                                <p className="text-gray-500 text-xs mt-1">
                                  {t("history.changed_by", { user_id: history.changed_by_user_id })}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDate(history.updated_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>{t("select_complaint")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">{t("modals.escalate.title")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("modals.escalate.notes")}
                </label>
                <textarea
                  value={escalateData.notes}
                  onChange={(e) => setEscalateData({ notes: e.target.value })}
                  placeholder={t("modals.escalate.notes_placeholder")}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 min-h-[100px]"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEscalate}
                  disabled={!escalateData.notes.trim()}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("modals.escalate.submit")}
                </button>
                <button
                  onClick={() => {
                    setShowEscalateModal(false);
                    setEscalateData({ notes: "" });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer"
                >
                  {t("modals.escalate.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">{t("modals.resolve.title")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("modals.resolve.notes")}
                </label>
                <textarea
                  value={resolveData.resolution_notes}
                  onChange={(e) => setResolveData({ ...resolveData, resolution_notes: e.target.value })}
                  placeholder={t("modals.resolve.notes_placeholder")}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 min-h-[100px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="resolve-cancel-order"
                  checked={resolveData.cancel_order}
                  onChange={(e) => setResolveData({ ...resolveData, cancel_order: e.target.checked })}
                  className="w-4 h-4 bg-[#2a2a2a] border-gray-700 rounded cursor-pointer"
                />
                <label htmlFor="resolve-cancel-order" className="text-sm text-gray-300 cursor-pointer">
                  {t("modals.resolve.cancel_order")}
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleResolve}
                  disabled={!resolveData.resolution_notes.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("modals.resolve.submit")}
                </button>
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setResolveData({ resolution_notes: "", cancel_order: false });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer"
                >
                  {t("modals.resolve.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">{t("modals.close.title")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("modals.close.notes")}
                </label>
                <textarea
                  value={closeData.resolution_notes}
                  onChange={(e) => setCloseData({ ...closeData, resolution_notes: e.target.value })}
                  placeholder={t("modals.close.notes_placeholder")}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 min-h-[100px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="close-cancel-order"
                  checked={closeData.cancel_order}
                  onChange={(e) => setCloseData({ ...closeData, cancel_order: e.target.checked })}
                  className="w-4 h-4 bg-[#2a2a2a] border-gray-700 rounded cursor-pointer"
                />
                <label htmlFor="close-cancel-order" className="text-sm text-gray-300 cursor-pointer">
                  {t("modals.close.cancel_order")}
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  disabled={!closeData.resolution_notes.trim()}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("modals.close.submit")}
                </button>
                <button
                  onClick={() => {
                    setShowCloseModal(false);
                    setCloseData({ resolution_notes: "", cancel_order: false });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer"
                >
                  {t("modals.close.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-white hover:text-gray-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default ComplaintsPage;