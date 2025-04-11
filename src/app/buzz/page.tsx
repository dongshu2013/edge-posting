"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import BuzzCard from "@/components/BuzzCard";
import {
  SparklesIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  UserIcon,
  HashtagIcon,
} from "@heroicons/react/24/outline";
import { fetchApi } from "@/lib/api";
import ActiveBuzzesToggle from "@/components/ActiveBuzzesToggle";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import FilterTokenBuzzesToggle from "@/components/FilterTokenBuzzesToggle";
import { useUserStore } from "@/store/userStore";
import CreatorFilterToggle from "@/components/CreatorFilterToggle";
import TokenAddressFilterToggle from "@/components/TokenAddressFilterToggle";
import classNames from "classnames";
import { toast } from "react-hot-toast";

interface Buzz {
  id: string;
  tweetLink: string;
  instructions: string;
  tokenAmount: string;
  paymentToken: string;
  customTokenAddress: string;
  rewardSettleType?: string;
  maxParticipants?: number;
  replyCount: number;
  createdBy: string;
  deadline: string;
  createdAt: Date;
  isActive: boolean;
  user: {
    username: string;
    avatar: string;
    twitterUsername: string;
    nickname: string;
    kolInfo?: {
      status: string;
    };
  };
  _count: {
    replies: number;
  };
}

interface BuzzResponse {
  items: Buzz[];
  nextCursor?: string;
  hasMore: boolean;
}

interface SearchItem {
  type: "tokenAddress" | "tokenName" | "creatorTwitterUsername";
  value: string;
}

