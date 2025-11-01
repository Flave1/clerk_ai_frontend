import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import ComingSoon from '@/components/ui/ComingSoon';
import { KeyIcon } from '@heroicons/react/24/outline';

const ApiKeysPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>API Keys - AI Receptionist</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ComingSoon 
          title="API Keys"
          description="Generate and manage your API keys for secure access."
          icon={KeyIcon}
          iconBgColor="bg-green-100 dark:bg-green-900"
          iconColor="text-green-600 dark:text-green-400"
        />
      </div>
    </>
  );
};

export default ApiKeysPage;

