"use client";

import { useTranslations } from "next-intl";

interface CompanyDetails {
  company_id: number;
  name: string;
  description: string;
  logo_url?: string;
  location: string;
  company_type: "supplier" | "consumer";
  status: string;
}

interface LinkingCardProps {
  linking: {
    linking_id: number;
    consumer_company_id: number;
    consumer_company_name?: string;
    supplier_company_id: number;
    supplier_company_name?: string;
    status: string;
    message?: string;
    created_at?: string;
    updated_at?: string;
  };
  companyDetails?: CompanyDetails;
  getCityName: (cityId: string | number) => string;
  type: "pending" | "active";
  onAccept?: (linkingId: number) => void;
  onReject?: (linkingId: number) => void;
  onStop?: (linkingId: number) => void;
}

export default function LinkingCard({
  linking,
  companyDetails,
  getCityName,
  type,
  onAccept,
  onReject,
  onStop,
}: LinkingCardProps) {
  const t = useTranslations("Linkings");
  return (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 hover:border-gray-500 transition-colors">
      <div className="flex items-start gap-4">
        {companyDetails?.logo_url && (
          <img
            src={companyDetails.logo_url}
            alt={companyDetails.name}
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-xl text-white mb-1">
            {companyDetails?.name || linking.consumer_company_name || `Company #${linking.consumer_company_id}`}
          </h3>
          {companyDetails?.location && (
            <p className="text-sm text-gray-400 mb-2">
              📍 {getCityName(companyDetails.location)}
            </p>
          )}
          {companyDetails?.description && (
            <p className="text-sm text-gray-300 mb-2 line-clamp-2">
              {companyDetails.description}
            </p>
          )}

          {type === "pending" && linking.message && (
            <div className="mt-3 p-3 bg-[#2a2a2a] rounded border border-gray-600">
              <p className="text-sm text-gray-300">{linking.message}</p>
            </div>
          )}

          {type === "active" && linking.updated_at && (
            <p className="text-xs text-gray-500">
              {t("active_since")} {new Date(linking.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {type === "pending" && (
            <>
              <button
                onClick={() => onAccept?.(linking.linking_id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
              >
                {t("accept")}
              </button>
              <button
                onClick={() => onReject?.(linking.linking_id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
              >
                {t("reject")}
              </button>
            </>
          )}
          {type === "active" && (
            <button
              onClick={() => onStop?.(linking.linking_id)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
            >
              {t("stop")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
