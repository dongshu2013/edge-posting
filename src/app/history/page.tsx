'use client';

import { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ReplyCard from '@/components/ReplyCard';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

interface Reply {
  id: string;
  replyLink: string;
  text: string;
  createdAt: Date;
  createdBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  buzz: {
    id: string;
    createdBy: string;
  };
}

export default function HistoryPage() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    const fetchReplies = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/reply/my?address=${address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch replies');
        }

        const data = await response.json();
        setReplies(data);
      } catch (err) {
        console.error('Error fetching replies:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch replies');
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      fetchReplies();
    }
  }, [isConnected, address, router]);

  if (!isConnected) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex-1">
        <div className="space-y-6">
          {replies.length > 0 ? (
            replies.map((reply) => (
              <ReplyCard
                key={reply.id}
                id={reply.id}
                replyLink={reply.replyLink}
                text={reply.text}
                createdAt={new Date(reply.createdAt)}
                createdBy={reply.createdBy}
                buzzCreator={reply.buzz.createdBy}
                buzzId={reply.buzz.id}
                status={reply.status}
                showOriginalBuzzButton={true}
                showRejectButton={false}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No replies yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start engaging with buzzes to see your replies here! 🚀
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 