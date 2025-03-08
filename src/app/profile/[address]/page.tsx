'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react';
import { sepolia } from 'wagmi/chains';
import { formatEther } from 'viem';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';

interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
}

const serviceAddress = process.env.NEXT_PUBLIC_SERVICE_ADDRESS || '0x000000000000000000000000000000000000dEaD';
const buzzTokenAddress = process.env.NEXT_PUBLIC_BUZZ_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address: params.address as `0x${string}` });
  const { data: buzzBalance } = useBalance({ 
    address: params.address as `0x${string}`,
    token: buzzTokenAddress as `0x${string}`
  });
  const [transfers, setTransfers] = useState<TokenTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!params.address || typeof params.address !== 'string') return;
    try {
      await navigator.clipboard.writeText(params.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  useEffect(() => {
    const fetchTransfers = async () => {
      if (!params.address) return;

      try {
        const response = await fetch(
          `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}/v2/token/transfers?contractAddress=${buzzTokenAddress}&fromAddress=${params.address}&toAddress=${serviceAddress}&category=erc20`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch transfers');
        }

        const data = await response.json();
        setTransfers(data.transfers || []);
      } catch (error) {
        console.error('Error fetching transfers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfers();
  }, [params.address]);

  if (!params.address || typeof params.address !== 'string') {
    return <div>Invalid address</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Header with BUZZ Balance */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="text-white">
              <h1 className="text-2xl font-semibold">Wallet Profile</h1>
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-sm text-indigo-100">
                  {params.address.slice(0, 6)}...{params.address.slice(-4)}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="inline-flex items-center justify-center p-1 rounded-md hover:bg-white/10 transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-400" />
                  ) : (
                    <DocumentDuplicateIcon className="h-4 w-4 text-indigo-100" />
                  )}
                </button>
              </div>
            </div>
            {address?.toLowerCase() === params.address.toLowerCase() && (
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-xl shadow-sm text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white transition-all duration-200"
              >
                Disconnect Wallet
              </button>
            )}
          </div>
          <div className="mt-6 bg-white/10 rounded-xl p-6">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-white">
                {buzzBalance ? formatEther(buzzBalance.value) : '0.00'}
              </span>
              <span className="ml-2 text-xl text-indigo-100">BUZZ</span>
            </div>
            <p className="mt-1 text-sm text-indigo-100">Token Balance</p>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="px-6 py-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Network Details</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-gray-50 px-4 py-3 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Network</dt>
              <dd className="mt-1 text-sm text-gray-900">{sepolia.name}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">ETH Balance</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {balance ? `${formatEther(balance.value)} ETH` : 'Loading...'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Token Transfers */}
        <div className="px-6 py-6">
          <h2 className="text-lg font-medium text-gray-900">BUZZ Token Transfers</h2>
          <div className="mt-4">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              </div>
            ) : transfers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction Hash
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transfers.map((transfer) => (
                      <tr key={transfer.hash}>
                        <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${transfer.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {transfer.hash.slice(0, 8)}...{transfer.hash.slice(-6)}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatEther(BigInt(transfer.value))} BUZZ
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(parseInt(transfer.timestamp) * 1000).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No token transfers found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 