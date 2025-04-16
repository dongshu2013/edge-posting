import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { ChevronDown, ChevronUp } from "lucide-react";

interface KolTableHeaderProps {
  sortField: string;
  sortDirection: string;
  onSort: (field: string) => void;
}

export default function KolTableHeader({
  sortField,
  sortDirection,
  onSort,
}: KolTableHeaderProps) {
  const renderSortIcons = (field: string) => {
    const isActive = sortField === field;
    return (
      <div className="flex flex-col">
        <ChevronUp
          className={`h-3 w-3 ${
            isActive && sortDirection === "asc"
              ? "text-blue-600"
              : "text-gray-400"
          }`}
        />
        <ChevronDown
          className={`h-3 w-3 ${
            isActive && sortDirection === "desc"
              ? "text-blue-600"
              : "text-gray-400"
          }`}
        />
      </div>
    );
  };

  return (
    <div className="hidden md:flex justify-center px-3 py-3 bg-white border border-gray-200">
      <div className="flex-[3]">Info</div>
      <div className="flex-1">Area</div>
      <div
        className="flex-1 flex items-center gap-1 cursor-pointer hover:text-blue-600"
        onClick={() => onSort("score")}
      >
        Score
        {renderSortIcons("score")}
      </div>
      <div
        className="flex-1 text-end flex items-center justify-end gap-1 cursor-pointer hover:text-blue-600"
        onClick={() => onSort("followers")}
      >
        Followers
        {renderSortIcons("followers")}
      </div>
    </div>
  );
} 