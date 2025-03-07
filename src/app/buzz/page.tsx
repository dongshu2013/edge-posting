'use client';

import { useState } from 'react';
import BuzzCard from '@/components/BuzzCard';

interface Buzz {
  id: string;
  tweetLink: string;
  instructions: string;
  context: string;
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
    context: 'This tweet discusses our latest breakthrough in AI model efficiency.',
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
    tweetLink: 'https://twitter.com/johnrushx/status/1897655569101779201',
    instructions: 'Discuss the potential impact of this AI development on content creation and suggest innovative ways it could be applied.',
    context: 'This tweet discusses the potential impact of AI on content creation.',
    credit: 0.1,
    createdAt: new Date('2024-03-06T14:20:00'),
    createdBy: '0x8765...4321',
    tweet: {
      author: {
        handle: 'johnrushx',
        name: 'John Rush',
        avatar: 'https://pbs.twimg.com/profile_images/1897655569101779201/john_400x400.jpg'
      },
      text: 'finally I\'m done with all my queries I just need to put everything together and we are up an running',
      hasImages: false,
      replyCount: 832
    }
  }
];

export default function BuzzesPage() {
  const [buzzes] = useState<Buzz[]>(MOCK_BUZZES);
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'engagement'>('newest');

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
    <div className="py-8">
      <div className="flex-1">
        <div className="flex mb-6">
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

        <div className="space-y-6">
          {sortedBuzzes.map((buzz) => (
            <BuzzCard
              key={buzz.id}
              id={buzz.id}
              tweetLink={buzz.tweetLink}
              instructions={buzz.instructions}
              context={buzz.context}
              credit={buzz.credit}
              replyCount={buzz.tweet.replyCount}
              createdBy={buzz.createdBy}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 