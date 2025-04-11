import { getDisplayArea } from "@/utils/commonUtils";
import { formatFollowers } from "@/utils/numberUtils";
import Image from "next/image";
import Link from "next/link";

interface KolTableItemProps {
  kol: any;
}

export default function KolTableItem({ kol }: KolTableItemProps) {
  return (
    <div className="p-3 bg-white overflow-hidden flex items-center border-b border-gray-200">
      <div className="flex-[3]">
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

        <p className="mt-1 pr-3 text-sm text-gray-500 line-clamp-2">
          {kol.description || "Empty"}
        </p>
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">
          {getDisplayArea(kol.area)}
        </p>
      </div>

      <div className="flex-1 flex items-center gap-2">
        <div className="text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text rounded">
          {Number(Number(kol.score).toFixed(1))}
        </div>
      </div>

      <div className="flex-1 text-sm font-medium text-gray-900 text-end">
        {formatFollowers(kol.followers)}
      </div>
    </div>
  );
}
