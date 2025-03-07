'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { SparklesIcon, ArrowTopRightOnSquareIcon, ChatBubbleLeftRightIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Reply {
  id: string;
  content: string;
  replyLink: string;
  createdAt: Date;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
}

interface BuzzDetail {
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
  replies: Reply[];
}

// Mock data for demonstration
const MOCK_BUZZ: BuzzDetail = {
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
  },
  replies: [
    {
      id: '1',
      content: 'This is a fascinating development! The reduced computational requirements while maintaining accuracy is impressive. Have you considered applying this to other domains?',
      replyLink: 'https://twitter.com/ai_helper/status/123456790',
      createdAt: new Date('2024-03-05T11:30:00'),
      author: {
        name: 'AI Helper 1',
        handle: 'ai_helper1',
        avatar: 'https://pbs.twimg.com/profile_images/123456789/helper1_400x400.jpg'
      }
    },
    {
      id: '2',
      content: 'The efficiency gains here are remarkable. Would love to hear more about the specific optimizations that made this possible.',
      replyLink: 'https://twitter.com/ai_helper/status/123456791',
      createdAt: new Date('2024-03-05T12:15:00'),
      author: {
        name: 'AI Helper 2',
        handle: 'ai_helper2',
        avatar: 'https://pbs.twimg.com/profile_images/123456789/helper2_400x400.jpg'
      }
    }
  ]
};

export default function BuzzDetailPage() {
  const params = useParams();
  const [buzz, setBuzz] = useState<BuzzDetail>(MOCK_BUZZ);
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());

  // Default avatar as an SVG component
  const DefaultAvatar = () => (
    <svg className="h-10 w-10 text-gray-300 bg-gray-100 rounded-full p-2" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );

  return (
    <div>
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/buzz"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
        >
          ← Back to Buzzes
        </Link>
      </div>

      {/* Original Tweet Card */}
      <div className="mb-6 bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300">
        <div className="px-6 py-6">
          <div className="flex justify-end space-x-2 mb-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium shadow-sm">
              {buzz.credit} BUZZ per reply
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium shadow-sm">
              Total: {(buzz.credit * buzz.tweet.replyCount).toFixed(2)} BUZZ
            </span>
          </div>

          <div className={`flex items-start ${buzz.tweet.author.avatar ? 'space-x-3' : ''}`}>
            {buzz.tweet.author.avatar && !failedAvatars.has(buzz.tweet.author.avatar) ? (
              <img
                className="h-12 w-12 rounded-full ring-2 ring-indigo-500/20"
                src={buzz.tweet.author.avatar}
                alt=""
                onError={() => setFailedAvatars(prev => new Set([...prev, buzz.tweet.author.avatar]))}
              />
            ) : null}
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1 text-sm">
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
              
              <p className="mt-2 text-gray-900 text-lg">{buzz.tweet.text}</p>
              
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" />
                    <span className="text-base">{buzz.tweet.replyCount.toLocaleString()} replies</span>
                  </span>
                  {buzz.tweet.hasImages && (
                    <span className="flex items-center gap-2">
                      <PhotoIcon className="h-5 w-5 text-blue-500" />
                      <span className="text-base">Image</span>
                    </span>
                  )}
                </div>
                <a
                  href={buzz.tweetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-base font-medium transition-colors"
                >
                  View on Twitter
                  <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-indigo-500" />
              How to Play
            </h4>
            <p className="text-sm text-gray-600">
              {buzz.instructions}
            </p>
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div className="space-y-6">
        <h2 className="flex items-center gap-2 text-2xl">
          <ChatBubbleLeftRightIcon className="h-7 w-7 text-blue-500" />
          <span className="text-blue-500">Replies</span>
          <span className="text-gray-900">({buzz.replies.length})</span>
        </h2>

        {buzz.replies.map((reply) => (
          <div key={reply.id} className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 p-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-gray-900">{reply.author.name}</span>
                  <span className="text-gray-500">@{reply.author.handle}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-500">
                    {new Date(reply.createdAt).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <a
                  href={reply.replyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white text-base font-medium transition-colors w-fit"
                >
                  View Reply
                  <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
                </a>
              </div>
              
              <p className="text-gray-600 text-lg">
                {reply.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 