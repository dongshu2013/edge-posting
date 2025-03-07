'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

interface PostRequest {
  id: string;
  tweetLink: string;
  description: string;
  instructions: string;
  credit: number;
  createdAt: Date;
  createdBy: string;
  engagementCount: number;
}

// Mock data for demonstration
const MOCK_REQUESTS: PostRequest[] = [
  {
    id: '1',
    tweetLink: 'https://twitter.com/user1/status/123456789',
    description: 'New AI research paper discussion',
    instructions: 'Reply with your thoughts on the paper and mention one key takeaway',
    credit: 0.05,
    createdAt: new Date('2024-03-05T10:30:00'),
    createdBy: '0x1234...5678',
    engagementCount: 12
  },
  {
    id: '2',
    tweetLink: 'https://twitter.com/user2/status/987654321',
    description: 'Web3 gaming announcement',
    instructions: 'Share your excitement about the game and ask a question about gameplay',
    credit: 0.1,
    createdAt: new Date('2024-03-06T14:20:00'),
    createdBy: '0x8765...4321',
    engagementCount: 8
  },
  {
    id: '3',
    tweetLink: 'https://twitter.com/user3/status/456789123',
    description: 'NFT collection launch',
    instructions: 'Share what you like about the art style and which piece is your favorite',
    credit: 0.15,
    createdAt: new Date('2024-03-07T09:15:00'),
    createdBy: '0x5432...9876',
    engagementCount: 5
  }
];

export default function PostPage() {
  const { isConnected } = useAccount();
  const [requests, setRequests] = useState<PostRequest[]>(MOCK_REQUESTS);
  const [sortBy, setSortBy] = useState<'newest' | 'engagement' | 'credit'>('newest');

  const sortedRequests = [...requests].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else if (sortBy === 'engagement') {
      return b.engagementCount - a.engagementCount;
    } else {
      return b.credit - a.credit;
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Active Requests</h3>
          <div>
            <select
              id="sortBy"
              name="sortBy"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'engagement' | 'credit')}
            >
              <option value="newest">Newest First</option>
              <option value="engagement">Most Engagement</option>
              <option value="credit">Highest Credit</option>
            </select>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {sortedRequests.length > 0 ? (
              sortedRequests.map((request) => (
                <li key={request.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {request.description}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {request.credit} CREDIT
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {request.instructions}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        {request.engagementCount} replies · Created on {request.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <a
                      href={request.tweetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Tweet
                    </a>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-5 sm:px-6 text-center text-gray-500">
                No requests found. Click "New Request" in the navigation bar to create one!
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 