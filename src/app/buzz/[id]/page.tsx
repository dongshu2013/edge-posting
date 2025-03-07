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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="mb-6 bg-white shadow-xl rounded-2xl overflow-hidden backdrop-blur-xl bg-white/90 border border-gray-100">
          <div className="px-6 py-6">
            <div className="flex justify-end space-x-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium shadow-sm">
                {buzz.credit} BUZZ per reply
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium shadow-sm">
                Total: {(buzz.credit * buzz.tweet.replyCount).toFixed(2)} BUZZ
              </span>
            </div>

            <div className="flex items-start space-x-3">
              {!failedAvatars.has(buzz.tweet.author.avatar) ? (
                <img
                  className="h-12 w-12 rounded-full ring-2 ring-indigo-500/20"
                  src={buzz.tweet.author.avatar}
                  alt=""
                  onError={() => setFailedAvatars(prev => new Set([...prev, buzz.tweet.author.avatar]))}
                />
              ) : (
                <DefaultAvatar />
              )}
              
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
                
                <p className="mt-1 text-gray-900">{buzz.tweet.text}</p>
                
                <div className="mt-2 flex items-center space-x-4 text-gray-500 text-sm">
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
                  <a
                    href={buzz.tweetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                  >
                    View on Twitter
                    <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-4 transform transition-all duration-200 hover:scale-[1.01]">
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
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center">
            <ChatBubbleLeftRightIcon className="h-7 w-7 mr-2 text-indigo-500" />
            Replies ({buzz.replies.length})
          </h2>

          {buzz.replies.map((reply) => (
            <div key={reply.id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300 p-6 backdrop-blur-xl bg-white/90 border border-gray-100">
              <div className="flex items-start space-x-3">
                {!failedAvatars.has(reply.author.avatar) ? (
                  <img
                    className="h-10 w-10 rounded-full ring-2 ring-indigo-500/20"
                    src={reply.author.avatar}
                    alt=""
                    onError={() => setFailedAvatars(prev => new Set([...prev, reply.author.avatar]))}
                  />
                ) : (
                  <DefaultAvatar />
                )}
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-sm">
                      <span className="font-semibold text-gray-900">{reply.author.name}</span>
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
                      className="inline-flex items-center px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                    >
                      View Reply
                      <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                    </a>
                  </div>
                  
                  <p className="mt-2 text-gray-600">
                    {reply.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 