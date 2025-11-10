import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  BeakerIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Header from '@/components/layout/Header';
import apiClient from '@/lib/api';
import { MeetingContext } from '@/types';

// AI Bot Icons - using emoji/unicode for now, can be replaced with actual images
const AI_BOT_ICONS = [
  '🤖', '👾', '🤖', '👽', '🤖', '👾', '🤖'
];

// Get a consistent icon for a context based on its ID
const getBotIcon = (contextId: string): string => {
  const index = parseInt(contextId.replace(/-/g, '').substring(0, 8), 16) % AI_BOT_ICONS.length;
  return AI_BOT_ICONS[index];
};

const ContextLabPage: NextPage = () => {
  const router = useRouter();
  const [contexts, setContexts] = useState<MeetingContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContexts = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getMeetingContexts();
        setContexts(data);
      } catch (error) {
        console.error('Failed to load meeting contexts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContexts();
  }, []);

  const handleEdit = (contextId: string) => {
    router.push(`/context-lab/edit-meeting-context?id=${contextId}`);
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Context Lab - Aurray</title>
        </Head>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading contexts...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Context Lab - Aurray</title>
      </Head>

      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Context Lab</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Customize how Aurray behaves in different meeting scenarios.
              </p>
            </div>
            
            <Link href="/context-lab/create-meeting-context">
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Meeting Context
              </button>
            </Link>
          </div>
        </div>

        {/* Content */}
        {contexts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 mb-6">
                <BeakerIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
              </div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                No Meeting Contexts Yet
              </h2>
              
              {/* Description */}
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                Create meeting contexts to define how Aurray should behave in different scenarios. 
                Each context sets the voice, tone, role, and tools Aurray uses for that type of meeting.
              </p>
              
              {/* Create Button */}
              <Link href="/context-lab/create-meeting-context">
                <button className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First Meeting Context
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Bot
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Voice
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tools
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {contexts.map((context) => (
                    <tr
                      key={context.id}
                      onClick={() => handleEdit(context.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleEdit(context.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-2xl">
                            {getBotIcon(context.id)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {context.name}
                          </div>
                          {context.is_default && (
                            <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                              Selected
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate" title={context.context_description}>
                          {context.context_description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {context.voice_id === 'default' ? "Aurray's Voice (Default)" : context.voice_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {context.tools_integrations.length} {context.tools_integrations.length === 1 ? 'tool' : 'tools'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ContextLabPage;
