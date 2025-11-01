import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import ComingSoon from '@/components/ui/ComingSoon';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const ProfilePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Profile - AI Receptionist</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ComingSoon 
          title="Profile"
          description="Manage your profile information and personal details."
          icon={UserCircleIcon}
          iconBgColor="bg-blue-100 dark:bg-blue-900"
          iconColor="text-blue-600 dark:text-blue-400"
        />
      </div>
    </>
  );
};

export default ProfilePage;

