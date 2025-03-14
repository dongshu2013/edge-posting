"use client";

import { CustomPagination } from "@/components/CustomPagination";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { getShortAddress } from "@/utils/commonUtils";
import { formatDate } from "@/utils/timeUtils";
import {
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";

interface Transaction {
  id: string;
  amount: number;
  buzzId: string;
  status: "PENDING" | "COMPLETED";
  fromAddress: string;
  toAddress: string;
  createdAt: string;
  settledAt: string;
}

interface PaginatedResponse {
  items: Transaction[];
  totalCount: number;
}

export default function MyTxsPage() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"newest" | "status">("newest");
  const { user, loading } = useAuth();

  const txsQuery = useQuery<PaginatedResponse>({
    queryKey: ["user-txs", page, user?.uid],
    queryFn: async () => {
      try {
        const url = new URL(`/api/tx/my`, window.location.origin);
        url.searchParams.set("page", page.toString());

        const data = await fetchApi(url.toString(), { auth: true });
        return data;
      } catch (err) {
        throw err;
      }
    },
  });

  const userTxs = txsQuery.data?.items || [];
  const totalCount = txsQuery.data?.totalCount || 0;

  if (!user) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "newest" | "status")}
          className="w-[260px] text-base sm:text-lg border-gray-300 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 py-2 pl-4 pr-8"
        >
          <option value="newest">✨ Newest First</option>
          <option value="status">📊 By Status</option>
        </select>
      </div>

      {txsQuery.isLoading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-[32px] rounded-lg" />
          ))}
        </div>
      ) : userTxs.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-col items-stretch gap-2">
            {userTxs.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 overflow-hidden w-full"
              >
                <div className="p-3">
                  {/* Reply Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-[13px] text-gray-500 ml-1">
                        {formatDate(dayjs(tx.createdAt).unix())}
                      </span>

                      {tx.toAddress === user.uid ? (
                        <span className="text-[13px] text-green-800 ml-1 bg-green-50 px-1.5 py-0.5 rounded-md">
                          In
                        </span>
                      ) : (
                        <span className="text-[13px] text-red-800 ml-1 bg-red-50 px-1.5 py-0.5 rounded-md">
                          Out
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800">
                        {tx.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-3 mb-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-[13px] text-gray-600">From</div>

                      <p className="text-[13px] text-gray-800 line-clamp-2">
                        {getShortAddress(tx.fromAddress, 6)}
                      </p>
                    </div>

                    <div className="flex-1">
                      <div className="text-[13px] text-gray-600">To</div>

                      <p className="text-[13px] text-gray-800 line-clamp-2">
                        {getShortAddress(tx.toAddress, 6)}
                      </p>
                    </div>

                    <div className="flex-1">
                      <div className="text-[13px] text-gray-600">Amount</div>

                      <p className="text-[13px] text-gray-800 line-clamp-2">
                        {tx.amount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <CustomPagination
            page={page}
            setPage={setPage}
            totalCount={totalCount}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-9 text-center">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No txs yet</h3>
        </div>
      )}
    </div>
  );
}
