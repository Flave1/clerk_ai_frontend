import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Header from '@/components/layout/Header';
import toast from 'react-hot-toast';
import { MeetingContextCreate, MeetingRole, TonePersonality } from '@/types';
import apiClient from '@/lib/api';

// Voice options - for now, only Default Voice is available
const VOICE_OPTIONS = [
  { id: 'default', name: "Alloy ", provider: 'Aurray Default' },
];

interface ConnectedTool {
  integration_id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
}

// Helper function to create short, action-oriented descriptions
const getShortDescription = (integrationId: string, description: string): string => {
  // Create shorter, more concise descriptions
  const shortDescriptions: Record<string, string> = {
    'zoom': 'Can schedule Zoom meetings',
    'google_workspace': 'Can schedule meetings and send emails',
    'google_calendar': 'Can schedule meetings and manage calendar',
    'google_gmail': 'Can send and receive emails',
    'google_drive': 'Can access and manage files',
    'google_docs': 'Can read and access documents',
    'google_meet': 'Can create meeting links and manage meetings',
    'microsoft_email': 'Can send and receive emails',
    'microsoft_calendar': 'Can schedule meetings and manage calendar',
    'microsoft_contacts': 'Can manage contacts',
    'microsoft_teams': 'Can create Teams meetings and send messages',
    'microsoft_onedrive': 'Can access and manage files',
    'microsoft_sharepoint': 'Can access SharePoint sites and documents',
    'microsoft_office': 'Can work with Word, Excel, and PowerPoint',
    'slack': 'Can send messages and notifications',
    'hubspot': 'Can sync contacts and deals',
    'salesforce': 'Can manage leads and opportunities',
    'notion': 'Can create and update pages',
    'github': 'Can create issues and pull requests',
    'jira': 'Can create and update issues',
    'asana': 'Can create tasks and update projects',
    'trello': 'Can create cards and update boards',
  };
  
  // Return short description if available, otherwise use first sentence of description
  if (shortDescriptions[integrationId]) {
    return shortDescriptions[integrationId];
  }
  
  // Fallback: use first sentence or first 60 characters
  const firstSentence = description.split('.')[0];
  return firstSentence.length > 60 ? firstSentence.substring(0, 57) + '...' : firstSentence;
};

