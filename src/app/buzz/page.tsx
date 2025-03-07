'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { SparklesIcon, ChatBubbleLeftRightIcon, PhotoIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

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
const MOCK_BUZZES: Buzz[] = [
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
  },
  {
    id: '2',
    tweetLink: 'https://twitter.com/vitalik/status/987654321',
    instructions: 'Discuss how this gaming innovation could impact player engagement and suggest potential use cases.',
    credit: 0.1,
    createdAt: new Date('2024-03-06T14:20:00'),
    createdBy: '0x8765...4321',
    tweet: {
      author: {
        handle: 'vitalik',
        name: 'Vitalik Buterin',
        avatar: 'https://pbs.twimg.com/profile_images/987654321/vitalik_400x400.jpg'
      },
      text: 'New proposal for scaling blockchain gaming: using zero-knowledge proofs for off-chain state management while maintaining on-chain security. Thoughts?',
      hasImages: false,
      replyCount: 832
    }
  }
];

export default function BuzzesPage() {
  const { isConnected } = useAccount();
  const [buzzes, setBuzzes] = useState<Buzz[]>(MOCK_BUZZES);
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'engagement'>('newest');

  const truncateText = (text: string, minWords: number = 10) => {
    const words = text.split(' ');
    if (words.length <= minWords) return text;
    return words.slice(0, Math.max(minWords, Math.min(15, words.length))).join(' ') + '...';
  };

  // Default avatar as an SVG component
  const DefaultAvatar = () => (
    <svg className="h-10 w-10 text-gray-300 bg-gray-100 rounded-full p-2" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );

  const calculateTotalBuzz = (buzz: Buzz) => {
    return (buzz.credit * buzz.tweet.replyCount).toFixed(2);
  };

  const sortedBuzzes = [...buzzes].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.credit - a.credit;
      case 'engagement':
        return b.tweet.replyCount - a.tweet.replyCount;
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 bg-white shadow-xl rounded-2xl overflow-hidden backdrop-blur-xl bg-white/90 border border-gray-100">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center">
              <SparklesIcon className="h-7 w-7 mr-2 text-indigo-500" />
              Active Buzzes 🐝
            </h3>
            <div className="flex items-center space-x-4">
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'price' | 'engagement')}
                className="text-sm border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
              >
                <option value="newest">✨ Newest First</option>
                <option value="price">💰 Highest Price</option>
                <option value="engagement">🔥 Highest Engagement</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {sortedBuzzes.map((buzz) => (
            <div key={buzz.id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300 p-4 sm:p-6 backdrop-blur-xl bg-white/90 border border-gray-100">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium shadow-sm">
                  {buzz.credit} BUZZ per reply
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium shadow-sm">
                  Total: {calculateTotalBuzz(buzz)} BUZZ
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-shrink-0">
                  {buzz.tweet.author.avatar && !failedAvatars.has(buzz.tweet.author.avatar) ? (
                    <img
                      className="h-10 w-10 rounded-full ring-2 ring-indigo-500/20"
                      src={buzz.tweet.author.avatar}
                      alt=""
                      onError={() => setFailedAvatars(prev => new Set([...prev, buzz.tweet.author.avatar]))}
                    />
                  ) : null}
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
          ))}
        </div>
      </div>
    </div>
  );
} 