function SearchTag({
  item,
  onDelete,
  searchType,
}: {
  item: SearchItem;
  onDelete: () => void;
  searchType: "tokenAddress" | "tokenName" | "creatorTwitterUsername";
}) {
  const getIcon = () => {
    switch (searchType) {
      case "tokenAddress":
        return <CurrencyDollarIcon className="w-4 h-4" />;
      case "tokenName":
        return <HashtagIcon className="w-4 h-4" />;
      case "creatorTwitterUsername":
        return <UserIcon className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={classNames(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm",
        searchType === "tokenAddress" && "bg-green-100 text-green-700",
        searchType === "tokenName" && "bg-purple-100 text-purple-700",
        searchType === "creatorTwitterUsername" && "bg-blue-100 text-blue-700"
      )}
    >
      {getIcon()}
      <span>{item.value}</span>
      <button
        onClick={onDelete}
        className="text-indigo-500 hover:text-indigo-700"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function BuzzesPage() {
  return (
    <Suspense fallback={<div className="py-8">Loading buzzes...</div>}>
      <BuzzesPageContent />
    </Suspense>
  );
}

function BuzzesPageContent() {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const searchParams = useSearchParams();
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<
    "tokenAddress" | "tokenName" | "creatorTwitterUsername"
  >("tokenAddress");
  const observer = useRef<IntersectionObserver | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // console.log("🍷", userInfo);

  const showAll = searchParams.get("showAll") === "true";
  const filterToken = searchParams.get("filterToken") === "true";

  const creatorTwitterUsernames =
    searchParams.get("creatorTwitterUsernames")?.split(",") || [];
  const tokenAddresses = searchParams.get("tokenAddresses")?.split(",") || [];
  const tokenNames = searchParams.get("tokenNames")?.split(",") || [];

  const sortBy = useMemo(() => {
    const sortByParam = searchParams.get("sortBy");
    switch (sortByParam) {
      case "newest":
        return "newest";
      case "deadline":
        return "deadline";
      case "engagement":
        return "engagement";
      default:
        return "newest";
    }
  }, [searchParams]);

  const creatorTwitterUsernamesParam = creatorTwitterUsernames.join(",");
  const tokenAddressesParam = tokenAddresses.join(",");
  const tokenNamesParam = tokenNames.join(",");

  const searchItems: SearchItem[] = useMemo(() => {
    return [
      ...tokenAddressesParam.split(",").map((address) => ({
        type: "tokenAddress",
        value: address,
      })),
      ...tokenNamesParam.split(",").map((name) => ({
        type: "tokenName",
        value: name,
      })),
      ...creatorTwitterUsernamesParam.split(",").map((username) => ({
        type: "creatorTwitterUsername",
        value: username,
      })),
    ].filter((item) => !!item.value) as SearchItem[];
  }, [tokenNamesParam, creatorTwitterUsernamesParam, tokenAddressesParam]);

  const fetchBuzzes = useCallback(
    async (cursor?: string): Promise<BuzzResponse> => {
      try {
        const url = new URL("/api/buzz", window.location.origin);
        if (cursor) {
          url.searchParams.append("cursor", cursor);
        }
        if (sortBy) {
          url.searchParams.append("sortBy", sortBy);
        }
        if (!showAll) {
          url.searchParams.append("onlyActive", "true");
        }
        if (filterToken) {
          url.searchParams.append("filterToken", "true");
        }
        if (creatorTwitterUsernames.length > 0) {
          url.searchParams.append(
            "creatorTwitterUsernames",
            creatorTwitterUsernames.join(",")
          );
        }
        if (tokenAddresses.length > 0) {
          url.searchParams.append("tokenAddresses", tokenAddressesParam);
        }
        if (tokenNames.length > 0) {
          url.searchParams.append("tokenNames", tokenNamesParam);
        }
        // Only show buzzes that the user hasn't replied to
        url.searchParams.append("excludeReplied", "true");

        return await fetchApi(url.toString());
      } catch (err) {
        throw err;
      }
    },
    [
      showAll,
      sortBy,
      filterToken,
      creatorTwitterUsernamesParam,
      tokenAddressesParam,
      tokenNamesParam,
    ]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchBuzzes(nextCursor);
      console.log("🍷", data);
      setBuzzes((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch more buzzes"
      );
      console.error("Error fetching more buzzes:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, nextCursor, fetchBuzzes]);

  const lastBuzzElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      if (node) {
        observer.current = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        });
        observer.current.observe(node);
      }
    },
    [isLoadingMore, hasMore, loadMore]
  );

  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      try {
        const data = await fetchBuzzes();
        setBuzzes(data.items);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch buzzes");
        console.error("Error fetching buzzes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initialFetch();
  }, [fetchBuzzes]);

  // Clean up observer on component unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  const sortedBuzzes = [...buzzes];

  const handleConfirmSearch = () => {
    let searchText = searchQuery.trim();
    setSearchQuery("");
    if (searchType === "tokenAddress") {
      if (!searchText.startsWith("0x")) {
        toast.error("Invalid token address");
        return;
      }
      const currentTokenAddresses = searchParams.get("tokenAddresses");
      const newTokenAddresses = currentTokenAddresses?.split(",") || [];
      if (newTokenAddresses.includes(searchText)) {
        return;
      }
      newTokenAddresses.push(searchText);
      const url = new URL(window.location.href);
      url.searchParams.set("tokenAddresses", newTokenAddresses.join(","));
      router.push(url.toString());
    } else if (searchType === "tokenName") {
      const currentTokenNames = searchParams.get("tokenNames");
      const newTokenNames = currentTokenNames?.split(",") || [];
      if (newTokenNames.includes(searchText)) {
        return;
      }
      newTokenNames.push(searchText);
      const url = new URL(window.location.href);
      url.searchParams.set("tokenNames", newTokenNames.join(","));
      router.push(url.toString());
    } else if (searchType === "creatorTwitterUsername") {
      if (searchText.startsWith("@")) {
        searchText = searchText.slice(1);
      }
      const currentCreatorTwitterUsernames = searchParams.get(
        "creatorTwitterUsernames"
      );
      const newCreatorTwitterUsernames =
        currentCreatorTwitterUsernames?.split(",") || [];
      if (newCreatorTwitterUsernames.includes(searchText)) {
        return;
      }
      newCreatorTwitterUsernames.push(searchText);
      const url = new URL(window.location.href);
      url.searchParams.set(
        "creatorTwitterUsernames",
        newCreatorTwitterUsernames.join(",")
      );
      router.push(url.toString());
    }
  };

  const handleDeleteSearchItem = (item: SearchItem) => {
    const url = new URL(window.location.href);
    if (item.type === "tokenAddress") {
      const currentAddresses =
        searchParams.get("tokenAddresses")?.split(",") || [];
      const newAddresses = currentAddresses.filter(
        (addr) => addr !== item.value
      );
      if (newAddresses.length > 0) {
        url.searchParams.set("tokenAddresses", newAddresses.join(","));
      } else {
        url.searchParams.delete("tokenAddresses");
      }
    } else if (item.type === "tokenName") {
      const currentNames = searchParams.get("tokenNames")?.split(",") || [];
      const newNames = currentNames.filter((name) => name !== item.value);
      if (newNames.length > 0) {
        url.searchParams.set("tokenNames", newNames.join(","));
      } else {
        url.searchParams.delete("tokenNames");
      }
    } else if (item.type === "creatorTwitterUsername") {
      const currentUsernames =
        searchParams.get("creatorTwitterUsernames")?.split(",") || [];
      const newUsernames = currentUsernames.filter(
        (username) => username !== item.value
      );
      if (newUsernames.length > 0) {
        url.searchParams.set("creatorTwitterUsernames", newUsernames.join(","));
      } else {
        url.searchParams.delete("creatorTwitterUsernames");
      }
    }
    router.push(url.toString());
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex-1">
        <div className="flex flex-col items-start sm:flex-row mb-3 gap-3">
          <div className="flex-1 self-stretch">
            <div className="">
              <div className="relative">
                <div className="flex">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={`Search by ${
                        searchType === "tokenAddress"
                          ? "token address"
                          : searchType === "tokenName"
                          ? "token name"
                          : "creator Twitter username"
                      }...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 text-base border-gray-300 rounded-l-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleConfirmSearch();
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        handleConfirmSearch();
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                  </div>

                  <select
                    value={searchType}
                    onChange={(e) => {
                      const newSearchType = e.target.value as
                        | "tokenAddress"
                        | "tokenName"
                        | "creatorTwitterUsername";
                      setSearchType(newSearchType);
                    }}
                    className="w-[150px] md:w-[180px] px-2 sm:px-4 py-3 text-sm sm:text-base border-l-0 border-gray-300 rounded-r-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
                  >
                    <option value="tokenAddress">Token Address</option>
                    <option value="tokenName">Token Name</option>
                    <option value="creatorTwitterUsername">
                      Creator Twitter
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {searchItems.map((item) => (
                <SearchTag
                  key={`${item.type}-${item.value}`}
                  searchType={item.type}
                  item={item}
                  onDelete={() => handleDeleteSearchItem(item)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActiveBuzzesToggle
              className="w-auto sm:w-auto"
              isActive={!showAll}
              onToggle={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("showAll", (!showAll).toString());
                router.push(url.toString());
              }}
            />

            <div className="flex-1 md:w-[150px]">
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("sortBy", e.target.value);
                  router.push(url.toString());
                }}
                className="w-full text-base sm:text-lg border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 py-[10px] pl-4 pr-8"
              >
                <option value="newest">Created At</option>
                <option value="deadline">Deadline</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid layout for BuzzCards */}
        {sortedBuzzes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedBuzzes.map((buzz, index) => (
                <div
                  key={buzz.id}
                  ref={
                    index === sortedBuzzes.length - 1
                      ? lastBuzzElementRef
                      : undefined
                  }
                >
                  <BuzzCard
                    id={buzz.id}
                    tweetLink={buzz.tweetLink}
                    instructions={buzz.instructions}
                    replyCount={buzz?._count?.replies || 0}
                    createdBy={buzz.createdBy}
                    deadline={buzz.deadline}
                    createdAt={buzz.createdAt}
                    isActive={buzz.isActive}
                    username={buzz?.user?.username}
                    nickname={buzz?.user?.nickname || ""}
                    kolStatus={buzz?.user?.kolInfo?.status}
                    avatar={buzz?.user?.avatar}
                    twitterUsername={buzz?.user?.twitterUsername}
                    tokenAmount={buzz.tokenAmount}
                    paymentToken={buzz.paymentToken}
                    customTokenAddress={buzz.customTokenAddress}
                    rewardSettleType={buzz.rewardSettleType}
                    maxParticipants={buzz.maxParticipants}
                  />
                </div>
              ))}
            </div>

            {isLoadingMore && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl h-64 animate-pulse"
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No buzzes found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later for new buzzes!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
