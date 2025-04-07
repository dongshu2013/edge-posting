"use client";

import { useState } from "react";
import KolCard from "@/components/KolCard";
import KolApplyModal from "@/components/KolApplyModal";
import { toast } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { CustomPagination } from "@/components/CustomPagination";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Pagination } from "@mui/material";

export default function KolPage() {
  const { userInfo } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedArea, setSelectedArea] = useState("");

  const userStatusQuery = useQuery({
    queryKey: ["userStatus", userInfo?.uid],
    enabled: !!userInfo?.uid,
    queryFn: async () => {
      const response = await fetchApi("/api/kol/user-status", {
        auth: true,
      });
      return response;
    },
  });
  const userKolStatus = userStatusQuery.data?.kolStatus;

  const kolsQuery = useQuery({
    queryKey: ["kols", page, selectedArea],
    queryFn: async () => {
      const response = await fetchApi(
        `/api/kol?page=${page}&area=${selectedArea}`,
        {}
      );
      return response;
    },
  });
  const kols = kolsQuery.data?.items || [];
  const totalCount = kolsQuery.data?.totalCount || 0;

  const renderApplyButton = () => {
    return userKolStatus === "confirmed" ? (
      <div className="mt-6">
        <button
          disabled
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          You are a KOL
        </button>
      </div>
    ) : userKolStatus === "pending" ? (
      <div className="hidden mt-6">
        <button
          disabled
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Apply in progress
        </button>
      </div>
    ) : (
      <div className="hidden mt-6">
        <button
          onClick={() => {
            if (!userInfo?.uid) {
              toast.error("Please login first");
              return;
            }
            setShowApplyModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Apply to become a KOL
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Key Opinion Leaders
        </h1>

        <div className="flex items-center gap-4">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select area</option>
            <option value="1">America/Europe</option>
            <option value="2">Korea</option>
            <option value="3">China</option>
            <option value="4">Japan</option>
            <option value="5">South Asia</option>
          </select>

          {renderApplyButton()}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {kols.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No KOLs found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no Key Opinion Leaders available at the moment.
            </p>

            {renderApplyButton()}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {kols.map((kol: any) => (
              <li
                key={kol.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <KolCard kol={kol} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {kols.length > 0 && (
        <Pagination
          page={page}
          onChange={(event, value) => setPage(value)}
          count={Math.ceil(totalCount / 10)}
        />
      )}

      <KolApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
      />
    </div>
  );
}
