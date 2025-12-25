import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import {
  CheckCircleIcon,
  VideoCameraIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import { useUIStore } from '@/store';
import { getCurrentUser } from '@/lib/auth';

interface UseCase {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
  highlights?: string[];
  idealFor: string[];
  gradient: string;
  features?: string[];
  keyBenefits?: string[];
  whatItDoes?: string[];
}

const useCases: UseCase[] = [
  {
    icon: VideoCameraIcon,
    title: 'Attend/Join Meetings With You',
    subtitle: 'Your AI Representative',
    description: 'Let Aurray attend/join meetings with you using your voice. Joins video calls, participates in discussions.',
    highlights: [
      'Speaks in your voice and style',
      'Joins Zoom, Google Meet, and Teams automatically',
      'Handles discussions with your guidance',
      'Provides Transcripts, Recordings and metadata from meetings',
    ],
    idealFor: ['Busy professionals', 'Remote teams', 'Multi-timezone workers'],
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BriefcaseIcon,
    title: 'Your Digital Sales & Marketing Team',
    subtitle: 'Always-On Business Development',
    description: 'Transform Aurray into your dedicated sales and marketing staff. Perfect for daily standups, client calls, and team meetings with CRM integration.',
    highlights: [
      'Manages sales pipeline and relationships',
      'Conducts standups and sync meetings',
      'Integrates with Salesforce, HubSpot, and email',
    ],
    idealFor: ['Sales teams', 'Marketing departments', 'Business development'],
    gradient: 'from-primary-500 to-accent-500',
  },
  {
    icon: UserGroupIcon,
    title: 'Your Digital Interviewer & Hiring Assistant',
    subtitle: 'Smart Recruitment',
    description: 'Aurray can handle candidate interviews and screening calls.',
    highlights: [
      'Conducts first-round interviews in your voice',
      'Asks role-specific questions',
      'Records responses and evaluates candidates',
      'Shares structured interview feedback',
    ],
    idealFor: ['HR teams', 'Startups hiring at scale'],
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: '24/7 Customer Care Support',
    subtitle: 'Always-On Customer Service',
    description: 'Your dedicated customer care team. Handles inquiries, support calls, and service meetings around the clock with platform integrations.',
    highlights: [
      '24/7 availability for support calls',
      'Integrates with Zendesk, Intercom, and Freshdesk',
      'Manages tickets and escalates when needed',
    ],
    idealFor: ['Customer support teams', 'SaaS companies', 'E-commerce businesses'],
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: CogIcon,
    title: 'Your AI Operations & Project Manager',
    subtitle: 'Reliable Operations Manager',
    description: 'Turn Aurray into a reliable operations manager that keeps teams aligned, accountable, and moving forward — without missing a meeting.',
    whatItDoes: [
      'Attends planning, sprint, and ops meetings on your behalf',
      'Tracks action items, owners, and deadlines',
      'Follows up automatically after meetings',
      'Generates clear summaries, decisions, and next steps',
    ],
    keyBenefits: [
      'Never miss important decisions',
      'Keeps projects on track across time zones',
      'Reduces meeting fatigue while increasing execution',
    ],
    features: [
      'Joins planning, sprint reviews, retros, and ops calls',
      'Extracts tasks, blockers, and priorities',
      'Sends follow-ups via Slack, email, or task tools',
      'Integrates with Jira, Linear, Trello, Asana, Notion',
    ],
    idealFor: ['Startup founders', 'Engineering & product teams', 'Remote and async teams'],
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: BookOpenIcon,
    title: 'Your Digital Learning & Training Assistant',
    subtitle: 'Train Once, Teach Many',
    description: 'Aurray becomes a trainer that learns once and teaches many times.',
    highlights: [
      'Onboards new hires automatically',
      'Runs training sessions and workshops',
      'Answers employee questions live',
      'Provides recordings and knowledge summaries',
    ],
    idealFor: ['Enterprises', 'Remote teams', 'Customer training'],
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Your Digital Legal & Compliance Observer',
    subtitle: 'Never Miss a Detail',
    description: 'Aurray attends sensitive meetings to ensure nothing is missed.',
    highlights: [
      'Attends board, legal, or compliance meetings',
      'Records decisions and obligations',
      'Flags risks and compliance issues',
      'Produces auditable transcripts',
    ],
    idealFor: ['Enterprises', 'Regulated industries (finance, health, legal)'],
    gradient: 'from-amber-500 to-yellow-500',
  },
];

export default function UseCasesPage() {
  const router = useRouter();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <>
      <Head>
        <title>Use Cases - Aurray</title>
        <meta name="description" content="Discover all the ways Aurray can transform how you work and collaborate." />
      </Head>

      <LandingHeader
        showAuthButtons={true}
        isAuthenticated={isAuthenticated}
        isCheckingAuth={isCheckingAuth}
        onLoginClick={() => router.push('/login')}
        onDashboardClick={() => router.push('/dashboard')}
        onEarlyAccessClick={() => router.push('/#home')}
        navItems={[
          { label: 'Home', href: '/' },
          { label: 'Features', href: '/#features' },
          { label: 'API', href: '/#api' },
          { label: 'Integrations', href: '/#integrations' },
        ]}
      />

      <main className={`min-h-screen ${isDark ? 'bg-[#0a0e1a]' : 'bg-white'}`}>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full filter blur-3xl animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full filter blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10 w-full flex flex-col items-center justify-center min-h-screen">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Discover{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Aurray's
                </span>{' '}
                Use Cases
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className={`text-xl md:text-2xl max-w-3xl mx-auto ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Explore how Aurray transforms work across industries, teams, and workflows.
              </motion.p>
            </motion.div>

            {/* Animated Scroll Down Arrow - Fixed at bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.div
                animate={{
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => {
                  const useCasesSection = document.getElementById('use-cases-grid');
                  useCasesSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span className={`text-sm font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Down here
                </span>
                <ArrowDownIcon className={`w-6 h-6 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Use Cases Grid */}
        <section id="use-cases-grid" className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative group rounded-2xl overflow-hidden border ${
                    isDark
                      ? 'bg-[#161B22] border-gray-800 hover:border-primary-500/50'
                      : 'bg-white border-gray-200 hover:border-primary-500/50 shadow-lg hover:shadow-xl'
                  } transition-all duration-300`}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                  <div className="relative p-6">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${useCase.gradient} mb-4 shadow-lg`}>
                      <useCase.icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Subtitle */}
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                      isDark ? 'text-primary-400' : 'text-primary-600'
                    }`}>
                      {useCase.subtitle}
                    </p>

                    {/* Title */}
                    <h3 className={`text-xl font-bold mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {useCase.title}
                    </h3>

                    {/* Description */}
                    <p className={`text-sm mb-4 leading-relaxed ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {useCase.description}
                    </p>

                    {/* What It Does */}
                    {useCase.whatItDoes && (
                      <div className="mb-4">
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          What it does
                        </h4>
                        <ul className="space-y-2">
                          {useCase.whatItDoes.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircleIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                isDark ? 'text-primary-400' : 'text-primary-600'
                              }`} />
                              <span className={`text-xs ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Highlights */}
                    {useCase.highlights && (
                      <div className="mb-4">
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Highlights
                        </h4>
                        <ul className="space-y-2">
                          {useCase.highlights.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircleIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                isDark ? 'text-primary-400' : 'text-primary-600'
                              }`} />
                              <span className={`text-xs ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Key Benefits */}
                    {useCase.keyBenefits && (
                      <div className="mb-4">
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Key benefits
                        </h4>
                        <ul className="space-y-2">
                          {useCase.keyBenefits.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircleIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                isDark ? 'text-primary-400' : 'text-primary-600'
                              }`} />
                              <span className={`text-xs ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Features */}
                    {useCase.features && (
                      <div className="mb-4">
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Features
                        </h4>
                        <ul className="space-y-2">
                          {useCase.features.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircleIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                isDark ? 'text-primary-400' : 'text-primary-600'
                              }`} />
                              <span className={`text-xs ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ideal For */}
                    <div className="mt-6 pt-4 border-t border-gray-800 dark:border-gray-700">
                      <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Ideal for
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {useCase.idealFor.map((item, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              isDark
                                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                                : 'bg-primary-100 text-primary-700 border border-primary-200'
                            }`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </>
  );
}

