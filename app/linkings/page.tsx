"use client";
import { useEffect, useState } from "react";
import { useLinkingsStore, Linking, LinkingStatus } from "@/lib/linkings-store";
import { useCitiesStore } from "@/lib/cities-store";
import { API_BASE } from "@/lib/constants";
import useAuthStore from "@/lib/useAuthStore";
import LinkingCard from "./components/LinkingCard";

type TabType = "pending" | "active";

type CompanyDetails = {
  company_id: number;
  name: string;
  description: string;
  logo_url?: string;
  location: string;
  company_type: "supplier" | "consumer";
  status: string;
};

function LinkingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const { linkings, loading, fetchLinkings, updateLinking } = useLinkingsStore();
  const cities = useCitiesStore((state) => state.cities);
  const fetchCities = useCitiesStore((state) => state.fetchCities);
  const [companiesDetails, setCompaniesDetails] = useState<Map<number, CompanyDetails>>(new Map());
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    fetchLinkings();
    fetchCities();
  }, [fetchLinkings, fetchCities]);

  // Helper function to get city name by ID
  const getCityName = (cityId: string | number) => {
    const city = cities.find((c) => c.city_id === Number(cityId));
    return city ? city.city_name : `City #${cityId}`;
  };

  // Fetch company details for a specific company ID
  const fetchCompanyDetails = async (companyId: number) => {
    if (companiesDetails.has(companyId)) return;

    try {
      const response = await fetch(`${API_BASE}/company/get-company?company_id=${companyId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        credentials: "include",
      });

      if (response.ok) {
        const data: CompanyDetails = await response.json();
        setCompaniesDetails((prev) => new Map(prev).set(companyId, data));
      }
    } catch (error) {
      console.error(`Failed to fetch company ${companyId}:`, error);
    }
  };

  useEffect(() => {
    // Collect all unique company IDs
    const companyIds = new Set<number>();
    linkings.forEach((linking) => {
      companyIds.add(linking.consumer_company_id);
      companyIds.add(linking.supplier_company_id);
    });

    // Fetch details for each company
    companyIds.forEach((id) => {
      fetchCompanyDetails(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkings, accessToken]);

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
              ? "border-white text-white"
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
              <LinkingCard
                key={linking.linking_id}
                linking={linking}
                companyDetails={companiesDetails.get(linking.consumer_company_id)}
                getCityName={getCityName}
                type="pending"
                onAccept={handleAccept}
                onReject={handleReject}
              />
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
              <LinkingCard
                key={linking.linking_id}
                linking={linking}
                companyDetails={companiesDetails.get(linking.consumer_company_id)}
                getCityName={getCityName}
                type="active"
                onStop={handleStop}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default LinkingsPage;