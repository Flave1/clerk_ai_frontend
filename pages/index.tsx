import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import {
  MicrophoneIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  BriefcaseIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import VideoModal from '@/components/ui/VideoModal';
import EarlyAccessModal from '@/components/ui/EarlyAccessModal';
import DemoMeetingModal from '@/components/ui/DemoMeetingModal';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import { getCurrentUser } from '@/lib/auth';
import { useUIStore } from '@/store';

export default function Landing() {
  const router = useRouter();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isEarlyAccessModalOpen, setIsEarlyAccessModalOpen] = useState(false);
  const [isDemoMeetingModalOpen, setIsDemoMeetingModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [audioRefs, setAudioRefs] = useState<{ [key: number]: HTMLAudioElement | null }>({});
  const { theme } = useUIStore();

  useEffect(() => {
    // Check authentication status by calling the me endpoint
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch (error) {
        // User is not authenticated
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const whyAurrayFeatures = [
    {
      icon: VideoCameraIcon,
      title: 'Attend/Join Meetings With You',
      subtitle: 'Your AI Representative',
      description: 'Let Aurray attend/join meetings with you using your voice. Joins video calls, participates in discussions.',
      detailedPoints: [
        'Speaks in your voice and style',
        'Joins Zoom, Google Meet, and Teams automatically',
        'Handles discussions with your guidance',
        'Provides Transcripts, Recordings and metadata from meetings'
      ],
      gradient: 'from-blue-500 to-cyan-500',
      image: '/images/features/attend_meetings_1.jpg',
      imageAlt: 'Aurray attending meetings on your behalf',
      audioUrl: '/moments/meeting_one_audio.mp3',
      reverse: false,
    },
    {
      icon: BriefcaseIcon,
      title: 'Your Digital Sales & Marketing Team',
      subtitle: 'Always-On Business Development',
      description: 'Transform Aurray into your dedicated sales and marketing staff. Perfect for daily standups, client calls, and team meetings with CRM integration.',
      detailedPoints: [
        'Manages sales pipeline and relationships',
        'Conducts standups and sync meetings',
        'Integrates with Salesforce, HubSpot, and email',
      ],
      gradient: 'from-primary-500 to-accent-500',
      image: '/images/features/sales_marketing_1.jpg',
      imageAlt: 'Aurray as digital sales and marketing team',
      audioUrl: '/moments/sales_demo_audio.mp3',
      reverse: true,
    },
    {
      icon: UserGroupIcon,
      title: 'Your Digital Interviewer & Hiring Assistant',
      subtitle: 'Smart Recruitment',
      description: 'Aurray can handle candidate interviews and screening calls.',
      detailedPoints: [
        'Conducts first-round interviews in your voice',
        'Asks role-specific questions',
        'Records responses and evaluates candidates',
        'Shares structured interview feedback',
      ],
      gradient: 'from-emerald-500 to-teal-500',
      image: '/images/features/customer_care_1.jpg',
      imageAlt: 'Aurray as digital interviewer and hiring assistant',
      audioUrl: '', // Add audio URL here when available
      reverse: false,
    },
  ];

  const handlePlayAudio = (index: number, audioUrl: string) => {
    // If clicking the same button, pause it (don't reset position)
    if (playingAudioIndex === index && audioRefs[index]) {
      audioRefs[index]?.pause();
      setPlayingAudioIndex(null);
      return;
    }

    // Stop any currently playing audio when switching to another
    if (playingAudioIndex !== null && playingAudioIndex !== index && audioRefs[playingAudioIndex]) {
      audioRefs[playingAudioIndex]?.pause();
      audioRefs[playingAudioIndex]!.currentTime = 0;
      setPlayingAudioIndex(null);
    }

    // Create new audio element if it doesn't exist (lazy loading - only when requested)
    if (!audioRefs[index]) {
      const audio = new Audio(audioUrl);
      audio.preload = 'none'; // Don't preload - only load when play is requested
      audio.addEventListener('ended', () => {
        setPlayingAudioIndex(null);
      });
      audio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
        setPlayingAudioIndex(null);
      });
      setAudioRefs((prev) => ({ ...prev, [index]: audio }));
      // Load and play the audio
      audio.load(); // Explicitly load when play is requested
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        setPlayingAudioIndex(null);
      });
      setPlayingAudioIndex(index);
    } else {
      // Use existing audio element - resume from where it was paused
      if (audioRefs[index]?.paused) {
        audioRefs[index]?.play().catch((error) => {
          console.error('Error playing audio:', error);
          setPlayingAudioIndex(null);
        });
        setPlayingAudioIndex(index);
      }
    }
  };

  const restApiCode = `curl https://api.aurray.co.uk/v1/meetings \\
  -H 'Content-Type: application/json' \\
  -H "x-api-key: $AURRAY_API_KEY" \\
  -d '{
    "platform": "google_meet",
    "meeting_url": "https://meet.google.com/abc-defg-hij",
    "bot_name": "Aurray Assistant"
  }'`;

  const webhooksCode = `POST /webhooks/meeting-events
{
  "event": "meeting.started",
  "meeting_id": "123e4567-e89b-12d3",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "platform": "zoom",
    "participants": 5
  }
}`;

  const sdkCode = `# Python SDK
from aurray import AurrayClient

client = AurrayClient(api_key="your-key")
meeting = client.meetings.create(
  platform="google_meet",
  meeting_url="https://meet.google.com/..."
)`;

  const integrations = [
    { 
      name: 'Meet', 
      tooltip: 'Video conferencing', 
      image: '/images/integrations/google_meet.png' 
    },
    { 
      name: 'Zoom', 
      tooltip: 'Video conferencing', 
      image: '/images/integrations/zoom.png' 
    },
    { 
      name: 'Teams', 
      tooltip: 'Video conferencing', 
      image: '/images/integrations/microsoft-teams.png' 
    },
    { 
      name: 'Salesforce', 
      tooltip: 'CRM integration', 
      image: '/images/integrations/salesforce.png' 
    },
    { 
      name: 'HubSpot', 
      tooltip: 'Sales & marketing', 
      image: 'https://www.hubspot.com/hubfs/HubSpot_Logos/HSLogo_color.svg' 
    },
    { 
      name: 'Zendesk', 
      tooltip: 'Customer support', 
      image: 'https://www.zendesk.com/favicon.ico' 
    },
    { 
      name: 'Intercom', 
      tooltip: 'Customer support', 
      image: '/images/integrations/intercom.avif' 
    },
    { 
      name: 'Freshdesk', 
      tooltip: 'Support platform', 
      image: '/images/integrations/freshdesk.png' 
    },
  ];

  const testimonials = [
    {
      quote: 'Aurray has transformed how I manage meetings. I never miss important details anymore.',
      author: 'Sarah Chen',
      role: 'Product Manager',
      company: 'TechFlow',
    },
    {
      quote: 'The AI is impressively natural. It felt like having a brilliant colleague in every meeting.',
      author: 'David Kings',
      role: 'Founder',
      company: 'Mobile Law',
    },
    {
      quote: 'Finally, an AI that actually understands context and business needs. Game changer.',
      author: 'Emily Watson',
      role: 'Sales Director',
      company: 'Enspiral',
    },
  ];

  const socialLinks = [
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/auray-ai' },
    // { name: 'X', href: 'https://x.com/auray_ai' },
    // { name: 'GitHub', href: 'https://github.com/auray-ai' },
  ];

  return (
    <>
      <Head>
        <title>Aurray – AI Meeting Assistant That Joins Calls As You</title>
        <meta
          name="description"
          content="Aurray is a voice-enabled AI meeting assistant that joins Zoom, Google Meet, and Microsoft Teams on your behalf, using your own voice and personality to listen, speak, and take action."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/logo/logo-light.png" type="image/png" />
        <link rel="shortcut icon" href="/images/logo/logo-light.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo/logo-light.png" />
        <link rel="canonical" href="https://www.aurray.co.uk/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Aurray – AI Meeting Assistant That Joins Calls As You" />
        <meta
          property="og:description"
          content="Let Aurray attend meetings for you in your own voice and personality. Join Zoom, Google Meet, and Microsoft Teams automatically with AI that listens, speaks, and follows up."
        />
        <meta property="og:url" content="https://www.aurray.co.uk/" />
        <meta property="og:site_name" content="Aurray" />
        <meta property="og:image" content="https://www.aurray.co.uk/images/logo/logo-light.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aurray – AI Meeting Assistant That Joins Calls As You" />
        <meta
          name="twitter:description"
          content="Aurray is a voice-enabled AI meeting assistant that joins meetings on your behalf, speaks in your voice, and syncs notes and actions to your tools."
        />
        <meta name="twitter:image" content="https://www.aurray.co.uk/images/logo/logo-light.png" />

        {/* Structured data */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Aurray',
              applicationCategory: 'BusinessApplication',
              description:
                'Aurray is a voice-enabled AI meeting assistant that joins meetings on your behalf, using your own voice and personality to listen, speak, and take action.',
              operatingSystem: 'Web',
              url: 'https://www.aurray.co.uk/',
              image: 'https://www.aurray.co.uk/images/logo/logo-light.png',
              publisher: {
                '@type': 'Organization',
                name: 'Aurray',
                url: 'https://www.aurray.co.uk/',
              },
            }),
          }}
        />
      </Head>

      <div className={`min-h-screen overflow-x-hidden transition-colors duration-200 ${
        theme === 'dark' 
          ? 'bg-[#0D1117] text-[#E5E7EB]' 
          : 'bg-[#F7FAFC] text-[#1C1C1C]'
      }`}>
        <LandingHeader
          showAuthButtons={true}
          isAuthenticated={isAuthenticated}
          isCheckingAuth={isCheckingAuth}
          onLoginClick={() => router.push('/login')}
          onDashboardClick={() => router.push('/dashboard')}
          onEarlyAccessClick={() => setIsEarlyAccessModalOpen(true)}
          navItems={['Home', 'Features', 'API', 'Integrations', 'Community', 'Contact'].map((item) => ({
            label: item,
            onClick: () => {
                        const id = item.toLowerCase().replace(/\s+/g, '');
                        scrollToSection(id);
            },
          }))}
        />

        {/* Hero Section */}
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/10 to-transparent" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full filter blur-3xl animate-pulse delay-700" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                Your Voice in{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Every Meeting
                </span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mb-12 max-w-3xl mx-auto"
              >
                <ul className={`text-lg md:text-xl space-y-4 text-left ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="flex items-start gap-3"
                  >
                    <MicrophoneIcon className="w-6 h-6 text-primary-500 mt-1 flex-shrink-0" />
                    <span>Aurray joins meetings, listens, speaks and acts like you OR your Digital staff.</span>
                  </motion.li>
                  {/* <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="flex items-start gap-3"
                  >
                    <DocumentTextIcon className="w-6 h-6 text-primary-500 mt-1 flex-shrink-0" />
                    <span>Provide Transcripts, Recordings and metadata from meetings</span>
                  </motion.li> */}
                  {/* <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="flex items-start gap-3"
                  >
                    <CpuChipIcon className="w-6 h-6 text-primary-500 mt-1 flex-shrink-0" />
                    <span>APIs for developers to integrate meeting data into your applications</span>
                  </motion.li> */}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEarlyAccessModalOpen(true)}
                  className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-bold text-lg shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 transition-all duration-300 flex items-center gap-2"
                >
                  Get Early Access
                  <ArrowRightIcon className="w-5 h-5" />
                </motion.button>
                {/* <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsVideoModalOpen(true);
                  }}
                  className={`px-8 py-4 backdrop-blur-lg border rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <PlayIcon className="w-5 h-5" />
                  Watch Demo
                </motion.button> */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsDemoMeetingModalOpen(true);
                  }}
                  className={`px-8 py-4 backdrop-blur-lg border rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <VideoCameraIcon className="w-5 h-5" />
                  Try Demo
                </motion.button>
              </motion.div>

              {/* Floating Mic Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mt-16"
              >
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="inline-block"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full blur-xl opacity-50" />
                    <MicrophoneIcon className="relative w-32 h-32 text-primary-500" />
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-6 h-10 border-2 rounded-full flex justify-center p-2 ${
                theme === 'dark' ? 'border-gray-400' : 'border-gray-600'
              }`}
            >
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-1 h-3 rounded-full ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                }`}
              />
            </motion.div>
          </motion.div>
        </section>

        {/* Why Aurray is Useful Section */}
        <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full filter blur-3xl animate-pulse delay-700" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              {/* <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-block mb-4"
              >
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  theme === 'dark'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-primary-100 text-primary-600 border border-primary-200'
                }`}>
                  Why Choose Aurray
                </span>
              </motion.div> */}
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Why{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Aurray
                </span>{' '}
                is Useful
              </h2>
              <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Three powerful ways Aurray transforms how you work and collaborate.
              </p>
            </div>

            <div className="space-y-20 md:space-y-28">
              {whyAurrayFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`relative ${
                    feature.reverse
                      ? 'md:flex md:flex-row-reverse md:items-center md:gap-12'
                      : 'md:flex md:flex-row md:items-center md:gap-12'
                  }`}
                >
                  {/* Content Side */}
                  <div className="flex-1 mb-12 md:mb-0">
                    <div className="relative">
                      {/* Icon with animated glow */}
                      {/* <div className="relative inline-block mb-6">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 0.8, 0.5],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl`}
                        />
                        <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                          <feature.icon className="w-8 h-8 text-white" />
                    </div>
                      </div> */}

                      {/* Subtitle */}
                      {/* <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 + 0.4 }}
                        className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                          theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
                        }`}
                      >
                        {feature.subtitle}
                      </motion.p> */}

                      {/* Title */}
                      <h3 className={`text-2xl md:text-3xl font-bold mb-4 leading-tight ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className={`text-base md:text-lg mb-6 leading-relaxed ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {feature.description}
                      </p>

                      {/* Detailed Points */}
                      <ul className="space-y-3">
                        {feature.detailedPoints.map((point, pointIndex) => (
                          <li
                            key={pointIndex}
                            className="flex items-start gap-3"
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center mt-0.5`}>
                              <CheckCircleIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-sm md:text-base ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Image Side */}
                  <div className="flex-1 relative max-w-md mx-auto">
                    <div className="relative">
                      {/* Decorative gradient circles - smaller */}
                      <div className={`absolute -top-4 -right-4 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full opacity-10 blur-3xl animate-pulse`} />
                      <div className={`absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full opacity-10 blur-3xl animate-pulse delay-700`} />
                      
                      {/* Image container */}
                      <div className="relative rounded-2xl overflow-hidden">
                        {/* Image container - smaller aspect ratio */}
                        <div className="aspect-[3/2] relative flex items-center justify-center overflow-hidden">
                          {/* Animated icon fallback - always visible as decorative element */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center p-8 w-full h-full flex flex-col items-center justify-center relative">
                              <motion.div
                                animate={{
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 5, -5, 0],
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }}
                                className={`w-24 h-24 mb-4 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-xl`}
                              >
                                <feature.icon className="w-12 h-12 text-white" />
                </motion.div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {feature.imageAlt}
                              </p>
                              {/* Decorative animated dots */}
                              <div className="absolute top-4 right-4 flex gap-2">
                                {[...Array(3)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    animate={{
                                      scale: [1, 1.2, 1],
                                      opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      delay: i * 0.2,
                                    }}
                                    className={`w-2 h-2 rounded-full bg-gradient-to-br ${feature.gradient}`}
                                  />
                                ))}
                              </div>
                              {/* Floating particles effect */}
                              {[...Array(6)].map((_, i) => (
                                <motion.div
                                  key={`particle-${i}`}
                                  className="absolute"
                                  style={{
                                    left: `${20 + i * 15}%`,
                                    top: `${30 + (i % 3) * 20}%`,
                                  }}
                                  animate={{
                                    y: [0, -20, 0],
                                    opacity: [0.3, 0.6, 0.3],
                                    scale: [0.8, 1, 0.8],
                                  }}
                                  transition={{
                                    duration: 3 + i * 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                  }}
                                >
                                  <div className={`w-1 h-1 rounded-full bg-gradient-to-br ${feature.gradient}`} />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Overlay image if provided */}
                          {feature.image && (
                            <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden">
                              <Image
                                src={feature.image}
                                alt={feature.imageAlt}
                                fill
                                className="object-cover rounded-2xl"
                                unoptimized
                              />
                              {/* Dark overlay with play button */}
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <button
                                  onClick={() => feature.audioUrl && handlePlayAudio(index, feature.audioUrl)}
                                  disabled={!feature.audioUrl}
                                  aria-label={playingAudioIndex === index ? 'Pause audio' : 'Play audio'}
                                  className={`relative flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full transition-all duration-300 border-4 ${
                                    feature.audioUrl
                                      ? 'bg-white border-white hover:scale-110 active:scale-95 cursor-pointer shadow-2xl'
                                      : 'bg-white/50 border-white/50 cursor-not-allowed opacity-50'
                                  }`}
                                >
                                  {playingAudioIndex === index ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-2 h-8 bg-gray-900 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                                      <div className="w-2 h-10 bg-gray-900 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                                      <div className="w-2 h-8 bg-gray-900 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                                    </div>
                                  ) : (
                                    <div className="bg-white rounded-full p-2">
                                      <Image
                                        src="/images/features/play-button.png"
                                        alt="Play"
                                        width={64}
                                        height={64}
                                        className="w-14 h-14 md:w-16 md:h-16 opacity-100"
                                        unoptimized
                                      />
                                    </div>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Discover More Button - Bottom Right */}
            <div className="flex justify-end mt-16">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/use-cases')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Discover other ways Aurray is Useful
                <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </section>

        {/* Aurray API for Developers Section */}
        <section id="api" className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-12"
            >
              <p className={`text-sm font-semibold uppercase tracking-wider mb-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                API for developers
              </p>
              <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Send Aurray to your meetings with our{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  API
                </span>
                {' '}or{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  SDKs
                </span>
              </h2>
              <p className={`text-base md:text-lg mb-8 max-w-3xl ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Integrate Aurray into your workflows with REST APIs, webhooks, or our ready-to-use SDKs for Python and JavaScript.
              </p>
            </motion.div>

            {/* Large API Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`rounded-3xl overflow-hidden relative ${
                theme === 'dark'
                  ? 'bg-[#161B22] border border-gray-800'
                  : 'bg-white border border-gray-200 shadow-2xl'
              }`}
            >
              {/* View Documentation Button - Top Right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute top-6 right-6 z-10"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEarlyAccessModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 transition-all duration-300 flex items-center gap-2"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  View Documentation
                </motion.button>
              </motion.div>

              <div className="p-8 md:p-12">
                {/* Main Content: Three Code Sections in One Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* REST API Code */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex-1"
                  >
                    <div className={`p-6 rounded-2xl h-full border-2 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-500/30'
                        : 'bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200'
                    }`}>
                      <div className={`text-xs font-bold mb-4 bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent`}>
                        REST API
                      </div>
                      <div className={`rounded-lg p-4 font-mono text-xs overflow-x-auto ${
                        theme === 'dark'
                          ? 'bg-[#0D1117] border border-gray-800 text-gray-300'
                          : 'bg-gray-900 text-gray-100'
                      }`}>
                        <pre className="whitespace-pre-wrap break-words">
                          <code>{restApiCode}</code>
                        </pre>
                      </div>
                    </div>
                  </motion.div>

                  {/* Webhooks Code */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex-1"
                  >
                    <div className={`p-6 rounded-2xl h-full border-2 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-500/30'
                        : 'bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200'
                    }`}>
                      <div className={`text-xs font-bold mb-4 bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent`}>
                        Webhooks
                      </div>
                      <div className={`rounded-lg p-4 font-mono text-xs overflow-x-auto ${
                        theme === 'dark'
                          ? 'bg-[#0D1117] border border-gray-800 text-gray-300'
                          : 'bg-gray-900 text-gray-100'
                      }`}>
                        <pre className="whitespace-pre-wrap break-words">
                          <code>{webhooksCode}</code>
                        </pre>
                      </div>
                    </div>
                  </motion.div>

                  {/* SDK Code Section */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex-1"
                  >
                    <div className={`p-6 rounded-2xl h-full border-2 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-500/30'
                        : 'bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200'
                    }`}>
                      <div className={`text-xs font-bold mb-4 bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent`}>
                        SDKs
                      </div>
                      <div className={`rounded-lg p-4 font-mono text-xs overflow-x-auto ${
                        theme === 'dark'
                          ? 'bg-[#0D1117] border border-gray-800 text-gray-300'
                          : 'bg-gray-900 text-gray-100'
                      }`}>
                        <pre className="whitespace-pre-wrap break-words">
                          <code>{sdkCode}</code>
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Works with{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Your Tools
                </span>
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Seamlessly integrate with the platforms you already use.
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-8">
              {integrations.map((integration, index) => {
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.1 }}
                    className="group relative"
                  >
                    <div className={`backdrop-blur-lg border rounded-2xl px-8 py-6 w-32 text-center ${
                    theme === 'dark'
                      ? 'bg-[#161B22]/50 border-primary-500/20'
                      : 'bg-white border-primary-500/30 shadow-sm'
                  }`}>
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-all duration-300 p-2 ${
                        theme === 'dark'
                          ? 'bg-white/5 group-hover:bg-white/10'
                          : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <Image
                          src={integration.image}
                          alt={integration.name}
                          width={48}
                          height={48}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <p className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                      }`}>{integration.name}</p>
                    </div>
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
                        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                      }`}>
                        {integration.tooltip}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="community" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-primary-900/10 to-transparent">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Loved by{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Early Users
                </span>
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                See what people are saying about Aurray.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  className={`backdrop-blur-lg border rounded-2xl p-8 ${
                    theme === 'dark'
                      ? 'bg-[#161B22]/50 border-primary-500/20'
                      : 'bg-white border-primary-500/30 shadow-sm'
                  }`}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className={`mb-6 italic ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>&quot;{testimonial.quote}&quot;</p>
                  <div>
                    <p className={`font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{testimonial.author}</p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-center mt-12"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEarlyAccessModalOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-bold text-lg shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                Join the Waitlist
                <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        <LandingFooter
          id="contact"
          socialLinks={socialLinks}
          quickLinks={['Home', 'Features', 'API', 'Integrations'].map((link) => ({
            label: link,
            onClick: () => scrollToSection(link.toLowerCase().replace(' ', '')),
          }))}
          showQuickLinks={true}
        />
      </div>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
        }}
        videoUrl="https://youtu.be/pFJS_9D6gQ4"
      />
      {/* Demo Meeting Modal */}
      <DemoMeetingModal
        isOpen={isDemoMeetingModalOpen}
        onClose={() => {
          setIsDemoMeetingModalOpen(false);
        }}
      />

      {/* Early Access Modal */}
      <EarlyAccessModal
        isOpen={isEarlyAccessModalOpen}
        onClose={() => setIsEarlyAccessModalOpen(false)}
      />
    </>
  );
}
