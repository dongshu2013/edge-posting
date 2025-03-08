import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (address) {
      console.log('Navigating to profile:', `/profile/${address}`);
      router.push(`/profile/${address}`);
    }
  };

  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        if (!ready) {
          return null;
        }

        if (!isConnected) {
          return (
            <button
              onClick={openConnectModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
            >
              Connect Wallet
            </button>
          );
        }

        return (
          <button
            onClick={handleProfileClick}
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-all duration-200"
          >
            <span className="text-gray-900">
              {account?.displayName}
            </span>
            <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-500" />
          </button>
        );
      }}
    </RainbowConnectButton.Custom>
  );
} 