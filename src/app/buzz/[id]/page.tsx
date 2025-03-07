'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatBubbleLeftRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import BuzzCard from '@/components/BuzzCard';

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
  const [buzz] = useState<BuzzDetail>(MOCK_BUZZ);

  return (
    <div className="flex-1">
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
      <div className="mb-6">
        <BuzzCard
          id={buzz.id}
          tweetLink={buzz.tweetLink}
          instructions={buzz.instructions}
          credit={buzz.credit}
          replyCount={buzz.tweet.replyCount}
          showViewReplies={false}
          createdBy={buzz.createdBy}
        />
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