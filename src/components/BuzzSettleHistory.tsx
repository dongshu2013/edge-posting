import { fetchApi } from "@/lib/api";
import { decimalFloat, formatNumberWithUnit } from "@/utils";
import { formatChainAmount } from "@/utils/numberUtils";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface SettleHistory {
  id: string;
  buzzId: string;
  settleAmount: string;
  kolId?: string;
  userId?: string;
  createdAt: Date;
  type: string;
  user?: {
    nickname: string;
  };
  kol?: {
    nickname: string;
  };
  buzz: {
    paymentToken: string;
    tokenDecimals: number;
  };
}

interface BuzzSettleHistoryProps {
  buzzId: string;
}

export default function BuzzSettleHistory({ buzzId }: BuzzSettleHistoryProps) {
  const [page, setPage] = useState(1);

  const historyQuery = useQuery({
    queryKey: ["settle-history", buzzId, page],
    queryFn: async () => {
      const resJson = await fetchApi(
        `/api/buzz/${buzzId}/settle-history?page=${page}`
      );
      return resJson;
    },
  });

  const settleHistories: SettleHistory[] =
    historyQuery.data?.settleHistories || [];
  const totalCount = historyQuery.data?.totalCount || 0;

  if (historyQuery.isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-40 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (settleHistories.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-8 text-center">
        <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          No settle history yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Settlement history will appear here after the buzz is settled
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-1">
      {settleHistories.map((history) => (
        <div key={history.id} className="border-b border-b-gray-100 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {history.user?.nickname || history.kol?.nickname || "Unknown"}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(history.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-500">
                {decimalFloat(
                  formatChainAmount(
                    history.settleAmount,
                    history.buzz.tokenDecimals
                  )
                )}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  history.type === "KOL"
                    ? "bg-purple-100 text-purple-800"
                    : history.type === "Normal"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {history.type}
              </span>
            </div>
          </div>
        </div>
      ))}

      {totalCount > 0 && (
        <Pagination
          count={Math.ceil(totalCount / 10)}
          page={page}
          onChange={(_, value) => setPage(value)}
        />
      )}
    </div>
  );
}
