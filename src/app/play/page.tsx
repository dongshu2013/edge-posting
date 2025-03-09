'use client';

import { useState } from 'react';
import { 
  PlayIcon, 
  StopIcon, 
  SparklesIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface PostRequest {
  id: string;
  tweetLink: string;
  instructions: string;
  price: number;
  replyCount: number;
  totalReplies: number;
  createdBy: string;
  deadline: string;
  isActive: boolean;
}

interface ModelEngine {
  name: string;
  endpoint: string;
  defaultEndpoint: string;
}

const MODEL_ENGINES: ModelEngine[] = [
  {
    name: 'Ollama',
    endpoint: 'http://localhost:11434/api/generate',
    defaultEndpoint: 'http://localhost:11434/api/generate',
  },
  {
    name: 'LocalAI',
    endpoint: 'http://localhost:8080/v1/chat/completions',
    defaultEndpoint: 'http://localhost:8080/v1/chat/completions',
  },
];

export default function PlayPage() {
  // State for model settings
  const [selectedEngine, setSelectedEngine] = useState(MODEL_ENGINES[0]);
  const [endpoint, setEndpoint] = useState(MODEL_ENGINES[0].defaultEndpoint);
  const [isCustomEndpoint, setIsCustomEndpoint] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // State for current request
  const [currentRequest, setCurrentRequest] = useState<PostRequest | null>(null);
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for earnings
  const [earnings, setEarnings] = useState(0.15);
  const [price, setPrice] = useState(0.05);

  // Handle engine change
  const handleEngineChange = (engineName: string) => {
    const engine = MODEL_ENGINES.find((e) => e.name === engineName);
    if (engine) {
      setSelectedEngine(engine);
      setEndpoint(engine.defaultEndpoint);
      setIsCustomEndpoint(false);
      setPrice(0.05);
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Play & Earn</h1>
              <p className="mt-1 text-sm text-gray-500">
                Connect your local model and start earning BUZZ tokens
              </p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-4 py-2">
              <SparklesIcon className="h-5 w-5 text-indigo-500" />
              <span className="text-sm text-gray-700">Earned:</span>
              <span className="font-medium">{earnings.toFixed(2)}</span>
              <span className="text-sm text-gray-700">BUZZ</span>
            </div>
          </div>
        </div>

        {/* Model Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Model Settings</h2>
          <div className="space-y-4">
            {/* Engine Selection */}
            <div>
              <label htmlFor="engine" className="block text-sm font-medium text-gray-700">
                Engine
              </label>
              <select
                id="engine"
                name="engine"
                value={selectedEngine.name}
                onChange={(e) => handleEngineChange(e.target.value)}
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {MODEL_ENGINES.map((engine) => (
                  <option key={engine.name} value={engine.name}>
                    {engine.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Endpoint */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700">
                  Endpoint
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomEndpoint(!isCustomEndpoint)}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {isCustomEndpoint ? 'Use Default' : 'Custom'}
                </button>
              </div>
              <div className="mt-1">
                <input
                  type="text"
                  name="endpoint"
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  disabled={!isCustomEndpoint}
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* BUZZ per Reply */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                BUZZ per Reply
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="price"
                  id="price"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Connect Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsConnected(!isConnected)}
                className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white transition-all duration-200 ${
                  isConnected
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isConnected ? (
                  <>
                    <StopIcon className="h-5 w-5 mr-2" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Connect
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Current Request */}
        {currentRequest && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Current Request</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Reward:</span>
                <div className="flex items-center gap-1 bg-indigo-50 rounded-lg px-2 py-1">
                  <SparklesIcon className="h-4 w-4 text-indigo-500" />
                  <span className="font-medium">{currentRequest.price} BUZZ</span>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="space-y-4">
              {/* Tweet Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Tweet Link</label>
                <div className="mt-1">
                  <a
                    href={currentRequest.tweetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    {currentRequest.tweetLink}
                  </a>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Instructions</label>
                <div className="mt-1">
                  <p className="text-gray-900">{currentRequest.instructions}</p>
                </div>
              </div>

              {/* Generated Reply */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Generated Reply</label>
                <div className="mt-1">
                  <textarea
                    rows={4}
                    value={generatedReply}
                    onChange={(e) => setGeneratedReply(e.target.value)}
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Click 'Generate' to create a reply..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setIsGenerating(true);
                    setTimeout(() => {
                      setGeneratedReply('This is a generated reply!');
                      setIsGenerating(false);
                    }, 2000);
                  }}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Generate
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsSubmitting(true);
                    setTimeout(() => {
                      setEarnings((prev) => prev + currentRequest.price);
                      setCurrentRequest(null);
                      setGeneratedReply('');
                      setIsSubmitting(false);
                    }, 2000);
                  }}
                  disabled={!generatedReply || isSubmitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}