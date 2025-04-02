import Image from 'next/image';

interface KolCardProps {
  kol: any;
}

export default function KolCard({ kol }: KolCardProps) {
  // Format follower count with commas
  const formatFollowers = (count: number) => {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className="h-12 w-12 rounded-full overflow-hidden">
          <Image
            src={kol.avatar}
            alt={kol.name}
            width={48}
            height={48}
            className="object-cover"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{kol.nickname}</p>
        <p className="text-sm text-blue-600">{kol.twitterUsername}</p>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{kol.bio}</p>
      </div>

      <div className="flex-shrink-0 text-right hidden">
        <p className="text-sm font-medium text-gray-900">
          {1000}
        </p>
        <p className="text-xs text-gray-500">followers</p>
      </div>
    </div>
  );
} 