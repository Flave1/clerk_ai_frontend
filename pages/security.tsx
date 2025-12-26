import { NextPage } from 'next';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  KeyIcon,
  LockClosedIcon,
  DocumentCheckIcon,
  FingerPrintIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import { useUIStore } from '@/store';
import { useRouter } from 'next/router';

interface SecurityMeasure {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
}

const SecurityPage: NextPage = () => {
  const router = useRouter();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const securityMeasures: SecurityMeasure[] = [
    {
      icon: KeyIcon,
      title: 'Multi-Factor Authentication (MFA)',
      description: 'Voice verification is never used alone. Combined with OTP codes, security questions, or trusted device verification for sensitive actions.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: LockClosedIcon,
      title: 'Data Security & Encryption',
      description: 'Voice biometric data encrypted in transit and at rest. Strict role-based access controls limit who can access sensitive voice information.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: DocumentCheckIcon,
      title: 'Consent & Ethical Guidelines',
      description: 'Explicit, documented consent required before voice cloning. Clear acceptable-use policies and audit trails track all usage for accountability.',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: FingerPrintIcon,
      title: 'Digital Watermarking',
      description: 'Imperceptible watermarks and metadata embedded in generated audio to trace origin and verify authenticity, aiding misuse investigations.',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const keyPrinciples = [
    'Voice verification is never the sole authentication method',
    'All voice data is encrypted and access-controlled',
    'Explicit consent required before any voice cloning',
    'Clear audit trails for accountability',
  ];

  return (
    <>
      <Head>
        <title>Security & Fraud Prevention - Aurray | AI Meeting Assistant</title>
        <meta
          name="description"
          content="Learn how Aurray protects against fraud and impersonation with multi-factor authentication, anti-spoofing, encryption, and comprehensive security measures."
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
          onEarlyAccessClick={() => {}}
          navItems={[
            { label: 'Home', href: '/' },
            { label: 'Features', href: '/#features' },
            { label: 'API', href: '/#api' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Use Cases', href: '/use-cases' },
          ]}
        />

        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/10 to-transparent" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full filter blur-3xl animate-pulse delay-700" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block mb-6">
                <div className="p-4 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-2xl">
                  <ShieldCheckIcon className="w-16 h-16 text-primary-500" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Security &{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Fraud Prevention
                </span>
              </h1>
              <p className={`text-xl md:text-2xl mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Protecting against impersonation and fraud with industry-leading security measures
              </p>
            </motion.div>
          </div>
        </section>

        {/* Warning Banner */}
        <section className="relative py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`rounded-2xl border-2 p-6 ${
                isDark
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-orange-400' : 'text-orange-900'}`}>
                    Important Security Notice
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>
                    Voice cloning technology requires responsible use. Aurray implements multiple layers of security
                    to prevent fraud and impersonation. Always verify identity through multiple channels for sensitive
                    transactions.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Key Principles */}
        <section className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Security Principles</h2>
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Core principles that guide our security implementation
              </p>
            </motion.div>

            <div className="space-y-4 mb-12 max-w-3xl mx-auto">
              {keyPrinciples.map((principle, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    isDark
                      ? 'bg-[#161B22] border-gray-800 hover:border-primary-500/50'
                      : 'bg-white border-gray-200 hover:border-primary-500/50 shadow-sm hover:shadow-md'
                  } transition-all duration-300`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-lg">
                      <ShieldCheckIcon className="w-5 h-5 text-primary-500" />
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {principle}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Measures */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <div className="inline-block mb-6">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  isDark
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-primary-100 text-primary-600 border border-primary-200'
                }`}>
                  Security First
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Prioritized Security{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Measures
                </span>
              </h2>
              <p className={`text-lg md:text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Enterprise-grade protection with multiple layers of security to safeguard against fraud and impersonation
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {securityMeasures.map((measure, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="group relative"
                >
                  <div
                    className={`relative h-full rounded-3xl border overflow-hidden transition-all duration-500 ${
                      isDark
                        ? 'bg-gradient-to-br from-[#161B22] to-[#0D1117] border-gray-800/50 hover:border-primary-500/50'
                        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200/50 hover:border-primary-500/50 shadow-lg hover:shadow-2xl'
                    }`}
                  >
                    {/* Animated gradient overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${measure.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
                    />
                    
                    {/* Subtle glow effect */}
                    <div
                      className={`absolute -inset-[1px] bg-gradient-to-br ${measure.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10`}
                    />

                    <div className="relative p-8 lg:p-10">
                      {/* Icon with enhanced styling */}
                      <div className="mb-6 flex items-center gap-4">
                        <div
                          className={`relative p-5 rounded-2xl bg-gradient-to-br ${measure.gradient} ${
                            isDark ? 'shadow-lg shadow-primary-500/20' : 'shadow-md'
                          }`}
                        >
                          <measure.icon className="w-7 h-7 text-white" />
                          {/* Decorative corner accent */}
                          <div className={`absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br ${measure.gradient} rounded-full opacity-60 blur-sm`} />
                        </div>
                        <div className="flex-1">
                          <div className={`h-1 w-16 rounded-full bg-gradient-to-r ${measure.gradient} mb-2`} />
                          <div className={`h-0.5 w-12 rounded-full bg-gradient-to-r ${measure.gradient} opacity-60`} />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className={`text-2xl font-bold mb-4 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {measure.title}
                      </h3>

                      {/* Description */}
                      <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {measure.description}
                      </p>

                      {/* Bottom accent line */}
                      <div className={`mt-6 h-0.5 w-full bg-gradient-to-r from-transparent via-primary-500/30 to-transparent opacity-30`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Best Practices Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className={`rounded-3xl border-2 p-8 lg:p-12 ${
                isDark
                  ? 'bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-500/30'
                  : 'bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200'
              }`}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
                Best Practices for Users
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-500/20 rounded-lg">
                    <ShieldCheckIcon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Verify Identity
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Always verify identity through multiple channels for sensitive transactions. Never rely solely on
                      voice recognition.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-500/20 rounded-lg">
                    <LockClosedIcon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Protect Your Voice Data
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Keep your voice profile secure. Use strong passwords and enable multi-factor authentication on
                      your account.
                    </p>
                  </div>
                </div>
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
      </div>
    </>
  );
};

export default SecurityPage;

