import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CallInterface from '@/components/call/CallInterface';
import Header from '@/components/layout/Header';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

const CallPage: NextPage = () => {
  const router = useRouter();
  const [recentConversationId, setRecentConversationId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [existingConversation, setExistingConversation] = useState<{ status?: string; turn_count?: number; started_at?: string; summary?: string } | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  // Fetch existing conversation by ID (disabled - conversations removed)
  const fetchExistingConversation = async (conversationId: string) => {
    try {
      setLoadingConversation(true);
      // Conversations feature has been removed
      setExistingConversation(null);
      console.log('Conversation feature disabled');
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      toast.error('Conversation feature is no longer available.');
      // Clear the conversation ID from URL if it doesn't exist
      router.push('/call', undefined, { shallow: true });
      setCurrentConversationId(null);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleCallStart = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // Update URL with conversation ID
    router.push(`/call?conversation=${conversationId}`, undefined, { shallow: true });
  };

  const handleCallEnd = (conversationId: string) => {
    setRecentConversationId(conversationId);
    setCurrentConversationId(null);
    // Update URL to remove conversation ID
    router.push('/call', undefined, { shallow: true });
    // Optionally redirect to conversation details
    // router.push(`/conversations/${conversationId}`);
  };

  // Handle URL parameters on page load
  useEffect(() => {
    if (router.isReady && router.query.conversation) {
      const conversationId = router.query.conversation as string;
      setCurrentConversationId(conversationId);
      // Fetch the existing conversation
      fetchExistingConversation(conversationId);
    }
  }, [router.isReady, router.query.conversation]);

  return (
    <>
      <Head>
        <title>Aurray Call - Live Demo</title>
        <meta name="description" content="Test the Aurray in real-time" />
      </Head>

      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          
          {currentConversationId && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Active Conversation:</strong> {currentConversationId}
              </p>
              {loadingConversation ? (
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Loading conversation details...
                </p>
              ) : existingConversation ? (
                <div className="mt-2">
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    <strong>Status:</strong> {existingConversation.status} • 
                    <strong> Turns:</strong> {existingConversation.turn_count} • 
                    <strong> Started:</strong> {new Date(existingConversation.started_at).toLocaleString()}
                  </p>
                  {existingConversation.summary && (
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      <strong>Summary:</strong> {existingConversation.summary}
                    </p>
                  )}
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Share this URL to let others join the same conversation
                  </p>
                </div>
              ) : (
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Share this URL to let others join the same conversation
                </p>
              )}
            </div>
          )}
        </div>

        {/* Call Interface */}
        <div className="h-[70vh] mb-8">
          <CallInterface 
            onCallStart={handleCallStart} 
            onCallEnd={handleCallEnd}
            existingConversation={existingConversation}
            loadingConversation={loadingConversation}
          />
        </div>

    

        {/* Recent Conversation */}
        {/* {recentConversationId && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Call Completed!</h3>
            <p className="text-green-800 mb-4">
              Your conversation has been saved. You can view the full transcript and any actions taken.
            </p>
            <button
              onClick={() => router.push(`/conversations/${recentConversationId}`)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              View Conversation Details
            </button>
          </div>
        )} */}
      </div>
    </>
  );
};

export default CallPage;
