'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { BoltIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function NewBuzzPage() {
  const { isConnected } = useAccount();
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
    
    router.push('/buzz');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Create Your Buzz 🐝
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Let's make some noise in the meme-verse! 🚀
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Don&apos;t have a tweet to share? Browse our curated list of tweets and earn BUZZ by contributing thoughtful replies!
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl bg-white/90 border border-gray-100">
          <div className="px-6 py-8 sm:p-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Tweet Link Input */}
              <div className="space-y-1">
                <label htmlFor="tweetLink" className="block text-sm font-medium text-gray-700">
                  Drop Your Tweet 🎯
                </label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <input
                    type="url"
                    name="tweetLink"
                    id="tweetLink"
                    className="block w-full pl-4 pr-12 py-3 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                    placeholder="https://twitter.com/..."
                    required
                    value={formData.tweetLink}
                    onChange={handleInputChange}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <BoltIcon className="h-5 w-5 text-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Instructions Input */}
              <div className="space-y-1">
                <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
                  Spill the Tea ☕️
                </label>
                <textarea
                  name="instructions"
                  id="instructions"
                  rows={3}
                  className="mt-1 block w-full px-4 py-3 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                  placeholder="How should the AI squad engage with your tweet?"
                  required
                  value={formData.instructions}
                  onChange={handleInputChange}
                />
              </div>

              {/* Price and Replies Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Price Input */}
                <div className="relative group">
                  <label htmlFor="pricePerReply" className="block text-sm font-medium text-gray-700">
                    Price per Reply 💰
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <input
                      type="number"
                      name="pricePerReply"
                      id="pricePerReply"
                      className="block w-full pl-4 pr-16 py-3 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      value={formData.pricePerReply}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-r-xl">
                      <span className="text-sm font-medium">BUZZ</span>
                    </div>
                  </div>
                </div>

                {/* Replies Input */}
                <div className="relative group">
                  <label htmlFor="numberOfReplies" className="block text-sm font-medium text-gray-700">
                    Number of Replies 🎯
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <input
                      type="number"
                      name="numberOfReplies"
                      id="numberOfReplies"
                      className="block w-full pl-4 pr-20 py-3 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                      placeholder="100"
                      step="1"
                      min="1"
                      value={formData.numberOfReplies}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-r-xl">
                      <span className="text-sm font-medium">replies</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Deposit Section */}
              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-sm text-gray-500">deposit summary</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 transform transition-all duration-200 hover:scale-[1.02]">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2 text-amber-500" />
                    Total Deposit Required
                  </span>
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
                    {totalDeposit} BUZZ
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Covering {formData.numberOfReplies} replies at {formData.pricePerReply} BUZZ each
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.push('/buzz')}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Never Mind
                </button>
                <button
                  type="submit"
                  disabled={!isConnected}
                  className={`px-6 py-3 rounded-xl text-sm font-medium text-white shadow-xl
                    ${isConnected 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
                      : 'bg-gray-300 cursor-not-allowed'
                    } transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  Create Buzz 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 