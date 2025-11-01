import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import ComingSoon from '@/components/ui/ComingSoon';
import { PuzzlePieceIcon } from '@heroicons/react/24/outline';

const IntegrationsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Integrations - AI Receptionist</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ComingSoon 
          title="Integrations"
          description="Manage your connected apps and integrations in one place."
          icon={PuzzlePieceIcon}
        />
      </div>
    </>
  );
};

export default IntegrationsPage;

