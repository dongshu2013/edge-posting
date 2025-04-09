"use client";

import { useState } from "react";
import KolCard from "@/components/KolCard";
import KolApplyModal from "@/components/KolApplyModal";
import { toast } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { CustomPagination } from "@/components/CustomPagination";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { getShortAddress } from "@/utils/commonUtils";

export default function KolPage() {
  const { userInfo } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [minScore, setMinScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");

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
    queryKey: ["kols", page, selectedAreas, minScore, maxScore],
    queryFn: async () => {
      const areasParam =
        selectedAreas.length > 0 ? selectedAreas.join(",") : "";
      const scoreParams =
        minScore || maxScore
          ? `&minScore=${minScore || ""}&maxScore=${maxScore || ""}`
          : "";
      const response = await fetchApi(
        `/api/kol?page=${page}&areas=${areasParam}${scoreParams}`,
        {}
      );
      return response;
    },
  });
  const kols = kolsQuery.data?.items || [];
  const totalCount = kolsQuery.data?.totalCount || 0;
  const isLoading = kolsQuery.isLoading;

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Key Opinion Leaders
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min Score"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              placeholder="Max Score"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="area-select-label" sx={{}}>
              Areas
            </InputLabel>

            <Select
              labelId="area-select-label"
              id="area-select"
              multiple
              value={selectedAreas}
              sx={{
                height: 40,
              }}
              onChange={(e) =>
                setSelectedAreas(
                  typeof e.target.value === "string"
                    ? e.target.value.split(",")
                    : e.target.value
                )
              }
              label="Areas"
              renderValue={(selected) => {
                const selectedLabels = selected.map((value) => {
                  switch (value) {
                    case "1":
                      return "America/Europe";
                    case "2":
                      return "Korea";
                    case "3":
                      return "China";
                    case "4":
                      return "Japan";
                    case "5":
                      return "South Asia";
                    default:
                      return value;
                  }
                });
                return getShortAddress(selectedLabels.join(", "), 10);
              }}
            >
              <MenuItem value="1">America/Europe</MenuItem>
              <MenuItem value="2">Korea</MenuItem>
              <MenuItem value="3">China</MenuItem>
              <MenuItem value="4">Japan</MenuItem>
              <MenuItem value="5">South Asia</MenuItem>
            </Select>
          </FormControl>

          {renderApplyButton()}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-12 px-4 text-center">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading KOLs...</span>
            </div>
          </div>
        ) : kols.length === 0 ? (
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
