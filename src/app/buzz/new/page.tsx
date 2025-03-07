'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

export default function NewBuzzPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [formData, setFormData] = useState({
    tweetLink: '',
    description: '',
    instructions: '',
    credit: 0.01
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'credit' ? parseFloat(value) : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    // In a real app, we would send this data to a backend
    // For now, we'll just simulate success and redirect back to the main page
    
    // Redirect to the main page
    router.push('/');
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Create a New Buzz</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Create a buzz for others to engage with your tweet. Add credits to incentivize participation.
            </p>
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
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <input
                type="text"
                name="description"
                id="description"
                className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                placeholder="Brief description of your buzz"
                value={formData.description}
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
                placeholder="What kind of replies would you like?"
                required
                value={formData.instructions}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="credit" className="block text-sm font-medium text-gray-700">
                Credit Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="credit"
                  id="credit"
                  className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={formData.credit}
                  onChange={handleInputChange}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">CREDIT</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-5">
              <button
                type="button"
                onClick={() => router.push('/')}
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