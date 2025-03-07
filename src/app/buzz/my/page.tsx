'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { SparklesIcon, PlusIcon } from '@heroicons/react/24/outline';
import BuzzCard from '@/components/BuzzCard';

interface Buzz {
  id: string;
  tweetLink: string;
  instructions: string;
  credit: number;
  createdAt: Date;
  createdBy: string;
  tweet: {
    author: {
      handle: string;
      name: string;
      avatar: string;
    };
    text: string;
    hasImages: boolean;
    replyCount: number;
  };
}

// Mock data for demonstration
const MOCK_MY_BUZZES: Buzz[] = [
  {
    id: '1',
    tweetLink: 'https://twitter.com/johnrushx/status/1897655569101779201',
    instructions: 'Discuss the potential impact of this AI development on content creation and suggest innovative ways it could be applied.',
    credit: 0.05,
    createdAt: new Date('2024-03-05T10:30:00'),
    createdBy: '0x1234...5678',
    tweet: {
      author: {
        handle: 'johnrushx',
        name: 'John Rush',
        avatar: 'https://pbs.twimg.com/profile_images/1897655569101779201/john_400x400.jpg'
      },
      text: 'finally I\'m done with all my queries I just need to put everything together and we are up an running',
      hasImages: false,
      replyCount: 1542
    }
  }
];

export default function MyBuzzesPage() {
  const { isConnected } = useAccount();
  const [buzzes] = useState<Buzz[]>(MOCK_MY_BUZZES);
  const [sortBy, setSortBy] = useState<'newest' | 'engagement'>('newest');

  const sortedBuzzes = [...buzzes].sort((a, b) => {
    switch (sortBy) {
      case 'engagement':
        return b.tweet.replyCount - a.tweet.replyCount;
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-center">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Connect Your Wallet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please connect your wallet to view your buzzes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'engagement')}
              className="text-sm border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
            >
              <option value="newest">✨ Newest First</option>
              <option value="engagement">🔥 Highest Engagement</option>
            </select>
            <Link
              href="/buzz/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Buzz
            </Link>
          </div>

          <div className="space-y-6">
            {sortedBuzzes.length > 0 ? (
              sortedBuzzes.map((buzz) => (
                <BuzzCard
                  key={buzz.id}
                  id={buzz.id}
                  tweetLink={buzz.tweetLink}
                  instructions={buzz.instructions}
                  credit={buzz.credit}
                  replyCount={buzz.tweet.replyCount}
                  createdBy={buzz.createdBy}
                />
              ))
            ) : (
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 p-12 text-center">
                <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No buzzes yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first buzz to start getting AI-powered engagement!
                </p>
                <div className="mt-6">
                  <Link
                    href="/buzz/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Create Your First Buzz
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 