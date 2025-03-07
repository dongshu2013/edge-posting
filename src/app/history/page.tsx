'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { SparklesIcon, ArrowTopRightOnSquareIcon, ClockIcon } from '@heroicons/react/24/outline';

interface PostedTweet {
  id: string;
  requestId: string;
  tweetLink: string;
  replyLink: string;
  content: string;
  postedAt: Date;
  credit: number;
}

// Mock data for demonstration
const MOCK_HISTORY: PostedTweet[] = [
  {
    id: '1',
    requestId: '1',
    tweetLink: 'https://twitter.com/user1/status/123456789',
    replyLink: 'https://twitter.com/ai_helper/status/123456790',
    content: 'This paper presents a fascinating approach to multi-modal learning. The key takeaway for me is how they managed to reduce computational requirements while maintaining accuracy.',
    postedAt: new Date('2024-03-06T11:45:00'),
    credit: 0.05
  },
  {
    id: '2',
    requestId: '2',
    tweetLink: 'https://twitter.com/user2/status/987654321',
    replyLink: 'https://twitter.com/ai_helper/status/987654322',
    content: 'The integration of blockchain technology in this gaming platform opens up exciting possibilities for true digital ownership. Looking forward to seeing how this impacts player engagement!',
    postedAt: new Date('2024-03-07T15:30:00'),
    credit: 0.1
  }
];

export default function HistoryPage() {
  const [history] = useState<PostedTweet[]>(MOCK_HISTORY);
  const [sortBy, setSortBy] = useState<'newest' | 'highest-credit'>('newest');

  const sortedHistory = [...history].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.postedAt.getTime() - a.postedAt.getTime();
    } else {
      return b.credit - a.credit;
    }
  });

  const totalEarnings = history.reduce((sum, tweet) => sum + tweet.credit, 0);

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'highest-credit')}
            className="text-sm border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
          >
            <option value="newest">✨ Newest First</option>
            <option value="highest-credit">💰 Highest Earnings</option>
          </select>
          <div className="flex items-center gap-4 bg-white rounded-2xl px-6 py-2.5 shadow-sm">
            <span className="text-gray-600">Total earnings:</span>
            <span className="text-xl font-semibold text-amber-500">
              {totalEarnings.toFixed(2)} BUZZ
            </span>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {sortedHistory.length > 0 ? (
            sortedHistory.map((tweet) => (
              <div key={tweet.id} className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <a
                    href={tweet.tweetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                  >
                    Original Tweet
                    <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                  </a>
                  <div className="text-gray-300">|</div>
                  <a
                    href={tweet.replyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Your Reply
                    <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                  </a>
                  <div className="flex-grow"></div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium">
                    +{tweet.credit} BUZZ
                  </span>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
                  <p className="text-gray-600 text-sm">
                    {tweet.content}
                  </p>
                </div>

                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {format(tweet.postedAt, 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No history yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start posting to see your history here! 🚀
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 