import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import ComingSoon from '@/components/ui/ComingSoon';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const LogsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Logs - Aurray</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ComingSoon 
          title="Logs"
          description="View system logs and activity history for debugging."
          icon={DocumentTextIcon}
          iconBgColor="bg-green-100 dark:bg-green-900"
          iconColor="text-green-600 dark:text-green-400"
        />
      </div>
    </>
  );
};

export default LogsPage;

