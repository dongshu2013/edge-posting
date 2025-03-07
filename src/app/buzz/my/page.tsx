'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { SparklesIcon, ChatBubbleLeftRightIcon, PhotoIcon, ArrowTopRightOnSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

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
    tweetLink: 'https://twitter.com/elonmusk/status/123456789',
    instructions: 'Share your thoughts on the scalability solutions presented in the thread and suggest potential improvements.',
    credit: 0.05,
    createdAt: new Date('2024-03-05T10:30:00'),
    createdBy: '0x1234...5678',
    tweet: {
      author: {
        handle: 'elonmusk',
        name: 'Elon Musk',
        avatar: 'https://pbs.twimg.com/profile_images/123456789/elon_400x400.jpg'
      },
      text: 'Excited to announce our new AI model that achieves state-of-the-art performance while using 50% less compute. This is a major breakthrough for scalable AI! 🚀',
      hasImages: true,
      replyCount: 1542
    }
  }
];

export default function MyBuzzesPage() {
  const { isConnected } = useAccount();
  const [buzzes] = useState<Buzz[]>(MOCK_MY_BUZZES);
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'newest' | 'engagement'>('newest');

  const truncateText = (text: string, minWords: number = 10) => {
    const words = text.split(' ');
    if (words.length <= minWords) return text;
    return words.slice(0, Math.max(minWords, Math.min(15, words.length))).join(' ') + '...';
  };

  const calculateTotalBuzz = (buzz: Buzz) => {
    return (buzz.credit * buzz.tweet.replyCount).toFixed(2);
  };

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
              <div key={buzz.id} className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 p-4 sm:p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl bg-amber-500 text-white text-sm font-medium">
                    {buzz.credit} BUZZ per reply
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl bg-emerald-500 text-white text-sm font-medium">
                    Total: {calculateTotalBuzz(buzz)} BUZZ
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-2xl bg-blue-500 text-white text-sm font-medium">
                    Left: {(buzz.credit * Math.max(0, buzz.tweet.replyCount - 10)).toFixed(2)} BUZZ
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-shrink-0">
                    {buzz.tweet.author.avatar && !failedAvatars.has(buzz.tweet.author.avatar) && (
                      <Image
                        className="h-10 w-10 rounded-full ring-2 ring-indigo-500/20"
                        src={buzz.tweet.author.avatar}
                        alt={`${buzz.tweet.author.name}'s avatar`}
                        width={40}
                        height={40}
                        onError={() => setFailedAvatars(prev => new Set([...prev, buzz.tweet.author.avatar]))}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 text-sm">
                      <span className="font-semibold text-gray-900">{buzz.tweet.author.name}</span>
                      <span className="text-gray-500">@{buzz.tweet.author.handle}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-500">
                        {new Date(buzz.createdAt).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-gray-900 break-words">{truncateText(buzz.tweet.text)}</p>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-500 text-sm">
                      <span className="flex items-center">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 mr-1 text-indigo-500" />
                        {buzz.tweet.replyCount.toLocaleString()} replies
                      </span>
                      {buzz.tweet.hasImages && (
                        <span className="flex items-center">
                          <PhotoIcon className="h-5 w-5 mr-1 text-indigo-500" />
                          Image
                        </span>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={buzz.tweetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                        >
                          View on Twitter
                          <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                        </a>
                        <Link
                          href={`/buzz/${buzz.id}`}
                          className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                        >
                          View Replies
                          <ChatBubbleLeftRightIcon className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-4 transform transition-all duration-200 hover:scale-[1.01]">
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    How to Play
                  </h4>
                  <p className="text-sm text-gray-600 break-words">
                    {buzz.instructions}
                  </p>
                </div>
              </div>
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
  );
} 