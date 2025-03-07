import { useAccount } from 'wagmi';

interface ReplyCardProps {
  id: string;
  content: string;
  replyLink: string;
  createdAt: Date;
  createdBy: string;
  buzzCreator: string;
  onReject?: (replyId: string) => void;
}

// Utility function to convert tweet URL to embed URL
const getEmbedUrl = (tweetUrl: string) => {
  try {
    const url = new URL(tweetUrl);
    const pathParts = url.pathname.split('/');
    const tweetId = pathParts[pathParts.length - 1];
    return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light&cards=hidden&conversation=none&align=center`;
  } catch {
    return tweetUrl;
  }
};

export default function ReplyCard({ 
  id, 
  content, 
  replyLink, 
  createdAt, 
  createdBy,
  buzzCreator,
  onReject 
}: ReplyCardProps) {
  const { address } = useAccount();
  const isOwner = address && buzzCreator && address.toLowerCase() === buzzCreator.toLowerCase();

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:gap-6">
        {/* Tweet Embed */}
        <div className="w-full lg:w-[350px] border border-gray-200 rounded-xl overflow-hidden shrink-0 mb-4 lg:mb-0">
          <div className="aspect-[3/4]">
            <iframe
              src={getEmbedUrl(replyLink)}
              className="w-full h-full"
              frameBorder="0"
              title="Reply Preview"
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-500 break-all">
                {createdBy}
              </span>
              <span className="text-gray-400 hidden sm:inline">·</span>
              <span className="text-sm text-gray-500">
                {new Date(createdAt).toLocaleDateString(undefined, { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            {isOwner && onReject && (
              <button
                onClick={() => onReject(id)}
                className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-1.5 border border-red-300 text-sm font-medium rounded-lg text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reject
              </button>
            )}
          </div>
          
          <p className="text-gray-600 text-base sm:text-lg break-words">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
} 