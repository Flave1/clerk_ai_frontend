import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { callClient } from '@/lib/callClient';
import apiClient from '@/lib/api';
import type { MeetingContext } from '@/types';

interface CallInterfaceProps {
  onCallStart?: (conversationId: string) => void;
  existingConversation?: { status?: string } | null;
  loadingConversation?: boolean;
}

const CallInterface: React.FC<CallInterfaceProps> = ({
  onCallStart,
  existingConversation,
  loadingConversation,
}) => {
  const router = useRouter();
  
  const [meetingContexts, setMeetingContexts] = useState<MeetingContext[]>([]);
  const [contextsLoading, setContextsLoading] = useState(false);
  const [contextsError, setContextsError] = useState<string | null>(null);
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({});
  const [isStarting, setIsStarting] = useState(false);
  const [startingContextId, setStartingContextId] = useState<string | null>(null);

  const loadMeetingContexts = useCallback(async () => {
    try {
      setContextsLoading(true);
      setContextsError(null);
      const data = await apiClient.getMeetingContexts();
      const sortedContexts = [...data].sort(
        (a, b) => Number(b.is_default) - Number(a.is_default),
      );
      setMeetingContexts(sortedContexts);
      setExpandedContexts({});
    } catch (error) {
      console.error('Failed to load meeting contexts:', error);
      setContextsError('Unable to load meeting contexts.');
    } finally {
      setContextsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetingContexts();
  }, [loadMeetingContexts]);

  useEffect(() => {
    if (existingConversation && !loadingConversation) {
      console.log('Existing conversation detected:', existingConversation);
    }
  }, [existingConversation, loadingConversation]);

  const toggleContextExpansion = (contextId: string) => {
    setExpandedContexts((prev) => ({
      ...prev,
      [contextId]: !prev[contextId],
    }));
  };

  const goToMeetingRoom = ({
    conversationId,
    meetingId,
    meetingUrl,
    contextId,
  }: {
    conversationId: string;
    meetingId?: string;
    meetingUrl?: string;
    contextId?: string | null;
  }) => {
    const resolvedMeetingId = meetingId || callClient.currentSessionId || conversationId;
    if (!resolvedMeetingId) {
      console.error('Unable to resolve meeting identifier for meeting room redirect');
      return;
    }

    const query = new URLSearchParams({
      meetingId: resolvedMeetingId,
      conversationId,
      isHost: 'true',
    });

    if (contextId) {
      query.set('contextId', contextId);
    }
    if (meetingUrl) {
      query.set('meetingUrl', meetingUrl);
    }

    // Navigate to meeting room in the current tab
    const meetingRoomUrl = `/meeting-room?${query.toString()}`;
    router.push(meetingRoomUrl).catch((error) => {
      console.error('Failed to navigate to meeting room:', error);
      window.location.href = meetingRoomUrl;
    });
  };

  const startCall = async (context?: MeetingContext) => {
    try {
      setIsStarting(true);
      setStartingContextId(context?.id ?? null);

      const result = await callClient.startCall(context);

      if (onCallStart) {
        onCallStart(result.conversationId);
      }

      goToMeetingRoom({
        conversationId: result.conversationId,
        meetingId: result.meetingId,
        meetingUrl: result.meetingUiUrl || result.meetingUrl,
        contextId: context?.id ?? null,
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call. Please try again.');
    } finally {
      setIsStarting(false);
      setStartingContextId(null);
    }
  };

  const startDefaultCall = () => {
    startCall();
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Start a New Meeting
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose the meeting context to tailor the assistant&apos;s role and tone.
            </p>
          </div>
          {meetingContexts.length === 0 && (
            <button
              onClick={startDefaultCall}
              disabled={isStarting}
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/70 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-green-400/70 dark:focus:ring-offset-gray-900"
            >
              {isStarting ? 'Starting...' : 'Start Quick Call'}
            </button>
            )}
          </div>
        </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {contextsLoading && (
                <div className="flex h-40 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                  Loading contexts...
                </div>
              )}

              {contextsError && !contextsLoading && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
                  {contextsError}
                </div>
              )}

              {!contextsLoading && !contextsError && meetingContexts.length === 0 && (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            <span className="font-medium text-gray-600 dark:text-gray-300">
              No meeting contexts yet
            </span>
            <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">
              Create a meeting context to define your assistant&apos;s responsibilities, tone,
              and tools. You can still launch a quick call using the button above.
            </p>
                </div>
              )}

              {!contextsLoading && !contextsError && meetingContexts.length > 0 && (
          <div className="flex flex-col gap-4">
                  {meetingContexts.map((context) => (
                    <div
                      key={context.id}
                className={`flex h-full flex-col justify-between rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        context.is_default
                    ? 'border-blue-200 bg-blue-50/60 dark:border-blue-500/40 dark:bg-blue-900/20'
                          : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
                      }`}
                    >
                <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                              {context.name}
                    </h3>
                            {context.is_default && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-500/30 dark:text-blue-100">
                        Default
                              </span>
                            )}
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {context.meeting_role}
                            </span>
                          </div>
                  <p
                    className={`text-sm leading-relaxed text-gray-600 dark:text-gray-300 ${
                      expandedContexts[context.id] ? '' : 'line-clamp-3'
                    }`}
                  >
                            {context.context_description}
                          </p>
                          <button
                            onClick={() => toggleContextExpansion(context.id)}
                            className="text-xs font-medium text-blue-600 transition hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-white dark:text-blue-300 dark:hover:text-blue-200 dark:focus:ring-offset-gray-900"
                          >
                    {expandedContexts[context.id] ? 'Show less' : 'Show more'}
                          </button>

                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="rounded-full bg-gray-100 px-2 py-1 font-medium uppercase tracking-wide dark:bg-gray-800">
                      Tone:&nbsp;
                      {context.tone_personality === 'custom' && context.custom_tone
                        ? context.custom_tone
                        : context.tone_personality}
                    </span>
                    {context.tools_integrations?.map((tool) => (
                                <span
                                  key={tool}
                                  className="rounded-full bg-gray-100 px-2 py-1 font-medium uppercase tracking-wide dark:bg-gray-800"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Updated&nbsp;
                    {new Date(context.updated_at ?? context.created_at ?? Date.now()).toLocaleDateString()}
                        </div>
                          <button
                            onClick={() => startCall(context)}
                    disabled={isStarting && startingContextId !== context.id}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-primary-400/70 dark:focus:ring-offset-gray-900"
                          >
                    {isStarting && startingContextId === context.id ? 'Starting...' : 'Start Now'}
                          </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallInterface;
