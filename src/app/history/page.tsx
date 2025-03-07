'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { SparklesIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ReplyCard from '@/components/ReplyCard';

interface Reply {
  id: string;
  content: string;
  replyLink: string;
  createdAt: Date;
  createdBy: string;
  buzzId: string;
  buzzCreator: string;
}

// Mock data for demonstration
const MOCK_HISTORY: Reply[] = [
  {
    id: '1',
    buzzId: '1',
    replyLink: 'https://x.com/xinyongweiben/status/1897827792378904662',
    content: 'This paper presents a fascinating approach to multi-modal learning. The key takeaway for me is how they managed to reduce computational requirements while maintaining accuracy.',
    createdAt: new Date('2024-03-06T11:45:00'),
    createdBy: '0x1234...5678',
    buzzCreator: '0x8765...4321'
  },
  {
    id: '2',
    buzzId: '2',
    replyLink: 'https://x.com/xinyongweiben/status/1897827792378904662',
    content: 'The integration of blockchain technology in this gaming platform opens up exciting possibilities for true digital ownership. Looking forward to seeing how this impacts player engagement!',
    createdAt: new Date('2024-03-07T15:30:00'),
    createdBy: '0x1234...5678',
    buzzCreator: '0x9876...5432'
  }
];

export default function HistoryPage() {
  const [history] = useState<Reply[]>(MOCK_HISTORY);
  const [sortBy, setSortBy] = useState<'newest' | 'highest-credit'>('newest');

  const sortedHistory = [...history].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else {
      return 0; // No credit sorting needed for replies
    }
  });

  return (
    <div className="py-8">
      <div className="flex-1">
        <div className="flex mb-6">
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'highest-credit')}
            className="text-sm border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
          >
            <option value="newest">✨ Newest First</option>
          </select>
        </div>

        <div className="space-y-6">
          {sortedHistory.length > 0 ? (
            sortedHistory.map((reply) => (
              <ReplyCard
                key={reply.id}
                id={reply.id}
                content={reply.content}
                replyLink={reply.replyLink}
                createdAt={reply.createdAt}
                createdBy={reply.createdBy}
                buzzCreator={reply.buzzCreator}
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