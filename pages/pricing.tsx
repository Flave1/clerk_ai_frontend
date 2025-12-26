import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
  MicrophoneIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import EarlyAccessModal from '@/components/ui/EarlyAccessModal';
import { useUIStore } from '@/store';
import { useRouter } from 'next/router';

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  annualDiscount: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badge?: string;
  features: PricingFeature[];
  cta: string;
  ctaLink?: string;
  popular?: boolean;
}

const PricingPage: NextPage = () => {
  const router = useRouter();
  const { theme } = useUIStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [isEarlyAccessModalOpen, setIsEarlyAccessModalOpen] = useState(false);
  const isDark = theme === 'dark';

  const plans: PricingPlan[] = [
    {
      name: 'Starter',
      description: 'Perfect for individuals trying Aurray - completely free',
      monthlyPrice: 0,
      annualPrice: 0,
      annualDiscount: '',
      icon: SparklesIcon,
      gradient: 'from-blue-500 to-cyan-500',
      badge: 'Free Forever',
      features: [
        { name: 'Limited Voice meeting participation', included: true },
        { name: 'Unlimited meetings', included: true },
        { name: 'Unlimited transcription', included: true },
        { name: 'Limited AI summaries', included: true },
        { name: '800 mins of storage', included: true },
        { name: 'Voice synthesis (your voice)', included: true },
        { name: 'Zoom, Google Meet, Teams integration', included: true },
        { name: 'API access', included: true },
        { name: 'Community support', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Unlimited AI summaries', included: false },
        { name: 'CRM integration', included: false },
        { name: 'Priority support', included: false },
      ],
      cta: 'Get Started Free',
      ctaLink: undefined,
    },
    {
      name: 'Professional',
      description: 'Best for growing teams and power users',
      monthlyPrice: 29,
      annualPrice: 23,
      annualDiscount: 'Save 21%',
      icon: RocketLaunchIcon,
      gradient: 'from-primary-500 to-accent-500',
      badge: 'Most Popular',
      popular: true,
      features: [
        { name: 'Voice-enabled meeting participation', included: true },
        { name: 'Unlimited meetings', included: true },
        { name: 'Unlimited transcription', included: true },
        { name: 'Unlimited AI summaries', included: true },
        { name: 'Unlimited storage', included: true },
        { name: 'Advanced meeting analytics & insights', included: true },
        { name: 'Enhanced voice customization', included: true },
        { name: 'Advanced CRM integrations (Salesforce, HubSpot)', included: true },
        { name: 'Calendar integration & scheduling', included: true },
        { name: 'Action item tracking & follow-ups', included: true },
        { name: 'Meeting recordings & transcripts', included: true },
        { name: 'API access', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Team collaboration features', included: false },
      ],
      cta: 'Start Free Trial',
      ctaLink: undefined,
    },
    {
      name: 'Business',
      description: 'For mid-size companies and departments',
      monthlyPrice: 59,
      annualPrice: 47,
      annualDiscount: 'Save 20%',
      icon: BuildingOfficeIcon,
      gradient: 'from-purple-500 to-pink-500',
      features: [
        { name: 'All Professional features', included: true },
        { name: 'Team collaboration features', included: true },
        { name: 'Advanced analytics & reporting', included: true },
        { name: 'Custom voice profiles per team member', included: true },
        { name: 'White-label options', included: true },
        { name: 'Advanced security & compliance (SOC 2, GDPR)', included: true },
        { name: 'SSO (Single Sign-On)', included: true },
        { name: 'Dedicated support channel', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Usage analytics dashboard', included: true },
        { name: 'Dedicated account manager', included: false },
        { name: '24/7 priority support', included: false },
      ],
      cta: 'Contact Sales',
      ctaLink: undefined,
    },
    {
      name: 'Enterprise',
      description: 'Custom solutions for large organizations',
      monthlyPrice: 0,
      annualPrice: 0,
      annualDiscount: '',
      icon: BuildingOfficeIcon,
      gradient: 'from-indigo-500 to-purple-500',
      features: [
        { name: 'All Business features', included: true },
        { name: 'Unlimited everything', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom SLA & uptime guarantees', included: true },
        { name: 'On-premise deployment options', included: true },
        { name: 'Custom AI model training', included: true },
        { name: 'Advanced compliance (HIPAA, etc.)', included: true },
        { name: '24/7 priority support', included: true },
        { name: 'Custom integrations & workflows', included: true },
        { name: 'Training & onboarding', included: true },
        { name: 'Volume discounts', included: true },
        { name: 'Custom pricing', included: true },
      ],
      cta: 'Contact Sales',
      ctaLink: undefined,
    },
  ];

  const keyFeatures = [
    {
      icon: MicrophoneIcon,
      title: 'Voice-Enabled Participation',
      description: 'Only platform that actively speaks in meetings using your voice',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'SOC 2, GDPR, and HIPAA compliant with advanced security',
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Deep insights into meeting performance and engagement',
    },
    {
      icon: Cog6ToothIcon,
      title: 'Powerful Integrations',
      description: 'Connect with Salesforce, HubSpot, and 50+ tools',
    },
  ];

  const faqs = [
    {
      question: 'What makes Aurray different from other meeting assistants?',
      answer: 'Aurray is the only platform that can actively speak and participate in meetings using your voice. Most competitors only transcribe meetings, but Aurray can join, listen, speak, and contribute to discussions in real-time with limited or full voice participation depending on your plan.',
    },
    {
      question: 'Is the Starter plan really free?',
      answer: 'Yes! The Starter plan is completely free forever with unlimited meetings, unlimited transcription, limited AI summaries, and 800 mins of storage. No credit card required. You can upgrade anytime for unlimited AI summaries, unlimited storage, and full voice participation.',
    },
    {
      question: 'What is the difference between Limited and Full Voice participation?',
      answer: 'The free Starter plan includes limited voice meeting participation, which means Aurray can participate but with some restrictions. Professional and Business plans include full, unlimited voice-enabled meeting participation with all features enabled.',
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges. You can also cancel anytime with no penalties.',
    },
    {
      question: 'Do you offer discounts for annual billing?',
      answer: 'Yes! Annual billing saves you 20-21% compared to monthly billing. The discount is automatically applied when you choose annual billing. For example, Professional is $29/month or $23/month when billed annually.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and ACH transfers for Enterprise customers. All payments are processed securely and encrypted.',
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'Your data remains accessible for 30 days after cancellation. You can export all your meeting transcripts, recordings, and data before your account is fully deactivated.',
    },
  ];

  return (
    <>
      <Head>
        <title>Pricing - Aurray | AI Meeting Assistant</title>
        <meta
          name="description"
          content="Choose the perfect plan for your team. Aurray offers free limited voice meeting participation, or upgrade from $23/month for unlimited meetings."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        className={`min-h-screen transition-colors duration-200 ${
          isDark ? 'bg-[#0D1117] text-[#E5E7EB]' : 'bg-[#F7FAFC] text-[#1C1C1C]'
        }`}
      >
        <LandingHeader
          showAuthButtons={true}
          isAuthenticated={false}
          isCheckingAuth={false}
          onLoginClick={() => router.push('/login')}
          onDashboardClick={() => router.push('/dashboard')}
          onEarlyAccessClick={() => setIsEarlyAccessModalOpen(true)}
          navItems={[
            { label: 'Home', href: '/' },
            { label: 'Features', href: '/#features' },
            { label: 'API', href: '/#api' },
            { label: 'Use Cases', href: '/use-cases' },
            { label: 'Security', href: '/security' },
          ]}
        />

        {/* Hero Section */}
        <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-block mb-6">
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  isDark
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-primary-100 text-primary-700 border border-primary-200'
                }`}>
                  Choose Your Plan
                </span>
              </div>
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Pricing that{' '}
                <span className="bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_ease_infinite]">
                  scales with you
                </span>
              </h1>
              <p className={`text-lg md:text-xl mb-10 max-w-2xl mx-auto ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Start free, upgrade when you're ready. No hidden fees, cancel anytime.
              </p>

              {/* Billing Toggle - Enhanced */}
              <div className="inline-flex items-center gap-3 p-1 rounded-xl border mb-12"
                style={{
                  background: isDark 
                    ? 'rgba(22, 27, 34, 0.8)' 
                    : 'rgba(247, 250, 252, 0.8)',
                  borderColor: isDark ? 'rgba(29, 162, 180, 0.2)' : 'rgba(29, 162, 180, 0.15)'
                }}
              >
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    billingCycle === 'monthly'
                      ? isDark
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-primary-500 text-white shadow-md'
                      : isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative ${
                    billingCycle === 'annual'
                      ? isDark
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-primary-500 text-white shadow-md'
                      : isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Annual
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    20%
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="relative py-8 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {plans.map((plan, index) => {
                const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
                const isEnterprise = plan.name === 'Enterprise';

                return (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`relative ${
                      plan.popular ? 'md:scale-105 md:z-10' : ''
                    }`}
                  >
                    {/* Popular Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-30">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                          plan.badge === 'Most Popular'
                            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {plan.badge === 'Most Popular' && (
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          )}
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    {/* Card */}
                    <div
                      className={`relative h-full rounded-3xl overflow-hidden transition-all duration-500 ${
                        plan.popular
                          ? isDark
                            ? 'bg-gradient-to-b from-[#1a2332] to-[#0f1620] border-2 border-primary-500/60 shadow-2xl shadow-primary-500/30'
                            : 'bg-gradient-to-b from-white to-gray-50 border-2 border-primary-500/60 shadow-2xl shadow-primary-500/20'
                          : isDark
                          ? 'bg-[#161B22] border border-gray-800/80 hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/10'
                          : 'bg-white border border-gray-200/80 hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/5'
                      }`}
                    >
                      {/* Subtle gradient accent at top */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.gradient}`} />

                      <div className="relative p-7 lg:p-8">
                        {/* Plan Name & Icon */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {plan.name}
                            </h3>
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${plan.gradient} ${
                              isDark ? 'opacity-90' : 'opacity-100'
                            }`}>
                              <plan.icon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {plan.description}
                          </p>
                        </div>

                        {/* Price Section */}
                        <div className="mb-7 pb-7 border-b border-gray-200/50 dark:border-gray-800/50">
                          {isEnterprise ? (
                            <div>
                              <div className={`text-5xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Custom
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Contact sales team
                              </div>
                            </div>
                          ) : price === 0 ? (
                            <div>
                              <div className={`text-5xl font-extrabold mb-2 bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                                Free
                              </div>
                              <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                No credit card required
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline gap-2 mb-2">
                                <span className={`text-5xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  ${price}
                                </span>
                                <span className={`text-base font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  /mo
                                </span>
                              </div>
                              {billingCycle === 'annual' && plan.annualDiscount && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20">
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    {plan.annualDiscount}
                                  </span>
                                </div>
                              )}
                              {billingCycle === 'monthly' && plan.annualPrice > 0 && (
                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  ${plan.annualPrice}/mo billed annually
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsEarlyAccessModalOpen(true)}
                          className={`w-full py-3.5 px-6 rounded-xl font-semibold mb-7 transition-all duration-300 ${
                            plan.popular
                              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/40 hover:shadow-primary-500/60'
                              : isDark
                              ? 'bg-gray-800/80 text-white hover:bg-gray-700 border border-gray-700/50'
                              : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md'
                          }`}
                        >
                          {plan.cta}
                        </motion.button>

                        {/* Features List */}
                        <div>
                          <div className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            What's Included
                          </div>
                          <div className="space-y-2.5">
                            {plan.features.map((feature, featureIndex) => (
                              <div
                                key={featureIndex}
                                className={`text-sm leading-relaxed ${
                                  feature.included
                                    ? isDark
                                      ? 'text-gray-300'
                                      : 'text-gray-700'
                                    : isDark
                                    ? 'text-gray-600 line-through opacity-60'
                                    : 'text-gray-400 line-through opacity-60'
                                }`}
                              >
                                {feature.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Built for{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  modern teams
                </span>
              </h2>
              <p className={`text-base md:text-lg max-w-2xl mx-auto ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Everything you need to transform how your team handles meetings
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {keyFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`group relative p-6 lg:p-8 rounded-2xl border transition-all duration-300 ${
                    isDark
                      ? 'bg-gradient-to-br from-[#161B22] to-[#0D1117] border-gray-800/60 hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/5'
                      : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200/60 hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20 flex-shrink-0 ${
                      isDark ? 'shadow-lg shadow-primary-500/10' : ''
                    }`}>
                      <feature.icon className="w-6 h-6 text-primary-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {feature.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Common Questions
              </h2>
              <p className={`text-base md:text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Quick answers to help you get started
              </p>
            </motion.div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className={`group p-6 lg:p-7 rounded-2xl border transition-all duration-300 ${
                    isDark
                      ? 'bg-[#161B22]/80 border-gray-800/60 hover:border-primary-500/30 hover:bg-[#161B22]'
                      : 'bg-white/80 border-gray-200/60 hover:border-primary-500/30 hover:bg-white shadow-sm hover:shadow-md'
                  }`}
                >
                  <h3 className={`text-base lg:text-lg font-bold mb-3 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {faq.question}
                  </h3>
                  <p className={`text-sm lg:text-base leading-relaxed ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`relative p-10 lg:p-12 rounded-3xl overflow-hidden text-center ${
                isDark
                  ? 'bg-gradient-to-br from-[#1a2332] to-[#0f1620] border border-primary-500/20'
                  : 'bg-gradient-to-br from-primary-50/80 to-accent-50/80 border border-primary-200/50'
              }`}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Ready to get started?
                </h2>
                <p className={`text-base md:text-lg mb-8 max-w-xl mx-auto ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Join thousands of teams using Aurray to transform their meetings. Start free, no credit card required.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsEarlyAccessModalOpen(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-semibold text-base text-white shadow-xl shadow-primary-500/40 hover:shadow-primary-500/60 transition-all duration-300"
                >
                  Get Started Free
                  <ArrowRightIcon className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        <LandingFooter
          socialLinks={[
            { name: 'LinkedIn', href: 'https://www.linkedin.com/company/auray-ai' },
          ]}
          quickLinks={[
            { label: 'Home', href: '/' },
            { label: 'Features', href: '/#features' },
            { label: 'API', href: '/#api' },
            { label: 'Integrations', href: '/#integrations' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Use Cases', href: '/use-cases' },
            { label: 'Security', href: '/security' },
            { label: 'Community', href: '/#community' },
            { label: 'Contact', href: '/#contact' },
          ]}
          showQuickLinks={true}
        />

        {/* Early Access Modal */}
        <EarlyAccessModal
          isOpen={isEarlyAccessModalOpen}
          onClose={() => setIsEarlyAccessModalOpen(false)}
        />
      </div>
    </>
  );
};

export default PricingPage;

