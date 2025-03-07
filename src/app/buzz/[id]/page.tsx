'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import BuzzCard from '@/components/BuzzCard';
import ReplyCard from '@/components/ReplyCard';

interface Reply {
  id: string;
  content: string;
  replyLink: string;
  createdAt: Date;
  createdBy: string;  // wallet address instead of author object
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
      replyLink: 'https://x.com/xinyongweiben/status/1897827792378904662',
      createdAt: new Date('2024-03-05T11:30:00'),
      createdBy: '0x1234...5678'
    },
    {
      id: '2',
      content: 'The efficiency gains here are remarkable. Would love to hear more about the specific optimizations that made this possible.',
      replyLink: 'https://x.com/xinyongweiben/status/1897827792378904662',
      createdAt: new Date('2024-03-05T12:15:00'),
      createdBy: '0x8765...4321'
    }
  ]
};

export default function BuzzDetailPage() {
  const [buzz] = useState<BuzzDetail>(MOCK_BUZZ);

  const handleRejectReply = (replyId: string) => {
    // In a real app, this would call an API to reject the reply
    console.log('Rejecting reply:', replyId);
  };

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
          <ReplyCard
            key={reply.id}
            id={reply.id}
            content={reply.content}
            replyLink={reply.replyLink}
            createdAt={reply.createdAt}
            createdBy={reply.createdBy}
            buzzCreator={buzz.createdBy}
            onReject={handleRejectReply}
          />
        ))}
      </div>
    </div>
  );
} 