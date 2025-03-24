import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface TransactionLoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'pending' | 'success' | 'error';
  title?: string;
  description?: string;
  errorMessage?: string;
  transactionHash?: string;
}

export default function TransactionLoadingModal({
  isOpen,
  onClose,
  status = 'pending',
  title = 'Processing Transaction',
  description = 'Please wait while your transaction is being processed.',
  errorMessage = 'Transaction failed. Please try again.',
  transactionHash,
}: TransactionLoadingModalProps) {
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={status !== 'pending' ? onClose : () => {}}>
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
                <div className="text-center sm:mt-0 w-full">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900"
                  >
                    {status === 'success' ? 'Transaction Successful' : 
                     status === 'error' ? 'Transaction Failed' : title}
                  </Dialog.Title>

                  <div className="mt-6 mb-6 flex justify-center">
                    {status === 'pending' && (
                      <ArrowPathIcon 
                        className="h-16 w-16 text-indigo-500 animate-spin" 
                        aria-hidden="true" 
                      />
                    )}
                    {status === 'success' && (
                      <CheckCircleIcon 
                        className="h-16 w-16 text-green-500" 
                        aria-hidden="true" 
                      />
                    )}
                    {status === 'error' && (
                      <ExclamationTriangleIcon 
                        className="h-16 w-16 text-red-500" 
                        aria-hidden="true" 
                      />
                    )}
                  </div>

                  <div className="mt-4 mb-6">
                    <p className="text-sm text-gray-500">
                      {status === 'pending' && description}
                      {status === 'success' && 'Your transaction has been successfully processed.'}
                      {status === 'error' && errorMessage}
                    </p>
                    
                    {transactionHash && (
                      <div className="mt-4 bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                        <p className="text-sm font-mono break-all text-gray-700">
                          {transactionHash}
                        </p>
                      </div>
                    )}
                  </div>

                  {status !== 'pending' && (
                    <div className="mt-5 sm:mt-6">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500"
                        onClick={onClose}
                      >
                        {status === 'success' ? 'Continue' : 'Close'}
                      </button>
                    </div>
                  )}

                  {status === 'pending' && (
                    <div className="mt-4">
                      <div className="flex justify-center">
                        <div className="rounded-full h-2 w-2 bg-indigo-600 animate-ping mr-1"></div>
                        <div className="rounded-full h-2 w-2 bg-indigo-600 animate-ping mr-1" style={{ animationDelay: '0.2s' }}></div>
                        <div className="rounded-full h-2 w-2 bg-indigo-600 animate-ping" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Please do not close this window</p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 