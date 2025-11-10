import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import CallInterface from '@/components/call/CallInterface';
import Header from '@/components/layout/Header';
import toast from 'react-hot-toast';

const CallPage: NextPage = () => {
  const router = useRouter();
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

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <Link
              href="/meetings"
              className="inline-flex w-fit items-center gap-2 text-sm text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Meetings
            </Link>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                Start a call with Aurray
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aurray joins as a co-participant using the context you select, ready to contribute the moment your meeting begins.
              </p>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6 lg:p-8">
              <CallInterface
                onCallStart={handleCallStart}
                existingConversation={existingConversation}
                loadingConversation={loadingConversation}
              />
            </section>

            <aside className="mt-8 space-y-6 text-sm text-gray-600 dark:text-gray-300 lg:mt-0">
              {currentConversationId ? (
                <div className="rounded-xl border border-primary-400/30 bg-primary-500/10 p-5">
                  <p className="font-medium text-primary-700 dark:text-primary-200">Sharing link</p>
                  <div className="mt-3 flex items-center gap-2 truncate rounded-md bg-white px-3 py-2 text-xs font-semibold text-primary-700 shadow-sm dark:bg-gray-950 dark:text-primary-100">
                    <ShareIcon className="h-4 w-4 shrink-0" />
                    {currentConversationId}
                  </div>
                  <p className="mt-3 text-xs text-primary-700/80 dark:text-primary-200/80">
                    Copy and share this ID to let teammates join the same call.
                  </p>
                  {loadingConversation ? (
                    <p className="mt-4 text-xs text-primary-700 dark:text-primary-200">
                      Loading conversation details...
                    </p>
                  ) : existingConversation ? (
                    <dl className="mt-4 grid gap-2 text-xs text-primary-700 dark:text-primary-200 sm:grid-cols-2">
                      <div className="flex justify-between gap-3">
                        <dt className="font-medium">Status</dt>
                        <dd className="capitalize">{existingConversation.status ?? 'Unknown'}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="font-medium">Turns</dt>
                        <dd>{existingConversation.turn_count ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-3 sm:col-span-2">
                        <dt className="font-medium">Started</dt>
                        <dd>
                          {existingConversation.started_at
                            ? new Date(existingConversation.started_at).toLocaleString()
                            : '—'}
                        </dd>
                      </div>
                      {existingConversation.summary && (
                        <div className="sm:col-span-2">
                          <dt className="font-medium">Summary</dt>
                          <dd className="mt-1 text-justify leading-relaxed">
                            {existingConversation.summary}
                          </dd>
                        </div>
                      )}
                    </dl>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Start a session to generate a sharable link. You can end the call anytime, and the session ID will disappear.
                </div>
              )}


            </aside>
          </div>
        </div>
      </main>
    </>
  );
};

export default CallPage;
