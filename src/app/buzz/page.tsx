'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-900">Active Buzzes</h3>
          <div className="flex items-center space-x-4">
            <label htmlFor="sortBy" className="text-sm text-gray-500">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price' | 'engagement')}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="price">Highest Price</option>
              <option value="engagement">Highest Engagement</option>
            </select>
          </div>
        </div>
        <ul className="divide-y divide-gray-200">
          {sortedBuzzes.map((buzz) => (
            <li key={buzz.id} className="px-6 py-5">
              <div className="flex justify-end space-x-2 mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-medium">
                  Price: {buzz.credit} BUZZ
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 text-xs font-medium">
                  Balance: {calculateTotalBuzz(buzz)} BUZZ
                </span>
              </div>

              <div className="flex items-start space-x-3">
                {!failedAvatars.has(buzz.tweet.author.avatar) ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={buzz.tweet.author.avatar}
                    alt=""
                    onError={() => setFailedAvatars(prev => new Set([...prev, buzz.tweet.author.avatar]))}
                  />
                ) : (
                  <DefaultAvatar />
                )}
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1 text-sm">
                    <span className="font-medium text-gray-900">{buzz.tweet.author.name}</span>
                    <span className="text-gray-500">@{buzz.tweet.author.handle}</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500">
                      {new Date(buzz.createdAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  <p className="mt-1 text-gray-900">{truncateText(buzz.tweet.text)}</p>
                  
                  <div className="mt-2 flex items-center space-x-4 text-gray-500 text-sm">
                    <span className="flex items-center">
                      <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.255 0 5.74 7.034 11.596 8.55 11.658 1.518-.062 8.55-5.917 8.55-11.658 0-2.267-1.823-4.255-3.903-4.255-2.528 0-3.94 2.936-3.952 2.965-.23.562-1.156.562-1.387 0-.014-.03-1.425-2.965-3.954-2.965z"></path>
                      </svg>
                      {buzz.tweet.replyCount.toLocaleString()} replies
                    </span>
                    {buzz.tweet.hasImages && (
                      <span className="flex items-center">
                        <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.75 2H4.25C3.01 2 2 3.01 2 4.25v15.5C2 20.99 3.01 22 4.25 22h15.5c1.24 0 2.25-1.01 2.25-2.25V4.25C22 3.01 20.99 2 19.75 2zM4.25 3.5h15.5c.413 0 .75.337.75.75v9.676l-3.858-3.858c-.14-.14-.33-.22-.53-.22h-.003c-.2 0-.393.08-.532.224l-4.317 4.384-1.813-1.806c-.14-.14-.33-.22-.53-.22-.193-.03-.395.08-.535.227L3.5 17.642V4.25c0-.413.337-.75.75-.75zm-.744 16.28l5.418-5.534 6.282 6.254H4.25c-.402 0-.727-.322-.744-.72zm16.244.72h-2.42l-5.007-4.987 3.792-3.85 4.385 4.384v3.703c0 .413-.337.75-.75.75z"></path>
                        </svg>
                        Image
                      </span>
                    )}
                    <a
                      href={buzz.tweetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-150"
                    >
                      View on Twitter
                      <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.92 11.62a1 1 0 00-.21-.33l-5-5a1 1 0 00-1.42 1.42l3.3 3.29H7a1 1 0 000 2h7.59l-3.3 3.29a1 1 0 000 1.42 1 1 0 001.42 0l5-5a1 1 0 00.21-.33 1 1 0 000-.76z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">How to Play</h4>
                <p className="text-sm text-gray-600">
                  {buzz.instructions}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 