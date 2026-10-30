'use client';

import { useState } from 'react';
import PromptAnalyzer from '@/components/PromptAnalyzer';
import BatchAnalyzer from '@/components/BatchAnalyzer';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'realtime' | 'batch'>('realtime');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-white dark:bg-gray-800 p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('realtime')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'realtime'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Real-time Analysis
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'batch'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Batch Analysis
            </button>
          </div>
        </div>

        {activeTab === 'realtime' ? <PromptAnalyzer /> : <BatchAnalyzer />}

        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
          <p className="mt-2">
            This tool uses pattern-based detection to identify potential prompt injection attacks.
          </p>
        </div>
      </div>
    </div>
  );
}
