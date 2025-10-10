import { useState, useEffect } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CogIcon,
  CalendarIcon,
  EnvelopeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useDashboardStore } from '@/store';
import apiClient from '@/lib/api';
import { Conversation, Turn, Action } from '@/types';
import toast from 'react-hot-toast';

// Turn Component
interface TurnComponentProps {
  turn: Turn;
}

function TurnComponent({ turn }: TurnComponentProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTurnIcon = (type: string) => {
    switch (type) {
      case 'user_speech':
        return <UserIcon className="h-4 w-4 text-primary-600" />;
      case 'ai_response':
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-success-600" />;
      case 'system_message':
        return <InformationCircleIcon className="h-4 w-4 text-blue-600" />;
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-danger-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTurnColor = (type: string) => {
    switch (type) {
      case 'user_speech':
        return 'bg-primary-50 border-primary-200';
      case 'ai_response':
        return 'bg-success-50 border-success-200';
      case 'system_message':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-danger-50 border-danger-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getTurnColor(turn.turn_type)}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getTurnIcon(turn.turn_type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 capitalize">
              {turn.turn_type.replace('_', ' ')}
            </p>
            <p className="text-xs text-gray-500">
              {formatTime(turn.timestamp)}
            </p>
          </div>
          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
            {turn.content}
          </p>
          {turn.confidence_score && (
            <p className="mt-2 text-xs text-gray-500">
              Confidence: {Math.round(turn.confidence_score * 100)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Action Component
interface ActionComponentProps {
  action: Action;
}

function ActionComponent({ action }: ActionComponentProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'calendar_create':
      case 'calendar_update':
      case 'calendar_delete':
        return <CalendarIcon className="h-4 w-4" />;
      case 'email_send':
        return <EnvelopeIcon className="h-4 w-4" />;
      default:
        return <CogIcon className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-success-600" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-danger-600" />;
      case 'in_progress':
        return <ClockIcon className="h-4 w-4 text-warning-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getActionIcon(action.action_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 capitalize">
                {action.action_type.replace('_', ' ')}
              </p>
              <div className="flex items-center space-x-2">
                {getStatusIcon(action.status)}
                <span className={`status-badge ${
                  action.status === 'completed' ? 'status-completed' :
                  action.status === 'failed' ? 'status-failed' :
                  action.status === 'in_progress' ? 'status-active' : 'status-pending'
                }`}>
                  {action.status}
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Created {formatTime(action.created_at)}
            </p>
            {action.error_message && (
              <p className="mt-2 text-sm text-danger-600">
                Error: {action.error_message}
              </p>
            )}
            {action.result && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <pre className="whitespace-pre-wrap text-gray-700">
                  {JSON.stringify(action.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConversationDetailProps {
  conversation: Conversation;
}

const ConversationDetail: NextPage<ConversationDetailProps> = ({ conversation: initialConversation }) => {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation>(initialConversation);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'turns' | 'actions'>('turns');

  const { updateConversation } = useDashboardStore();

  useEffect(() => {
    const loadConversationData = async () => {
      try {
        setLoading(true);
        const [turnsData, actionsData] = await Promise.all([
          apiClient.getConversationTurns(conversation.id),
          apiClient.getConversationActions(conversation.id),
        ]);
        
        setTurns(turnsData);
        setActions(actionsData);
      } catch (error) {
        console.error('Failed to load conversation data:', error);
        toast.error('Failed to load conversation details');
      } finally {
        setLoading(false);
      }
    };

    loadConversationData();
  }, [conversation.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ClockIcon className="h-5 w-5 text-warning-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-success-600" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-danger-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Conversation {conversation.id.slice(-8)} - AI Receptionist</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/conversations" className="btn-secondary">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Conversation {conversation.id.slice(-8)}
            </h1>
          </div>

          {/* Conversation Info */}
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(conversation.status)}
                    <span className={`status-badge ${
                      conversation.status === 'active' ? 'status-active' :
                      conversation.status === 'completed' ? 'status-completed' :
                      conversation.status === 'failed' ? 'status-failed' : 'status-pending'
                    }`}>
                      {conversation.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Started</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(conversation.started_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Turns</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {conversation.turn_count}
                  </p>
                </div>
              </div>
              {conversation.summary && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600">Summary</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {conversation.summary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('turns')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'turns'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Turns ({turns.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'actions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Actions ({actions.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'turns' ? (
          <div className="space-y-4">
            {turns.length === 0 ? (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No turns</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No conversation turns have been recorded yet.
                </p>
              </div>
            ) : (
              turns.map((turn) => (
                <TurnComponent key={turn.id} turn={turn} />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {actions.length === 0 ? (
              <div className="text-center py-12">
                <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No actions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No actions have been executed for this conversation yet.
                </p>
              </div>
            ) : (
              actions.map((action) => (
                <ActionComponent key={action.id} action={action} />
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  try {
    const conversation = await apiClient.getConversation(id as string);
    return {
      props: {
        conversation,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

export default ConversationDetail;
