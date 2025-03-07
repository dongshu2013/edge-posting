'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

export default function NewBuzzPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [formData, setFormData] = useState({
    tweetLink: '',
    instructions: '',
    pricePerReply: 0.01,
    numberOfReplies: 100
  });

  const totalDeposit = useMemo(() => {
    return (formData.pricePerReply * formData.numberOfReplies).toFixed(2);
  }, [formData.pricePerReply, formData.numberOfReplies]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'pricePerReply' || name === 'numberOfReplies' ? parseFloat(value) : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    // In a real app, we would send this data to a backend and handle the deposit
    // For now, we'll just simulate success and redirect back to the main page
    router.push('/buzz');
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Create a New Buzz</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Add your tweet and let AI help engage with your content.</p>
          </div>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="tweetLink" className="block text-sm font-medium text-gray-700">
                Tweet Link
              </label>
              <input
                type="url"
                name="tweetLink"
                id="tweetLink"
                className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                placeholder="https://twitter.com/username/status/123456789"
                required
                value={formData.tweetLink}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
                Reply Instructions
              </label>
              <textarea
                name="instructions"
                id="instructions"
                rows={3}
                className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                placeholder="How should AI engage with your tweet?"
                required
                value={formData.instructions}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pricePerReply" className="block text-sm font-medium text-gray-700">
                  Price per Reply
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="pricePerReply"
                    id="pricePerReply"
                    className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    value={formData.pricePerReply}
                    onChange={handleInputChange}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">BUZZ</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="numberOfReplies" className="block text-sm font-medium text-gray-700">
                  Number of Replies
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="numberOfReplies"
                    id="numberOfReplies"
                    className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="100"
                    step="1"
                    min="1"
                    value={formData.numberOfReplies}
                    onChange={handleInputChange}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">replies</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Deposit Required:</span>
                <span className="text-lg font-semibold text-amber-600">{totalDeposit} BUZZ</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This amount will be deposited to cover {formData.numberOfReplies} replies at {formData.pricePerReply} BUZZ each
              </p>
            </div>
            
            <div className="flex justify-end pt-5">
              <button
                type="button"
                onClick={() => router.push('/buzz')}
                className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isConnected}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  isConnected 
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Create Buzz
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 