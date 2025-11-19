import { NextPage } from 'next';
import Head from 'next/head';
import { useUIStore } from '@/store';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';

const TermsAndConditionsPage: NextPage = () => {
  const { theme } = useUIStore();

  return (
    <>
      <Head>
        <title>Terms and Conditions - Aurray</title>
        <meta name="description" content="Aurray Terms and Conditions - Read our terms of service." />
      </Head>

      <div className={`min-h-screen transition-colors duration-200 ${
        theme === 'dark' 
          ? 'bg-[#0D1117] text-[#E5E7EB]' 
          : 'bg-[#F7FAFC] text-[#1C1C1C]'
      }`}>
        <LandingHeader
          navItems={['Home', 'Features', 'How It Works', 'Integrations', 'Community', 'Contact'].map((item) => ({
            label: item,
            href: `/#${item.toLowerCase().replace(/\s+/g, '')}`,
          }))}
        />

        <div className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Terms and Conditions</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-6">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                By accessing or using Aurray ("the Service"), you agree to be bound by these Terms and Conditions 
                ("Terms"). If you disagree with any part of these Terms, you may not access or use the Service.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                Aurray is a voice-enabled AI meeting assistant that joins meetings on behalf of users using their own 
                voice and personality. The Service manages calendars, emails, CRMs, and notes; schedules meetings; 
                sends follow-ups; updates tasks; transcribes and records discussions; generates summaries; and performs 
                real-time actions across tools like Google Workspace, Microsoft 365, Slack, Zoom, and Aurray's native 
                meeting platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Aurray provides the following services:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>AI-powered meeting assistant that joins meetings on your behalf</li>
                <li>Voice synthesis using your voice profile and personality</li>
                <li>Real-time meeting transcription and recording</li>
                <li>Meeting scheduling and calendar management</li>
                <li>Email follow-ups and task management</li>
                <li>Integration with third-party services (Google Workspace, Microsoft 365, Slack, Zoom, etc.)</li>
                <li>Meeting summaries and action item extraction</li>
                <li>CRM updates and note-taking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">3. User Accounts and Registration</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                To use Aurray, you must:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Create an account with accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be at least 18 years old</li>
                <li>Have the legal authority to enter into these Terms</li>
                <li>Provide a valid voice profile and personality settings</li>
                <li>Authorize access to third-party services you wish to integrate</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                You are responsible for all activities that occur under your account. You must immediately notify us of 
                any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">4. Voice Profile and Personality</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                When you create a voice profile, you grant us permission to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Record and analyze your voice to create a voice model</li>
                <li>Use your voice model to generate speech in meetings</li>
                <li>Store your voice profile data securely</li>
                <li>Apply your personality settings to AI responses</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                You represent that you have the right to use the voice profile you provide and that it does not infringe 
                on any third-party rights. You may update or delete your voice profile at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">5. Third-Party Integrations</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Aurray integrates with various third-party services. By connecting these services, you:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Authorize Aurray to access and use data from these services</li>
                <li>Agree to comply with the terms of service of each third-party service</li>
                <li>Understand that we are not responsible for the availability or functionality of third-party services</li>
                <li>May revoke access to any integration at any time</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                We use OAuth tokens and other secure methods to access third-party services. You are responsible for 
                maintaining the security of your integration credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">6. Meeting Participation and Responsibilities</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                When Aurray joins a meeting on your behalf, you acknowledge that:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>You are responsible for all actions taken by Aurray in meetings</li>
                <li>You must inform meeting participants that an AI assistant is participating</li>
                <li>You are responsible for reviewing and approving meeting summaries and action items</li>
                <li>Aurray's responses are based on your voice profile and settings, but may not always reflect your exact intent</li>
                <li>You should review meeting transcripts and recordings before sharing or acting on them</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">7. Acceptable Use</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Impersonate another person or entity</li>
                <li>Use the Service to violate any laws or regulations</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Use the Service to send spam, phishing, or malicious content</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Share your account credentials with others</li>
                <li>Use the Service in a way that could harm, disable, or impair the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">8. Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                The Service, including its original content, features, and functionality, is owned by Aurray and protected 
                by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                You retain ownership of your voice profile, meeting recordings, transcripts, and other content you provide. 
                By using the Service, you grant us a license to use, store, and process this content solely for the purpose 
                of providing the Service to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">9. Payment and Billing</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                If you subscribe to a paid plan:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>You agree to pay all fees associated with your subscription</li>
                <li>Fees are billed in advance on a recurring basis</li>
                <li>All fees are non-refundable unless required by law</li>
                <li>We may change our pricing with 30 days' notice</li>
                <li>Failure to pay may result in suspension or termination of your account</li>
                <li>You are responsible for any taxes applicable to your use of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">10. Service Availability and Modifications</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We strive to provide reliable service but do not guarantee that the Service will be available at all times 
                or free from errors. We may:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mt-2">
                <li>Modify, suspend, or discontinue any part of the Service at any time</li>
                <li>Perform maintenance that may temporarily interrupt service</li>
                <li>Update features, functionality, or user interfaces</li>
                <li>Change pricing or subscription plans with notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND</li>
                <li>WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
                <li>WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES</li>
                <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS</li>
                <li>WE ARE NOT RESPONSIBLE FOR ACTIONS TAKEN BY AURRAY IN MEETINGS OR DECISIONS MADE BASED ON AI-GENERATED CONTENT</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">12. Indemnification</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                You agree to indemnify and hold harmless Aurray, its officers, directors, employees, and agents from any 
                claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mt-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Actions taken by Aurray in meetings on your behalf</li>
                <li>Content you provide or generate through the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">13. Termination</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We may terminate or suspend your account immediately, without prior notice, for:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Non-payment of fees</li>
                <li>Extended periods of inactivity</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                You may terminate your account at any time through your account settings. Upon termination, your access to 
                the Service will cease, and we may delete your data according to our data retention policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">14. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without 
                regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be 
                resolved through binding arbitration in accordance with the rules of [Arbitration Organization], except where 
                prohibited by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">15. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of material changes by:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mt-2">
                <li>Posting the updated Terms on this page</li>
                <li>Sending an email notification to your registered email address</li>
                <li>Displaying a notice in the Service</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                Your continued use of the Service after changes become effective constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">16. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
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

        <LandingFooter />
        </div>
      </div>
    </>
  );
};

export default TermsAndConditionsPage;

