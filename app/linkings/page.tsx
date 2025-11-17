"use client";
import { useEffect, useState } from "react";
import { useLinkingsStore, Linking, LinkingStatus } from "@/lib/linkings-store";

type TabType = "pending" | "active";

function LinkingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const { linkings, loading, fetchLinkings, updateLinking } = useLinkingsStore();

  useEffect(() => {
    fetchLinkings(); // Uncomment when backend is ready
  }, [fetchLinkings]);

  const pendingLinkings = linkings.filter((linking) => linking.status === LinkingStatus.pending);
  const activeLinkings = linkings.filter((linking) => linking.status === LinkingStatus.accepted);

  const handleAccept = async (linkingId: number) => {
    try {
      await updateLinking(linkingId, "accepted");
    } catch (error: any) {
      alert(`Failed to accept: ${error.message}`);
    }
  };

  const handleReject = async (linkingId: number) => {
    if (!confirm("Are you sure you want to reject this linking?")) return;
    try {
      await updateLinking(linkingId, "rejected");
    } catch (error: any) {
      alert(`Failed to reject: ${error.message}`);
    }
  };

  const handleStop = async (linkingId: number) => {
    if (!confirm("Are you sure you want to stop this linking?")) return;
    try {
      await updateLinking(linkingId, "unlinked");
    } catch (error: any) {
      alert(`Failed to stop: ${error.message}`);
    }
  };

  return (
    <div className="py-5 px-10 flex-1">
      <h1 className="text-4xl font-bold mb-6">Linkings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-300 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("pending")}
            className={`cursor-pointer px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === "pending"
              ? "border-white text-white"
              : "text-gray-500 hover:text-gray-300 border-transparent"
              }`}
          >
            Pending ({pendingLinkings.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`cursor-pointer px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === "active"
              ? "border-white border-black text-white"
              : "text-gray-500 hover:text-gray-300 border-transparent"
              }`}
          >
            Active ({activeLinkings.length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-gray-400 text-center mt-20">
          Loading linkings...
        </div>
      )}

      {/* Pending Linkings */}
      {!loading && activeTab === "pending" && (
        <div className="space-y-4">
          {pendingLinkings.length === 0 ? (
            <div className="text-gray-400 text-center mt-20">
              No pending linkings
            </div>
          ) : (
            pendingLinkings.map((linking) => (
              <div
                key={linking.linking_id}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-gray-500 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white">
                    {linking.consumer_company_name || `Company #${linking.consumer_company_id}`}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Wants to link with: {linking.supplier_company_name || `Company #${linking.supplier_company_id}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Requested by: {linking.requested_by_user_name || `User #${linking.requested_by_user_id}`}
                  </p>
                  {linking.message && (
                    <p className="text-sm text-gray-300 mt-2 italic">"{linking.message}"</p>
                  )}
                  {linking.created_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Requested: {new Date(linking.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(linking.linking_id)}
                    className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(linking.linking_id)}
                    className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Active Linkings */}
      {!loading && activeTab === "active" && (
        <div className="space-y-4">
          {activeLinkings.length === 0 ? (
            <div className="text-gray-400 text-center mt-20">
              No active linkings
            </div>
          ) : (
            activeLinkings.map((linking) => (
              <div
                key={linking.linking_id}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-gray-500 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white">
                    {linking.company1_name || linking.company1_id}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Linked with: {linking.company2_name || linking.company2_id}
                  </p>
                  {linking.updated_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Active since: {new Date(linking.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStop(linking.linking_id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
                  >
                    Stop
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default LinkingsPage;