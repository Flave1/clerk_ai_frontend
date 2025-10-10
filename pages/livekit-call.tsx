import React from 'react';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import LiveKitCallInterface from '@/components/call/LiveKitCallInterface';

const LiveKitCallPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>LiveKit AI Call - AI Receptionist</title>
      </Head>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-8rem)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">LiveKit AI Call</h1>
          <p className="text-gray-600 mt-2">
            Real-time audio/video communication with AI using LiveKit
          </p>
        </div>
        <div className="h-full">
          <LiveKitCallInterface />
        </div>
      </div>
    </>
  );
};

export default LiveKitCallPage;
