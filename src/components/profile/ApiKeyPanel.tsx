"use client";

import { fetchApi } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { Copy, PencilIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { ConfirmDialog } from "../dialog/ConfirmDialog";

export const ApiKeyPanel = () => {
  const { userInfo, updateUserInfo } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const apiKeyQuery = useQuery<string | null>({
    queryKey: ["api-key", userInfo?.uid],
    enabled: !!userInfo?.uid,
    queryFn: async () => {
      const res = await fetchApi("/api/api-key", { auth: true });
      return res.apiKey || null;
    },
  });

  const handleCreateApiKey = async () => {
    try {
      setIsLoading(true);

      const resJson = await fetchApi("/api/api-key", {
        auth: true,
        method: "POST",
        body: JSON.stringify({}),
      });

      if (resJson.error) {
        throw new Error(resJson.error);
      }

      updateUserInfo();
      toast.success("Api key created successfully");
      setShowConfirmModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
      apiKeyQuery.refetch();
    }
  };

  return (
    <>
      <div className="col-span-2">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Extension Api Key</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium text-gray-900">
                {apiKeyQuery.data || "--"}
              </p>

              {apiKeyQuery.data && (
                <Copy
                  className="w-4 h-4 cursor-pointer text-gray-500"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKeyQuery.data || "");
                    toast.success("Copied");
                  }}
                />
              )}
            </div>
          </div>

          {!apiKeyQuery.isLoading && (
            <button
              onClick={() => {
                if (apiKeyQuery.data) {
                  setShowConfirmModal(true);
                } else {
                  handleCreateApiKey();
                }
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 h-fit"
            >
              <PencilIcon className="h-4 w-4 mr-1.5" />
              {apiKeyQuery.data ? "Refresh Api Key" : "Create Api Key"}
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Refresh api key Confirmation"
        description="You already have a api key bound to your account. Binding a new api key will replace the existing one. Do you want to continue?"
        onConfirm={handleCreateApiKey}
      />
    </>
  );
};
