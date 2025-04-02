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
  const [selectedArea, setSelectedArea] = useState<string>("");
  const { userInfo } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const resJson = await fetchApi("/api/kol/apply", {
        auth: true,
        method: "POST",
        body: JSON.stringify({ area: Number(selectedArea) }),
      });

      if (resJson?.success) {
        toast.success("Your KOL application has been submitted!");
        onClose();
      } else {
        toast.error("Failed to submit application");
      }
    } catch (err) {
      toast.error("An error occurred while submitting your application");
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

        <div className="mt-4">
          <label
            htmlFor="area"
            className="block text-sm font-medium text-gray-700"
          >
            Area
          </label>
          <select
            id="area"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select your area</option>
            <option value="1">America/Europe</option>
            <option value="2">Korea</option>
            <option value="3">China</option>
            <option value="4">Japan</option>
            <option value="5">South Asia</option>
          </select>
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
            disabled={isLoading || !selectedArea}
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
