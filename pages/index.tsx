import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import {
  MicrophoneIcon,
  CalendarIcon,
  CpuChipIcon,
  SpeakerWaveIcon,
  CogIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import VideoModal from '@/components/ui/VideoModal';
import EarlyAccessModal from '@/components/ui/EarlyAccessModal';
import { getCurrentUser } from '@/lib/auth';
import { useUIStore } from '@/store';

export default function Landing() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isEarlyAccessModalOpen, setIsEarlyAccessModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { theme, setTheme } = useUIStore();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const y = useTransform(scrollY, [0, 300], [0, -50]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  console.log('Landing component render - isVideoModalOpen:', isVideoModalOpen);

  useEffect(() => {
    setMounted(true);
    
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: MicrophoneIcon,
      title: 'Voice-enabled AI participation',
      description: 'Speak naturally and AI responds in real-time with context awareness.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: CalendarIcon,
      title: 'Auto-scheduling & follow-ups',
      description: 'Automatically manage your calendar and send follow-ups without lifting a finger.',
      gradient: 'from-primary-500 to-accent-500',
    },
    {
      icon: CpuChipIcon,
      title: 'Context-aware CRM updates',
      description: 'Intelligently sync meeting insights to your CRM with full context.',
      gradient: 'from-primary-400 to-accent-400',
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Real-time transcription & summaries',
      description: 'Get instant transcripts and AI-powered summaries delivered automatically.',
      gradient: 'from-rose-500 to-orange-500',
    },
    {
      icon: CogIcon,
      title: 'Integrates with Google Meet, Zoom, and Teams',
      description: 'Seamlessly join any video call platform with zero configuration.',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Connect Aurray to your workflow',
      description: 'Invite Aurray to your meeting as a participant, or integrate directly into your applications using our powerful API.',
      icon: LinkIcon,
    },
    {
      number: '02',
      title: 'Aurray listens, speaks, and records insights',
      description: 'AI participates actively, taking notes, asking questions, and contributing meaningfully.',
      icon: SparklesIcon,
    },
    {
      number: '03',
      title: 'Automatically syncs summaries and actions',
      description: 'Get detailed summaries and action items delivered to your workspace instantly.',
      icon: CheckCircleIcon,
    },
  ];

  const integrations = [
    { 
      name: 'Google Workspace', 
      tooltip: 'Automated scheduling', 
      image: '/images/integrations/google.png' 
    },
    { 
      name: 'Google Meet', 
      tooltip: 'Video conferencing', 
      image: '/images/integrations/meet.png' 
    },
    { 
      name: 'Microsoft 365', 
      tooltip: 'Calendar integration', 
      image: '/images/integrations/microsoft-office.png' 
    },
    { 
      name: 'Microsoft Teams', 
      tooltip: 'Team collaboration', 
      image: '/images/integrations/teams.png' 
    },
    { 
      name: 'Slack', 
      tooltip: 'Live voice updates', 
      image: '/images/integrations/slack.png' 
    },
    { 
      name: 'Zoom', 
      tooltip: 'Native integration', 
      image: '/images/integrations/zoom.png' 
    },
    { 
      name: 'Salesforce', 
      tooltip: 'CRM sync', 
      image: '/images/integrations/salesforce.png' 
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
    { name: 'LinkedIn', href: 'https://linkedin.com' },
    { name: 'Twitter', href: 'https://twitter.com' },
    { name: 'GitHub', href: 'https://github.com' },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Aurray - Your Voice in Every Meeting</title>
        <meta name="description" content="Aurray joins your meetings, listens, speaks, and acts — just like you." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/logo/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/images/logo/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo/logo.png" />
      </Head>

      <div className={`min-h-screen overflow-x-hidden transition-colors duration-200 ${
        theme === 'dark' 
          ? 'bg-[#0D1117] text-[#E5E7EB]' 
          : 'bg-[#F7FAFC] text-[#1C1C1C]'
      }`}>
        {/* Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className={`fixed top-0 w-full z-50 backdrop-blur-lg border-b transition-colors duration-200 ${
            theme === 'dark'
              ? 'bg-[#0D1117]/80 border-primary-500/20'
              : 'bg-white/80 border-primary-500/20'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent"
                style={theme === 'dark' ? { textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' } : undefined}
              >
                AURRAY
              </motion.div>
              <div className="hidden md:flex space-x-8">
                {['Home', 'Features', 'How It Works', 'Integrations', 'Community', 'Contact'].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => {
                        const id = item.toLowerCase().replace(/\s+/g, '');
                        scrollToSection(id);
                      }}
                      className={`transition-colors duration-200 font-medium ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
              <div className="flex items-center gap-4">
                {!isCheckingAuth && (
                  <>
                    {isAuthenticated ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-300"
                      >
                        Dashboard
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/login')}
                        className={`px-6 py-2 font-semibold hover:underline transition-all duration-300 ${
                          theme === 'dark'
                            ? 'text-white'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Login
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEarlyAccessModalOpen(true)}
                      className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-300"
                    >
                      Get Early Access
                    </motion.button>
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <SunIcon className="h-5 w-5" />
                  ) : (
                    <MoonIcon className="h-5 w-5" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.nav>

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

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Aurray joins your meetings, listens, speaks, and acts — just like you.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    console.log('Watch Demo button clicked - current state:', isVideoModalOpen);
                    console.log('Setting isVideoModalOpen to true');
                    setIsVideoModalOpen(true);
                    console.log('State set, new value should be true');
                  }}
                  className={`px-8 py-4 backdrop-blur-lg border rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <PlayIcon className="w-5 h-5" />
                  Watch Demo
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

        {/* Features Section */}
        <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Powerful Features for{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Modern Teams
                </span>
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Everything you need to make AI an integral part of your meeting workflow.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                  <div className={`relative backdrop-blur-lg border rounded-2xl p-8 h-full ${
                    theme === 'dark'
                      ? 'bg-[#161B22]/50 border-primary-500/20'
                      : 'bg-white border-primary-500/30 shadow-sm'
                  }`}>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{feature.title}</h3>
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="howitworks" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-primary-900/10 to-transparent">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                How{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  It Works
                </span>
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Three simple steps to bring AI into every meeting.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  className="relative"
                >
                  <div className={`backdrop-blur-lg border rounded-2xl p-8 h-full text-center ${
                    theme === 'dark'
                      ? 'bg-[#161B22]/50 border-primary-500/20'
                      : 'bg-white border-primary-500/30 shadow-sm'
                  }`}>
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 + 0.3, duration: 0.5, type: 'spring' }}
                      className="text-6xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent mb-4"
                    >
                      {step.number}
                    </motion.div>
                    <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{step.title}</h3>
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
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

        {/* Footer */}
        <footer id="contact" className={`relative py-16 px-4 sm:px-6 lg:px-8 border-t ${
          theme === 'dark' ? 'border-primary-500/20' : 'border-primary-500/30'
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
              <div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent mb-4"
                >
                  Aurray
                </motion.div>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Your voice in every meeting. AI-powered meeting assistance for modern teams.
                </p>
              </div>
              <div>
                <h4 className={`font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Quick Links</h4>
                <ul className="space-y-2">
                  {['Home', 'Features', 'How It Works', 'Integrations'].map((link) => (
                    <li key={link}>
                      <button
                        onClick={() => scrollToSection(link.toLowerCase().replace(' ', ''))}
                        className={`transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className={`font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Connect</h4>
                <div className="flex gap-4">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -5 }}
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-gradient-to-r hover:from-primary-500 hover:to-accent-500 transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-[#161B22] border-primary-500/20'
                          : 'bg-white border-primary-500/30 shadow-sm'
                      }`}
                    >
                      <span className={`text-xs font-bold ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>{social.name[0]}</span>
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
            <div className={`text-center pt-8 border-t ${
              theme === 'dark' ? 'border-primary-500/20' : 'border-primary-500/30'
            }`}>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Copyright © 2025 Aurray. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
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
          console.log('VideoModal onClose called');
          setIsVideoModalOpen(false);
          console.log('isVideoModalOpen set to false');
        }}
        videoUrl="https://www.youtube.com/watch?v=FbG2LXDd0js"
      />

      {/* Early Access Modal */}
      <EarlyAccessModal
        isOpen={isEarlyAccessModalOpen}
        onClose={() => setIsEarlyAccessModalOpen(false)}
      />
    </>
  );
}
