import { XMarkIcon } from "@heroicons/react/24/outline";

interface FollowTwitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  twitterUsername: string;
}

export default function FollowTwitterModal({
  isOpen,
  onClose,
  twitterUsername,
}: FollowTwitterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Follow Required
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-700 mb-4">
            To participate in this buzz, you need to follow our Twitter account first.
          </p>
          <a
            href={`https://twitter.com/${twitterUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-500 hover:bg-blue-600 transition-all duration-200"
          >
            Follow @{twitterUsername}
          </a>
        </div>
      </div>
    </div>
  );
} 