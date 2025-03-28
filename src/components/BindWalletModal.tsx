import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAccount, useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useUserStore } from "@/store/userStore";
import { getSiweMessage } from "@/utils/evmUtils";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";

interface BindWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onBind: (walletAddress: string) => Promise<void>;
}

export default function BindWalletModal({
  isOpen,
  onClose,
  onBind,
  onSuccess,
}: BindWalletModalProps) {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { userInfo, updateUserInfo } = useUserStore();
  const [isBindingWallet, setIsBindingWallet] = useState(false);
  const { signMessageAsync } = useSignMessage();

  const handleConnectWallet = async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    try {
      setIsBindingWallet(true);
      const siweMessage = getSiweMessage(
        address,
        Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
      );
      const siweSignature =
        (await signMessageAsync({
          message: siweMessage,
        }).catch((err: any) => {
          console.log({ err });
        })) || null;

      if (!siweSignature) {
        throw new Error("Failed to sign message");
      }

      const resJson = await fetchApi(
        "/api/user/" + userInfo?.uid + "/bind-wallet",
        {
          method: "POST",
          body: JSON.stringify({
            siweMessage,
            siweSignature,
          }),
        }
      );

      if (resJson.error) {
        throw new Error(resJson.error);
      }

      updateUserInfo();
      toast.success("Wallet bound successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsBindingWallet(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      Bind Your Wallet
                    </Dialog.Title>

                    <div className="mt-4">
                      <div className="rounded-md bg-yellow-50 p-4 mb-4">
                        <div className="flex">
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Wallet Not Connected
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                To continue, you need to bind your wallet
                                address. This is required to receive rewards and
                                participate in our platform.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-6 mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Benefits of connecting your wallet:
                        </h4>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          <li>
                            Withdraw token rewards directly to your wallet
                          </li>
                          <li>Participate in exclusive campaigns</li>
                          <li>Track your earnings in real-time</li>
                          <li>Secure ownership of your digital assets</li>
                        </ul>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          id="connectWallet"
                          type="button"
                          disabled={isBindingWallet}
                          onClick={handleConnectWallet}
                          className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 sm:ml-3 sm:w-auto"
                        >
                          {!address
                            ? "Connect Wallet First"
                            : isBindingWallet
                            ? "Binding..."
                            : "Bind Wallet"}
                        </button>

                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
