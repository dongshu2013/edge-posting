import { getDisplayArea } from "@/utils/commonUtils";
import { formatFollowers } from "@/utils/numberUtils";
import Image from "next/image";
import Link from "next/link";

interface KolCardProps {
  kol: any;
}

export default function KolCard({ kol }: KolCardProps) {
  return (
    <div className="p-4 bg-white shadow rounded-lg overflow-hidden">
      <div className="flex items-center">
        <div className="h-12 w-12 rounded-full overflow-hidden">
          <Image
            src={kol.avatar}
            alt={"kol"}
            width={48}
            height={48}
            className="object-cover"
          />
        </div>

        <div className="flex flex-col ml-2 gap-0">
          <p className="text-sm font-medium text-gray-900">{kol.nickname}</p>

          <Link href={`https://x.com/${kol.twitterUsername}`} target="_blank">
            <p className="text-sm text-blue-600 underline">@{kol.twitterUsername}</p>
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {kol.score && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500 w-[100px]">Influence Score:</p>

            <div className="text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text rounded">
              {Number(Number(kol.score).toFixed(1))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 w-[100px]">Area:</p>

          <p className="text-sm font-medium text-gray-900">
            {getDisplayArea(kol.area)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 w-[100px]">followers:</p>

          <p className="text-sm font-medium text-gray-900">
            {formatFollowers(kol.followers)}
          </p>
        </div>

        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {kol.description || "Empty"}
        </p>
      </div>
    </div>
  );
}
