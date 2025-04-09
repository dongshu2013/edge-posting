import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

interface CreatorFilterToggleProps {
  onFilter: (username: string) => void;
  className?: string;
}

export default function CreatorFilterToggle({
  onFilter,
  className = "",
}: CreatorFilterToggleProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(username);
  };

  const handleClear = () => {
    setUsername("");
    onFilter("");
  };

  const searchParams = useSearchParams();
  const creatorTwitterUsernames = searchParams.get("creatorTwitterUsernames");

  useEffect(() => {
    if (creatorTwitterUsernames) {
      setUsername(creatorTwitterUsernames);
    }
  }, [creatorTwitterUsernames]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`inline-flex flex-col md:flex-row items-start md:items-center gap-3 bg-white rounded-2xl px-3 py-3 shadow-sm border border-gray-200 w-full sm:w-auto ${className}`}
    >
      <div className="relative self-stretch sm:self-auto">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Creator twitter usernames (comma separated)"
          className="h-[40px] text-base sm:text-lg text-gray-700 font-medium rounded-md focus:ring-0 px-2 w-full sm:w-[420px] border border-gray-200"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="h-[40px] inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Filter
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="h-[40px] inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-xl text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
