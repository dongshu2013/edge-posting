import { getDisplayArea } from "@/utils/commonUtils";
import { formatFollowers } from "@/utils/numberUtils";
import Image from "next/image";

interface KolCardProps {
  kol: any;
}

export default function KolCard({ kol }: KolCardProps) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <div className="h-12 w-12 rounded-full overflow-hidden">
          <Image
            src={kol.avatar}
            alt={"kol"}
            width={48}
            height={48}
            className="object-cover"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 gap-2">
          <p className="text-sm font-medium text-gray-900">{kol.nickname}</p>

          <p className="text-sm font-medium text-gray-500">
            {getDisplayArea(kol.area)}
          </p>
        </div>
        <p className="text-sm text-blue-600">@{kol.twitterUsername}</p>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {kol.description || "Empty"}
        </p>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-medium text-gray-900">
          {formatFollowers(kol.followers)}
        </p>
        <p className="text-xs text-gray-500">followers</p>
      </div>
    </div>
  );
}
