"use client";
import { useEffect, useState } from "react";
import { useLinkingsStore, LinkingStatus, fetchCompanyDetails, CompanyDetails } from "@/lib/linkings-store";
import { useCitiesStore } from "@/lib/cities-store";
import { useCompanyStore } from "@/lib/company-store";
import LinkingCard from "./components/LinkingCard";
import { useTranslations } from "next-intl";

type TabType = "pending" | "active";

function LinkingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const { linkings, loading, fetchLinkings, updateLinking } = useLinkingsStore();
  const cities = useCitiesStore((state) => state.cities);
  const fetchCities = useCitiesStore((state) => state.fetchCities);
  const myCompany = useCompanyStore((state) => state.company);
  const getCompanyDetails = useCompanyStore((state) => state.getCompanyDetails);
  const [companiesDetails, setCompaniesDetails] = useState<Map<number, CompanyDetails>>(new Map());

  const t = useTranslations("Linkings");

  // Determine if we're a supplier or consumer
  const isSupplier = myCompany.company_type === "supplier";

  useEffect(() => {
    fetchLinkings();
    fetchCities();
    getCompanyDetails(); // Fetch our own company details
  }, [fetchLinkings, fetchCities, getCompanyDetails]);

  // Helper function to get city name by ID (localized)
  const getCityName = (cityId: string | number) => {
    const city = cities.find((c) => c.city_id === Number(cityId));
    if (!city) return `${cityId}`;
    return city?.city_name
  };

  useEffect(() => {
    // Collect all unique company IDs
    const companyIds = new Set<number>();
    linkings.forEach((linking) => {
      companyIds.add(linking.consumer_company_id);
      companyIds.add(linking.supplier_company_id);
    });

    // Fetch details for each company
    companyIds.forEach(async (id) => {
      if (!companiesDetails.has(id)) {
        const data = await fetchCompanyDetails(id);
        if (data) {
          setCompaniesDetails((prev) => new Map(prev).set(id, data));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkings]);

  const pendingLinkings = linkings.filter((linking) => linking.status === LinkingStatus.pending);
  const activeLinkings = linkings.filter((linking) => linking.status === LinkingStatus.accepted);

  const handleAccept = async (linkingId: number) => {
    try {
      await updateLinking(linkingId, "accepted");
    } catch (error: any) {
      alert(`${t("failed_accept")}: ${error.message}`);
    }
  };

  const handleReject = async (linkingId: number) => {
    if (!confirm(t("sure_reject"))) return;
    try {
      await updateLinking(linkingId, "rejected");
    } catch (error: any) {
      alert(`${t("failed_reject")}: ${error.message}`);
    }
  };

  const handleStop = async (linkingId: number) => {
    if (!confirm(t("sure_stop"))) return;
    try {
      await updateLinking(linkingId, "unlinked");
    } catch (error: any) {
      alert(`${t("failed_stop")}: ${error.message}`);
    }
  };

  return (
    <div className="py-5 px-10 flex-1">
      <h1 className="text-4xl font-bold mb-6">{t("title")}</h1>

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
            {t("pending")} ({pendingLinkings.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`cursor-pointer px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === "active"
              ? "border-white text-white"
              : "text-gray-500 hover:text-gray-300 border-transparent"
              }`}
          >
            {t("active")} ({activeLinkings.length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-gray-400 text-center mt-20">
          {t("loading")}
        </div>
      )}

      {/* Pending Linkings */}
      {!loading && activeTab === "pending" && (
        <div className="space-y-4">
          {pendingLinkings.length === 0 ? (
            <div className="text-gray-400 text-center mt-20">
              {t("no_pending")}
            </div>
          ) : (
            pendingLinkings.map((linking) => {
              // If we're a supplier, show consumer company. If we're a consumer, show supplier company.
              const otherCompanyId = isSupplier
                ? linking.consumer_company_id
                : linking.supplier_company_id;
              return (
                <LinkingCard
                  key={linking.linking_id}
                  linking={linking}
                  companyDetails={companiesDetails.get(otherCompanyId)}
                  getCityName={getCityName}
                  type="pending"
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              );
            })
          )}
        </div>
      )}

      {/* Active Linkings */}
      {!loading && activeTab === "active" && (
        <div className="space-y-4">
          {activeLinkings.length === 0 ? (
            <div className="text-gray-400 text-center mt-20">
              {t("no_active")}
            </div>
          ) : (
            activeLinkings.map((linking) => {
              // If we're a supplier, show consumer company. If we're a consumer, show supplier company.
              const otherCompanyId = isSupplier
                ? linking.consumer_company_id
                : linking.supplier_company_id;
              return (
                <LinkingCard
                  key={linking.linking_id}
                  linking={linking}
                  companyDetails={companiesDetails.get(otherCompanyId)}
                  getCityName={getCityName}
                  type="active"
                  onStop={handleStop}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default LinkingsPage;