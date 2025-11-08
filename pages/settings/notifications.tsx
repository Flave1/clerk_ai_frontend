import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/layout/Header';
import ComingSoon from '@/components/ui/ComingSoon';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Notifications - Aurray</title>
      </Head>
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ComingSoon 
          title="Notifications"
          description="Customize your notification preferences and alerts."
          icon={BellIcon}
          iconBgColor="bg-blue-100 dark:bg-blue-900"
          iconColor="text-blue-600 dark:text-blue-400"
        />
      </div>
    </>
  );
};

export default NotificationsPage;

