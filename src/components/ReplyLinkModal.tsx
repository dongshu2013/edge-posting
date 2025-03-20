import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ReplyLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: ({
    replyLink,
    replyText,
  }: {
    replyLink: string;
    replyText: string;
  }) => Promise<void>;
  tokenAmount?: string;
  initialReplyText?: string; // 添加新的 prop
}

export default function ReplyLinkModal({
  isOpen,
  onClose,
  onSubmit,
  tokenAmount,
  initialReplyText = "", // 设置默认值
}: ReplyLinkModalProps) {
  const [replyLink, setReplyLink] = useState("");
  const [replyText, setReplyText] = useState(initialReplyText); // 使用初始值

  // 当 initialReplyText 改变时更新 replyText
  useEffect(() => {
    setReplyText(initialReplyText);
  }, [initialReplyText]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyLink.trim()) {
      setError("Please enter a reply link");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ replyLink, replyText });
      setReplyLink("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit reply");
    } finally {
      setIsSubmitting(false);
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
                      Submit Your Reply
                    </Dialog.Title>

                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        After posting your reply on Twitter, copy the link to
                        your reply and paste it here
                        {tokenAmount ? ` to earn max ${tokenAmount} BNB` : ""}.
                      </p>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label
                            htmlFor="replyLink"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Reply Link
                          </label>
                          <input
                            type="url"
                            name="replyLink"
                            id="replyLink"
                            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="https://twitter.com/..."
                            value={replyLink}
                            onChange={(e) => setReplyLink(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="replyLink"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Reply Text
                          </label>
                          <input
                            type="text"
                            name="replyText"
                            id="replyText"
                            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Hey, check out this reply!"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            required
                          />
                        </div>

                        {error && (
                          <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        )}

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? "Submitting..." : "Submit Reply"}
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                            onClick={onClose}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
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
