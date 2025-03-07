'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { format } from 'date-fns';
import { 
  ComputerDesktopIcon, 
  PlayIcon, 
  StopIcon, 
  CheckCircleIcon,
  CurrencyDollarIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface PostRequest {
  id: string;
  tweetLink: string;
  description: string;
  instructions: string;
  credit: number;
  createdAt: Date;
  createdBy: string;
  engagementCount: number;
}

interface PostedTweet {
  id: string;
  requestId: string;
  tweetLink: string;
  replyLink: string;
  content: string;
  postedAt: Date;
  credit: number;
}

interface ModelEngine {
  id: string;
  name: string;
  defaultEndpoint: string;
}

const MODEL_ENGINES: ModelEngine[] = [
  {
    id: 'ollama',
    name: 'Ollama',
    defaultEndpoint: 'http://localhost:11434'
  },
  {
    id: 'msty',
    name: 'Mistral',
    defaultEndpoint: 'http://localhost:10000'
  },
  {
    id: 'jan',
    name: 'Jan',
    defaultEndpoint: 'http://localhost:1337'
  },
  {
    id: 'custom',
    name: 'Custom',
    defaultEndpoint: ''
  }
];

// Mock data for demonstration
const MOCK_REQUESTS: PostRequest[] = [
  {
    id: '1',
    tweetLink: 'https://twitter.com/user1/status/123456789',
    description: 'New AI research paper discussion',
    instructions: 'Reply with your thoughts on the paper and mention one key takeaway',
    credit: 0.05,
    createdAt: new Date('2024-03-05T10:30:00'),
    createdBy: '0x1234...5678',
    engagementCount: 12
  },
  {
    id: '2',
    tweetLink: 'https://twitter.com/user2/status/987654321',
    description: 'Web3 gaming announcement',
    instructions: 'Share your excitement about the game and ask a question about gameplay',
    credit: 0.1,
    createdAt: new Date('2024-03-06T14:20:00'),
    createdBy: '0x8765...4321',
    engagementCount: 8
  }
];

export default function PlayPage() {
  const { isConnected, address } = useAccount();
  const [isModelConnected, setIsModelConnected] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<PostRequest | null>(null);
  const [availableRequests, setAvailableRequests] = useState<PostRequest[]>(MOCK_REQUESTS);
  const [selectedEngine, setSelectedEngine] = useState<string>('ollama');
  const [modelEndpoint, setModelEndpoint] = useState('http://localhost:11434');
  const [modelName, setModelName] = useState('llama3');
  const [credits, setCredits] = useState(0.15);
  const [generatedReply, setGeneratedReply] = useState('');
  const [twitterApiKey, setTwitterApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTwitterConfigured, setIsTwitterConfigured] = useState(false);

  // Handle engine change
  const handleEngineChange = (engineId: string) => {
    setSelectedEngine(engineId);
    const engine = MODEL_ENGINES.find(e => e.id === engineId);
    if (engine && engine.defaultEndpoint) {
      setModelEndpoint(engine.defaultEndpoint);
    }
  };

  const connectModel = () => {
    // In a real app, we would test the connection to the local model here
    setIsModelConnected(true);
  };

  const disconnectModel = () => {
    setIsModelConnected(false);
    setIsPosting(false);
    setCurrentRequest(null);
    setGeneratedReply('');
  };

  const handleSaveTwitterKey = () => {
    if (twitterApiKey.trim()) {
      // In a real app, we would securely store this key
      // For now, we'll just set the configured flag
      setIsTwitterConfigured(true);
      setShowApiKey(false);
    }
  };

  const startPosting = () => {
    if (!isModelConnected) {
      alert('Please connect your model first');
      return;
    }

    if (!isTwitterConfigured) {
      alert('Please configure your Twitter API key first');
      return;
    }
    
    setIsPosting(true);
    // Get the first available request
    if (availableRequests.length > 0) {
      setCurrentRequest(availableRequests[0]);
      // Simulate generating a reply
      setTimeout(() => {
        const replies = [
          "This is a fascinating development! I particularly like how it addresses the scalability issues we've been seeing in the field. What's your take on the privacy implications?",
          "Really excited about this announcement! The integration possibilities with existing systems seem promising. Have you considered how this might impact user adoption rates?",
          "Great insights shared here. I think the most valuable takeaway is the novel approach to data processing that could revolutionize how we think about efficiency in AI systems."
        ];
        setGeneratedReply(replies[Math.floor(Math.random() * replies.length)]);
      }, 2000);
    }
  };

  const stopPosting = () => {
    setIsPosting(false);
    setCurrentRequest(null);
    setGeneratedReply('');
  };

  const postReply = () => {
    if (!currentRequest) return;
    
    // In a real app, this would actually post to Twitter
    const newPostedTweet: PostedTweet = {
      id: Date.now().toString(),
      requestId: currentRequest.id,
      tweetLink: currentRequest.tweetLink,
      replyLink: `${currentRequest.tweetLink}/reply_${Date.now()}`,
      content: generatedReply,
      postedAt: new Date(),
      credit: currentRequest.credit
    };
    
    // Update credits
    setCredits(prev => prev + currentRequest.credit);
    
    // Remove from available requests
    setAvailableRequests(prev => prev.filter(req => req.id !== currentRequest.id));
    
    // Move to next request or stop if none left
    if (availableRequests.length <= 1) {
      setIsPosting(false);
      setCurrentRequest(null);
      setGeneratedReply('');
    } else {
      setCurrentRequest(availableRequests[1]);
      // Simulate generating a reply for the next request
      setTimeout(() => {
        const replies = [
          "This is a fascinating development! I particularly like how it addresses the scalability issues we've been seeing in the field. What's your take on the privacy implications?",
          "Really excited about this announcement! The integration possibilities with existing systems seem promising. Have you considered how this might impact user adoption rates?",
          "Great insights shared here. I think the most valuable takeaway is the novel approach to data processing that could revolutionize how we think about efficiency in AI systems."
        ];
        setGeneratedReply(replies[Math.floor(Math.random() * replies.length)]);
      }, 2000);
    }
  };

  const skipRequest = () => {
    if (!currentRequest) return;
    
    // Move to next request or stop if none left
    if (availableRequests.length <= 1) {
      setIsPosting(false);
      setCurrentRequest(null);
      setGeneratedReply('');
    } else {
      // Remove current request from the beginning and add it to the end
      const updatedRequests = [...availableRequests];
      const skipped = updatedRequests.shift();
      if (skipped) updatedRequests.push(skipped);
      setAvailableRequests(updatedRequests);
      
      // Set next request
      setCurrentRequest(updatedRequests[0]);
      setGeneratedReply('');
      
      // Simulate generating a reply for the next request
      setTimeout(() => {
        const replies = [
          "This is a fascinating development! I particularly like how it addresses the scalability issues we've been seeing in the field. What's your take on the privacy implications?",
          "Really excited about this announcement! The integration possibilities with existing systems seem promising. Have you considered how this might impact user adoption rates?",
          "Great insights shared here. I think the most valuable takeaway is the novel approach to data processing that could revolutionize how we think about efficiency in AI systems."
        ];
        setGeneratedReply(replies[Math.floor(Math.random() * replies.length)]);
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <ComputerDesktopIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Connect Your Local Model
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isModelConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-500">
                {isModelConnected ? 'Model Connected' : 'Model Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
            <div>
              <label htmlFor="modelEngine" className="block text-sm font-medium text-gray-700">
                Model Engine
              </label>
              <select
                id="modelEngine"
                name="modelEngine"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedEngine}
                onChange={(e) => handleEngineChange(e.target.value)}
                disabled={isModelConnected}
              >
                {MODEL_ENGINES.map((engine) => (
                  <option key={engine.id} value={engine.id}>
                    {engine.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="modelEndpoint" className="block text-sm font-medium text-gray-700">
                Model Endpoint
              </label>
              <input
                type="text"
                name="modelEndpoint"
                id="modelEndpoint"
                className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                placeholder="http://localhost:11434"
                value={modelEndpoint}
                onChange={(e) => setModelEndpoint(e.target.value)}
                disabled={isModelConnected || (selectedEngine !== 'custom')}
              />
            </div>
            <div>
              <label htmlFor="modelName" className="block text-sm font-medium text-gray-700">
                Model Name
              </label>
              <input
                type="text"
                name="modelName"
                id="modelName"
                className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                placeholder="llama3"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                disabled={isModelConnected}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isModelConnected
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              onClick={isModelConnected ? disconnectModel : connectModel}
              disabled={!isConnected}
            >
              {isModelConnected ? 'Disconnect Model' : 'Connect Model'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Posting Status</h3>
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-gray-100 rounded-md text-gray-800 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-yellow-500" />
                <span className="font-medium">{credits.toFixed(2)}</span>
                <span className="ml-1">CREDITS</span>
              </div>
              {isModelConnected && (
                <button
                  type="button"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isPosting
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  onClick={isPosting ? stopPosting : startPosting}
                >
                  {isPosting ? (
                    <>
                      <StopIcon className="h-5 w-5 mr-2" />
                      Stop Posting
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-5 w-5 mr-2" />
                      Start Posting
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {isPosting && currentRequest ? (
            <div className="border border-gray-200 rounded-lg p-5">
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-2">Current Request</h4>
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-500">
                      <a href={currentRequest.tweetLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        View Original Tweet
                      </a>
                    </div>
                    <div className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {currentRequest.credit} CREDITS
                    </div>
                  </div>
                </div>
                
                {currentRequest.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Description</h4>
                    <p className="mt-1 text-sm text-gray-500">{currentRequest.description}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Instructions</h4>
                  <p className="mt-1 text-sm text-gray-500">{currentRequest.instructions}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Generated Reply</h4>
                  {generatedReply ? (
                    <div className="mt-1 p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-800">
                      {generatedReply}
                    </div>
                  ) : (
                    <div className="mt-1 p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating reply...
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={skipRequest}
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white ${
                      generatedReply 
                        ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                    onClick={postReply}
                    disabled={!generatedReply}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Post Reply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              {isModelConnected ? (
                isPosting ? (
                  <p className="text-lg">No more requests available at the moment.</p>
                ) : (
                  <p className="text-lg">Click "Start Posting" to begin helping with tweet replies.</p>
                )
              ) : (
                <p className="text-lg">Connect your model to start posting.</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <KeyIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Twitter API Configuration
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isTwitterConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-500">
                {isTwitterConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="twitterApiKey" className="block text-sm font-medium text-gray-700">
                Twitter API Key
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  name="twitterApiKey"
                  id="twitterApiKey"
                  className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your Twitter API key"
                  value={twitterApiKey}
                  onChange={(e) => setTwitterApiKey(e.target.value)}
                  disabled={isTwitterConfigured}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Your API key will be used to automate tweet replies. {isTwitterConfigured && 'The key is securely stored.'}
              </p>
            </div>

            {!isTwitterConfigured && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={handleSaveTwitterKey}
                  disabled={!twitterApiKey.trim()}
                >
                  Save API Key
                </button>
              </div>
            )}

            {isTwitterConfigured && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => {
                    setIsTwitterConfigured(false);
                    setTwitterApiKey('');
                  }}
                >
                  Reset API Key
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 