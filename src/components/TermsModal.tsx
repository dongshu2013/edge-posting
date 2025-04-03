"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

interface TermsModalProps {
  trigger: React.ReactNode;
}

export const TermsModal = ({ trigger }: TermsModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  return (
    <>
      <div onClick={openModal}>{trigger}</div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    User Terms and Conditions
                  </Dialog.Title>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      The information provided on this platform is for reference
                      purposes only and does not constitute investment advice,
                      endorsement, analysis, or recommendation for any financial
                      instrument, investment project, or issuer.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-500">
                      <li>
                        • Investing in cryptocurrencies and DeFi projects
                        carries high risks, including the potential for total
                        loss.
                      </li>
                      <li>
                        • This platform does not consider individual investment
                        goals, financial circumstances, or specific needs.{" "}
                      </li>
                      <li>
                        • Please consult professional legal and financial
                        advisors before making any investment decisions.
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Got it, thanks!
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
