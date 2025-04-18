import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { paymentServiceApplicationId, paymentServiceUrl } from "@/config";
import { useAuth } from "@/hooks/useAuth";
import { sleep } from "openai/core.mjs";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const ongoingOrderQuery = useQuery({
    queryKey: ["payment-user-ongoing-order", user?.uid],
    staleTime: Infinity, // Prevent automatic refetching
    refetchOnWindowFocus: false, // Prevent refetching when window regains focus
    enabled: !!user?.uid && !!paymentServiceUrl,
    queryFn: async () => {
      if (!user?.uid || !paymentServiceUrl) {
        return null;
      }

      try {
        const resJson = await fetch(
          `${paymentServiceUrl}/user-ongoing-order?payerId=${user.uid}&applicationId=${paymentServiceApplicationId}`
        ).then((res) => res.json());

        return resJson?.data?.order;
      } catch (error) {
        console.error("Error fetching ongoing order:", error);
        return null;
      }
    },
  });

  useEffect(() => {
    ongoingOrderQuery.refetch();
  }, [isOpen]);

  const createOrder = async () => {
    if (!amount) {
      setError("Please enter an amount");
      return;
    }

    setIsSubmitting(true);
    const resJson = await fetch(`${paymentServiceUrl}/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chainId: 84532,
        amount: amount,
        payerId: user?.uid,
        applicationId: paymentServiceApplicationId,
      }),
    }).then((res) => res.json());

    ongoingOrderQuery.refetch();
    setError(null);
    setIsSubmitting(false);
  };

  const checkOrder = async (orderId: string) => {
    setIsChecking(true);
    let retryTimes = 5;
    while (true) {
      const resJson = await fetch(
        `${paymentServiceUrl}/order-detail?orderId=${orderId}`
      ).then((res) => res.json());

      console.log(resJson);

      if (resJson?.data?.order?.status === 1) {
        setError(null);
        onSuccess();
        break;
      } else if (retryTimes <= 0) {
        setError("Order is not paid");
        break;
      }

      retryTimes--;
      await sleep(6000);
    }
    setIsChecking(false);
  };

  const cancelOrder = async (orderId: string) => {
    try {
      setIsCancelling(true);
      const resJson = await fetch(`${paymentServiceUrl}/cancel-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
        }),
      }).then((res) => res.json());

      console.log(resJson);
      if (resJson.status === 0) {
        onClose();
      } else {
        setError(resJson.message || "Failed to cancel order");
      }
    } catch (err) {
      setError("Failed to cancel order");
    } finally {
      setIsCancelling(false);
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
                      Complete Payment
                    </Dialog.Title>

                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        Enter the amount of BUZZ you would like to pay.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="amount"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Amount (BUZZ)
                          </label>
                          <div className="mt-1 relative rounded-xl shadow-sm">
                            <input
                              type="number"
                              name="amount"
                              id="amount"
                              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="0.00"
                              value={amount}
                              onChange={(e) =>
                                setAmount(Number(e.target.value))
                              }
                              min="0.01"
                              step="0.01"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-r-xl">
                              <span className="text-sm font-medium">BUZZ</span>
                            </div>
                          </div>
                        </div>

                        {error && (
                          <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        )}

                        {ongoingOrderQuery.data ? (
                          <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-700">
                              You have an ongoing order. Please complete it
                              before paying again.
                            </p>

                            <div className="mt-5 sm:mt-2">
                              <span className="font-bold opacity-60">
                                ChainId:
                              </span>
                              <br />
                              {ongoingOrderQuery.data.chain_id}
                            </div>

                            <div className="mt-3 sm:mt-2">
                              <span className="font-bold opacity-60">
                                Token Address:
                              </span>
                              <br />
                              {ongoingOrderQuery.data.token_address}
                            </div>

                            <div className="mt-3 sm:mt-2">
                              <span className="font-bold opacity-60">
                                Transfer To:
                              </span>
                              <br />
                              {ongoingOrderQuery.data.transfer_address}
                            </div>

                            <div className="mt-3 sm:mt-2">
                              <span className="font-bold opacity-60">
                                Transfer Amount:
                              </span>
                              <br />
                              {Number(
                                ongoingOrderQuery.data.transfer_amount_on_chain
                              ) / Math.pow(10, 6)}
                            </div>

                            <div className="mt-5 sm:mt-4">
                              <button
                                disabled={
                                  isSubmitting || isCancelling || isChecking
                                }
                                className="mt-3 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => {
                                  checkOrder(ongoingOrderQuery.data.id);
                                }}
                              >
                                {isChecking ? "Checking..." : "I have paid"}
                              </button>

                              <button
                                type="button"
                                className="mt-3 ml-3 inline-flex justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
                                onClick={() => {
                                  cancelOrder(ongoingOrderQuery.data.id);
                                }}
                                disabled={isCancelling || isSubmitting}
                              >
                                {isCancelling
                                  ? "Cancelling..."
                                  : "Cancel Order"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              disabled={isSubmitting || !amount}
                              className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => {
                                createOrder();
                              }}
                            >
                              {isSubmitting ? "Processing..." : "Pay Now"}
                            </button>

                            <button
                              type="button"
                              className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                              onClick={onClose}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
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
};
