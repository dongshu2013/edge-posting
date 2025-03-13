import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { fetchApi } from "@/lib/api";

interface ReferralCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReferralCodeModal({
  isOpen,
  onClose,
}: ReferralCodeModalProps) {
  const [referralCode, setReferralCode] = useState("");
  const [isSkipping, setIsSkipping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSkipReferral = async () => {
    onClose();

    const res = await fetchApi("/api/referral/create", {
      auth: true,
      method: "POST",
      body: JSON.stringify({ referralCode: null }),
    });
  };

  const handleSubmitReferralCode = async () => {
    setIsSubmitting(true);
    const res = await fetchApi("/api/referral/create", {
      auth: true,
      method: "POST",
      body: JSON.stringify({ referralCode }),
    });

    if (res.success) {
      toast.success("Referral code applied successfully");
      onClose();
    } else {
      toast.error(res.error);
    }
    setIsSubmitting(false);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleSkipReferral}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Enter Referral Code
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Enter a referral code to receive special benefits.
                      </p>
                      <div className="mt-4">
                        <label
                          htmlFor="referralCode"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Referral Code
                        </label>
                        <input
                          type="text"
                          name="referralCode"
                          id="referralCode"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Enter code..."
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={!referralCode || isSubmitting || isSkipping}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:bg-indigo-300"
                    onClick={handleSubmitReferralCode}
                  >
                    {isSubmitting ? "Binding..." : "Bind Referral"}
                  </button>
                  <button
                    disabled={isSkipping || isSubmitting}
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={handleSkipReferral}
                  >
                    {isSkipping ? "Skipping..." : "Skip"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
