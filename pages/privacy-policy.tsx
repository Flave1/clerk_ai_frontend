import { NextPage } from 'next';
import Head from 'next/head';
import { useUIStore } from '@/store';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';

const PrivacyPolicyPage: NextPage = () => {
  const { theme } = useUIStore();

  return (
    <>
      <Head>
        <title>Privacy Policy - Aurray</title>
        <meta name="description" content="Aurray Privacy Policy - Learn how we protect your data and privacy." />
        <link rel="canonical" href="https://www.aurray.co.uk/privacy-policy" />
        <meta name="robots" content="index,follow" />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content="Privacy Policy - Aurray" />
        <meta
          property="og:description"
          content="Learn how Aurray, the voice-enabled AI meeting assistant, protects your privacy, secures your data, and handles connected services like Google Workspace, Microsoft 365, Slack, and Zoom."
        />
        <meta property="og:url" content="https://www.aurray.co.uk/privacy-policy" />
        <meta property="og:site_name" content="Aurray" />
        <meta property="og:image" content="https://www.aurray.co.uk/images/logo/logo-light.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy - Aurray" />
        <meta
          name="twitter:description"
          content="Aurray's Privacy Policy explains how we collect, use, and protect your data when you use our AI meeting assistant and connect tools like Google Workspace, Microsoft 365, Slack, and Zoom."
        />
        <meta name="twitter:image" content="https://www.aurray.co.uk/images/logo/logo-light.png" />
      </Head>

      <div className={`min-h-screen transition-colors duration-200 ${
        theme === 'dark' 
          ? 'bg-[#0D1117] text-[#E5E7EB]' 
          : 'bg-[#F7FAFC] text-[#1C1C1C]'
      }`}>
        <LandingHeader
          navItems={[
            { label: 'Home', href: '/' },
            { label: 'Features', href: '/#features' },
            { label: 'API', href: '/#api' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Use Cases', href: '/use-cases' },
            { label: 'Security', href: '/security' },
          ]}
        />

        <div className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Privacy Policy</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Last updated: November 20, 2025
              </p>
            </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-6">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Welcome to Aurray (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). Aurray is a voice-enabled AI meeting assistant that joins meetings 
                on behalf of users using their own voice and personality. We are committed to protecting your privacy and 
                ensuring the security of your personal information.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                service, including our website, mobile application, and AI meeting assistant features.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                When you choose to connect your accounts, Aurray may request access to data from services such as Google Calendar, 
                Gmail and other email providers, Google Drive and Docs, Google Meet, your contacts, Microsoft Teams, OneDrive, 
                Zoom, Slack, and other integrations you explicitly enable (&quot;Connected Services&quot;). <strong>You stay in control:</strong> 
                you decide which tools to connect and what Aurray is allowed to do with them. We only access and use this 
                data to deliver the specific features you turn on (for example, scheduling and joining meetings, sending 
                follow-ups you trigger, updating tasks, and storing notes or summaries in your tools).
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                We do <strong>not</strong> sell your data, and we do <strong>not</strong> use or access your calendars, emails, 
                files, contacts, or meetings for any purpose without your consent or beyond what is necessary to provide and 
                secure the service you requested. You can revoke access at any time by disconnecting a Connected Service and may 
                request deletion of stored data as described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-4">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Account information (name, email address, phone number)</li>
                <li>Voice recordings and voice profile data</li>
                <li>Meeting preferences and settings</li>
                <li>Calendar and scheduling information</li>
                <li>Email content and metadata</li>
                <li>Integration credentials (OAuth tokens for Google Workspace, Microsoft 365, Slack, Zoom, etc.)</li>
                <li>Meeting transcripts, recordings, and summaries</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-4">2.2 Information from Third-Party Services</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                When you connect third-party services (Google Workspace, Microsoft 365, Slack, Zoom, etc.), we collect 
                information that you authorize us to access, such as:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mt-2">
                <li>Calendar events and availability</li>
                <li>Email messages and contacts</li>
                <li>Meeting links and participant information</li>
                <li>CRM data and task information</li>
                <li>File and document metadata</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Provide, maintain, and improve our AI meeting assistant service</li>
                <li>Process and manage meeting requests, scheduling, and follow-ups</li>
                <li>Generate voice responses using your voice profile and personality</li>
                <li>Transcribe, record, and summarize meetings</li>
                <li>Send email follow-ups and update tasks in connected systems</li>
                <li>Authenticate and manage integrations with third-party services</li>
                <li>Send you service-related communications and updates</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Comply with legal obligations and enforce our terms</li>
                <li>Analyze usage patterns to improve our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">4. Data Storage and Security</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Limited access to personal data on a need-to-know basis</li>
                <li>Secure storage of OAuth tokens and credentials</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                Your voice recordings, meeting transcripts, and personal data are stored securely and retained according to 
                our data retention policy. You can request deletion of your data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating our service (cloud hosting, AI processing, etc.)</li>
                <li><strong>Third-Party Integrations:</strong> With the services you connect (Google, Microsoft, Slack, Zoom) as necessary to provide functionality</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>Access:</strong> Request access to your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Disconnect Integrations:</strong> Revoke access to third-party services at any time</li>
                <li><strong>Voice Profile:</strong> Update or delete your voice profile and personality settings</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                To exercise these rights, please contact us at privacy@aurray.com or through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">7. Children's Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal 
                information from children. If you believe we have collected information from a child, please contact us 
                immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">8. International Data Transfers</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. 
                We ensure that appropriate safeguards are in place to protect your data in accordance with this Privacy Policy 
                and applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">9. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this 
                Privacy Policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mt-4">
              <p className="text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> support@aurray.co.uk<br />
                  <strong>Address:</strong> 9 Florence mansions, Vivian Avenue, London, UK<br />
                  <strong>Phone:</strong> +447885311992
                </p>
              </div>
            </section>

          </div>
        </div>
        </div>

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
      </div>
    </>
  );
};

export default PrivacyPolicyPage;