const CreateMeetingContextPage: NextPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedTools, setConnectedTools] = useState<ConnectedTool[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<MeetingContextCreate>({
    name: '',
    voice_id: '',
    context_description: `I need you to join the meeting on my behalf. Please speak and respond naturally — sound exactly like me. Keep your tone polite, confident, and respectful at all times.

Don't use any offensive, rude, or inappropriate language. If someone asks about me, politely let them know I'm currently occupied but listening in through you.

Contribute to the conversation when necessary — ask thoughtful questions, agree or give short feedback like "That makes sense" or "I agree with that point."

Take clear notes of key points, decisions, or action items discussed during the meeting. If the conversation becomes irrelevant or off-topic, stay quiet but continue listening attentively.

Once the meeting ends, summarize the important details, including next steps, deadlines, and who's responsible for each action item.`,
    tools_integrations: [],
    meeting_role: 'participant',
    tone_personality: 'friendly',
    custom_tone: '',
    is_default: false,
  });

  // Load connected integrations
  useEffect(() => {
    const loadConnectedTools = async () => {
      try {
        setLoadingTools(true);
        const connected = await apiClient.getConnectedIntegrations();
        setConnectedTools(connected.map(integ => ({
          integration_id: integ.integration_id,
          name: integ.name,
          description: integ.description || '',
          category: integ.category,
          image_url: integ.image_url,
        })));
      } catch (error) {
        console.error('Failed to load connected tools:', error);
        toast.error('Failed to load connected tools');
      } finally {
        setLoadingTools(false);
      }
    };
    loadConnectedTools();
  }, []);

  const handleInputChange = (field: keyof MeetingContextCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToolToggle = (toolId: string) => {
    setFormData(prev => {
      const tools = prev.tools_integrations.includes(toolId)
        ? prev.tools_integrations.filter(id => id !== toolId)
        : [...prev.tools_integrations, toolId];
      return { ...prev, tools_integrations: tools };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a context name');
      return;
    }
    
    if (!formData.voice_id) {
      toast.error('Please select a voice');
      return;
    }
    
    if (!formData.context_description.trim()) {
      toast.error('Please enter a context description');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiClient.createMeetingContext(formData);
      toast.success('Meeting context created successfully!');
      router.push('/context-lab');
    } catch (error) {
      console.error('Failed to create meeting context:', error);
      toast.error('Failed to create meeting context');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Meeting Context - Aurray</title>
      </Head>

      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/context-lab">
            <button className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </button>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Meeting Context</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure how Aurray behaves in this meeting context.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
              placeholder="e.g., Sales Demo Persona, Team Standup Mode, Investor Meeting"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Unique identifier for this context. Can be displayed as the context name Aurray uses when joining meetings.
            </p>
          </div>

          {/* Voice Profile */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Voice Profile <span className="text-red-500">*</span>
              </label>
              <Link href="/voice-profile">
                <button
                  type="button"
                  className="inline-flex items-center text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Create Voice Profile
                </button>
              </Link>
            </div>
            <select
              value={formData.voice_id}
              onChange={(e) => handleInputChange('voice_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
              required
            >
              <option value="">Select a voice profile...</option>
              {VOICE_OPTIONS.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} ({voice.provider})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select which voice profile Aurray uses. You can preview voices or create a custom voice profile.
            </p>
          </div>

          {/* Context Description */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Context <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.context_description}
              onChange={(e) => handleInputChange('context_description', e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm min-h-[240px]"
              placeholder="Define Aurray's behavior, tone, and goals for this context. e.g., Be concise, data-driven, and persuasive when talking to clients."
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This acts like a system prompt for Aurray during meetings. Tell your bot what to do and what not to do, how Aurray should behave, and what goals to achieve.
            </p>
          </div>

          {/* Meeting Role */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting Role
            </label>
            <select
              value={formData.meeting_role}
              onChange={(e) => handleInputChange('meeting_role', e.target.value as MeetingRole)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="listener">Listener (take notes, summarize, stay quiet)</option>
              <option value="participant">Participant (respond and interact naturally)</option>
              <option value="presenter">Presenter (lead discussion, explain slides, answer questions)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Define how Aurray should behave in the meeting.
            </p>
          </div>

          {/* Default Context */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-3">
              <input
                id="is_default"
                type="checkbox"
                checked={Boolean(formData.is_default)}
                onChange={(e) => handleInputChange('is_default', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <div>
                <label htmlFor="is_default" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Make this the default meeting context
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The default context is used automatically when starting a call unless you choose a different one. Only one context can be selected as default.
                </p>
              </div>
            </div>
          </div>

          {/* Tone & Personality */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tone & Personality
            </label>
            <select
              value={formData.tone_personality}
              onChange={(e) => handleInputChange('tone_personality', e.target.value as TonePersonality)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm mb-3"
            >
              <option value="formal">Formal</option>
              <option value="friendly">Friendly</option>
              <option value="confident">Confident</option>
              <option value="empathetic">Empathetic</option>
              <option value="analytical">Analytical</option>
              <option value="custom">Custom</option>
            </select>
            
            {formData.tone_personality === 'custom' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={formData.custom_tone || ''}
                  onChange={(e) => handleInputChange('custom_tone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="e.g., Sound like a calm and confident consultant"
                />
              </div>
            )}
            
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Define communication style. Choose a preset or create a custom tone.
            </p>
          </div>

          {/* Tools & Integrations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tools & Integrations
            </label>
            {loadingTools ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading connected tools...</p>
              </div>
            ) : connectedTools.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  No connected tools available.
                </p>
                <Link href="/integrations/connected">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    Connect Tools
                    <ArrowLeftIcon className="h-4 w-4 ml-2 rotate-180" />
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {connectedTools.map((tool) => (
                    <label
                      key={tool.integration_id}
                      className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.tools_integrations.includes(tool.integration_id)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.tools_integrations.includes(tool.integration_id)}
                        onChange={() => handleToolToggle(tool.integration_id)}
                        className="sr-only"
                      />
                      <div className="flex items-start w-full">
                        <div className={`flex-shrink-0 h-5 w-5 border-2 rounded flex items-center justify-center mr-3 mt-0.5 ${
                          formData.tools_integrations.includes(tool.integration_id)
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {formData.tools_integrations.includes(tool.integration_id) && (
                            <CheckCircleIcon className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex items-start flex-1">
                          <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                            {imageErrors.has(tool.integration_id) ? (
                              <div className="h-8 w-8 bg-primary-500 rounded flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {tool.name.charAt(0)}
                                </span>
                              </div>
                            ) : (
                              <img
                                src={tool.image_url}
                                alt={tool.name}
                                className="h-full w-full object-contain p-1"
                                onError={() => {
                                  setImageErrors(prev => new Set(prev).add(tool.integration_id));
                                }}
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                              {tool.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block leading-relaxed">
                              {getShortDescription(tool.integration_id, tool.description) || tool.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Choose which connected tools Aurray can use in this context.
                </p>
              </>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link href="/context-lab">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Create Context
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateMeetingContextPage;

