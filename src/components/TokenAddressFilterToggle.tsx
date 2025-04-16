import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { zeroAddress } from "viem";

interface TokenAddressFilterToggleProps {
  onFilter: (addresses: string[]) => void;
  className?: string;
}

export default function TokenAddressFilterToggle({
  onFilter,
  className = "",
}: TokenAddressFilterToggleProps) {
  const [addresses, setAddresses] = useState("");
  const { userInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const tokenAddresses = searchParams.get("tokenAddresses");

  useEffect(() => {
    if (tokenAddresses) {
      setAddresses(tokenAddresses);
    }
  }, [tokenAddresses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addressList = addresses
      .split(",")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);
    onFilter(addressList);
  };

  const handleClear = () => {
    setAddresses("");
    onFilter([]);
  };

  const handleFilterByMyTokens = async () => {
    if (userInfo?.uid) {
      setIsLoading(true);
      const res = await fetchApi(`/api/user/${userInfo?.uid}/holding-tokens`, {
        auth: true,
      });
      const holdingTokens = res?.tokenAddresses || [];

      if (!holdingTokens.includes(zeroAddress)) {
        holdingTokens.push(zeroAddress);
      }

      onFilter(holdingTokens);
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`inline-flex flex-col md:flex-row items-start md:items-center gap-3 bg-white rounded-2xl px-3 py-3 shadow-sm border border-gray-200 w-full sm:w-auto ${className}`}
    >
      <div className="relative self-stretch sm:self-auto">
        <input
          type="text"
          value={addresses}
          onChange={(e) => setAddresses(e.target.value)}
          placeholder="Token addresses (comma separated)"
          className="h-[40px] text-base sm:text-lg text-gray-700 font-medium rounded-md px-2 focus:ring-0 p-0 w-80 sm:w-[620px] border border-gray-200"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="h-[40px] inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Filter
        </button>
        {!!userInfo?.uid && (
          <button
            onClick={handleFilterByMyTokens}
            className="h-[40px] inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            {isLoading ? "Loading tokens..." : "Filter by my tokens"}
          </button>
        )}
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
