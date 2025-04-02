import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";

interface KolApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KolApplyModal({ isOpen, onClose }: KolApplyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { userInfo } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await fetchApi("/api/kol/apply", {
        auth: true,
        method: "POST",
      });

      const resJson = await response.json();
      if (resJson.success) {
        toast.success("Your KOL application has been submitted!");
        onClose();
      } else {
        toast.error("Failed to submit application");
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Apply to become a KOL</h2>
        <p className="text-gray-600 mb-4">
          Join our network of Key Opinion Leaders and help promote our platform.
          Please confirm your information below.
        </p>

        <div>
          <label
            htmlFor="twitterHandle"
            className="block text-sm font-medium text-gray-700"
          >
            Twitter Handle
          </label>
          <label
            id="twitterHandle"
            className="block text-sm font-medium text-gray-500"
          >
            {`@${userInfo?.twitterUsername}`}
          </label>
        </div>

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700"
          >
            Bio
          </label>

          <label id="bio" className="block text-sm font-medium text-gray-500">
            {userInfo?.bio || "Empty Bio"}
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {isLoading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
