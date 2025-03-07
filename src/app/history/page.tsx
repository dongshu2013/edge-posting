'use client';

import { useState } from 'react';
import { format } from 'date-fns';

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
  const [history, setHistory] = useState<PostedTweet[]>(MOCK_HISTORY);
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
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Posting History</h3>
            <p className="mt-1 text-sm text-gray-500">
              Total earnings: {totalEarnings.toFixed(2)} BUZZ
            </p>
          </div>
          <div>
            <select
              id="sortBy"
              name="sortBy"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'highest-credit')}
            >
              <option value="newest">Newest First</option>
              <option value="highest-credit">Highest Credit</option>
            </select>
          </div>
        </div>
        <div className="border-t border-gray-200">
          {sortedHistory.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {sortedHistory.map((tweet) => (
                <li key={tweet.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <a
                        href={tweet.tweetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        Original Tweet
                      </a>
                      <span className="text-gray-300">|</span>
                      <a
                        href={tweet.replyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        Your Reply
                      </a>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        +{tweet.credit} BUZZ
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {tweet.content}
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Posted on {format(tweet.postedAt, 'MMM d, yyyy h:mm a')}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
              <p className="text-lg">No posting history yet. Start posting to see your history here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 