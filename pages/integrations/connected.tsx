import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import ComingSoon from '@/components/ui/ComingSoon';
import { LinkIcon } from '@heroicons/react/24/outline';

const ConnectedAppsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Connected Apps - AI Receptionist</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ComingSoon 
          title="Connected Apps"
          description="View and manage all your connected applications and services."
          icon={LinkIcon}
        />
      </div>
    </>
  );
};

export default ConnectedAppsPage;

