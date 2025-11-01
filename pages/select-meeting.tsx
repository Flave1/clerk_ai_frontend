import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '@/lib/axios';
import { ClipboardIcon, RocketLaunchIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SiZoom, SiGooglemeet } from 'react-icons/si';

// Microsoft Teams SVG Icon
const MicrosoftTeamsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.536 9.146c-.006 0-.004 0-.004.004v.004c0 .004-.002.003-.002.004l-.002.003h-.002l-2.58 2.582c-.008.008-.014.016-.023.023l-.007.008-.007.01-.006.014-.01.018-.015.04 0 .017v.01c0 .017 0 .012.002.022l-.002.003c0 .005 0 .01-.002.017 0 .007.004.014.007.02.004.008.004.017.01.026.003.004.005.008.008.014.006.012.012.023.02.035.006.008.013.015.02.024.004.003.006.008.01.013.01.015.024.032.037.046.009.009.017.017.026.027.012.011.027.02.04.031.01.008.018.019.03.027.018.012.038.022.058.03.01.003.016.01.026.013.008.003.018.005.027.005.01 0 .018-.004.028-.006.01-.003.017-.01.026-.014.018-.008.036-.017.053-.028.01-.007.017-.016.026-.026.011-.01.023-.02.033-.033.008-.008.014-.017.02-.026.009-.01.016-.022.021-.033.006-.012.01-.025.015-.038 0-.007.003-.013.005-.021.003-.01.005-.018.005-.029 0-.007 0-.013-.003-.02l.003-.003v-.003c.002-.01 0-.004 0-.023v-.011l-.003-.017c-.003-.012-.008-.021-.012-.035-.006-.014-.013-.025-.02-.037-.006-.01-.011-.022-.019-.031-.005-.006-.01-.012-.015-.02-.006-.008-.013-.016-.02-.024l-.04-.047c-.008-.008-.012-.015-.02-.023-.005-.006-.01-.01-.016-.016l-2.59-2.592h-.003l-.008-.006c-.009-.007-.016-.016-.025-.025-.009-.009-.017-.02-.027-.032-.01-.013-.023-.024-.034-.037-.011-.014-.026-.027-.04-.04-.014-.014-.03-.027-.047-.04-.017-.014-.037-.027-.056-.038-.01-.006-.018-.013-.028-.018-.01-.005-.02-.01-.03-.014-.013-.005-.025-.01-.04-.014-.01-.002-.016-.007-.026-.009-.01-.002-.02-.004-.03-.004h-10.92c-.638 0-1.155.516-1.155 1.154v10.918c0 .638.517 1.154 1.155 1.154h10.918c.638 0 1.154-.516 1.154-1.154V9.304c-.003-.01-.01-.018-.013-.03-.004-.013-.008-.025-.013-.04-.005-.014-.012-.024-.018-.038-.006-.013-.013-.026-.02-.038-.01-.016-.022-.028-.033-.044-.009-.01-.014-.02-.025-.03-.009-.008-.02-.015-.03-.024-.01-.008-.02-.018-.03-.025-.02-.014-.04-.027-.06-.04-.01-.006-.02-.013-.03-.02-.01-.005-.02-.01-.03-.016-.012-.005-.024-.01-.036-.015-.013-.005-.024-.01-.037-.014-.01-.003-.02-.007-.03-.01-.01-.003-.02-.004-.03-.006-.01-.002-.02-.003-.03-.003z"/>
  </svg>
);

type PlatformKey = 'clerk' | 'teams' | 'zoom' | 'google_meet';

const PLATFORMS: Array<{ key: PlatformKey; name: string; icon: any; color: string; gradient: string }> = [
	{ key: 'clerk', name: 'Auray Meeting', icon: null, color: '#5f5fff', gradient: 'from-purple-500 to-indigo-500' },
	{ key: 'teams', name: 'Teams Meeting', icon: MicrosoftTeamsIcon, color: '#6264A7', gradient: 'from-purple-500 to-indigo-500' },
	{ key: 'zoom', name: 'Zoom Meeting', icon: SiZoom, color: '#2D8CFF', gradient: 'from-blue-500 to-cyan-500' },
	{ key: 'google_meet', name: 'Google Meet', icon: SiGooglemeet, color: '#00832D', gradient: 'from-green-500 to-emerald-500' },
];

export default function SelectMeetingPage() {
	const router = useRouter();
	const [loadingKey, setLoadingKey] = useState<PlatformKey | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [generated, setGenerated] = useState<{ platform: string; meeting_id: string; meeting_url: string } | null>(null);

	async function handleSelect(key: PlatformKey) {
		try {
			setLoadingKey(key);
			const res = await axios.post('/meetings/generate-url', { platform: key });
			const data = res.data;
			setGenerated(data);
			setDialogOpen(true);
		} catch (e) {
			const err = e as any;
			const msg = err?.response?.data?.detail || err?.message || 'Failed to generate URL';
			alert(msg);
		} finally {
			setLoadingKey(null);
		}
	}

	async function copyToClipboard() {
		if (!generated?.meeting_url) return;
		try {
			await navigator.clipboard.writeText(generated.meeting_url);
		} catch {}
	}

	function startNow() {
		if (!generated?.meeting_url) return;
		window.open(generated.meeting_url, '_blank');
	}

	return (
		<>
			<Head>
				<title>Select Meeting - AI Receptionist</title>
			</Head>
			<div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-12">
				<div className="max-w-5xl w-full">
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="text-center mb-12"
					>
						<h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
							Start a New Meeting
						</h1>
						<p className="text-xl text-gray-600 dark:text-gray-400">
							Choose your preferred platform to generate a meeting link
						</p>
					</motion.div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
						{PLATFORMS.map(({ key, name, icon: Icon, gradient }, index) => (
							<motion.button
								key={key}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1, duration: 0.5 }}
								whileHover={{ scale: 1.05, y: -5 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => handleSelect(key)}
								disabled={loadingKey === key}
								className={`relative group w-full p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 text-center overflow-hidden ${
									loadingKey === key ? 'opacity-70 pointer-events-none' : ''
								}`}
							>
								{/* Gradient overlay on hover */}
								<div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
								
								<div className="relative z-10">
									{Icon ? (
										<div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
											<Icon className="w-8 h-8 text-white" />
										</div>
									) : (
										<div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
											<span className="text-2xl font-bold text-white">C</span>
										</div>
									)}
									<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{name}</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">Click to generate</p>
									
									{loadingKey === key && (
										<div className="mt-4">
											<div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
												<div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
												<span className="text-xs text-gray-600 dark:text-gray-400">Generating...</span>
											</div>
										</div>
									)}
								</div>
							</motion.button>
						))}
					</div>
				</div>
			</div>

			<AnimatePresence>
				{dialogOpen && generated && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
							onClick={() => setDialogOpen(false)}
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							transition={{ duration: 0.3 }}
							className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl p-6"
						>
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meeting Ready!</h2>
								<button 
									onClick={() => setDialogOpen(false)} 
									className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
								>
									<XMarkIcon className="h-5 w-5 text-gray-500" />
								</button>
							</div>
							
							<div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 mb-6 border border-purple-200 dark:border-purple-900">
								<div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Generated {generated.platform} link:</div>
								<div className="text-sm text-gray-600 dark:text-gray-400 break-all font-mono bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
									{generated.meeting_url}
								</div>
							</div>

							<div className="flex items-center justify-end gap-3">
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={copyToClipboard} 
									className="inline-flex items-center px-5 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
								>
									<ClipboardIcon className="h-5 w-5 mr-2" /> Copy Link
								</motion.button>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={startNow} 
									className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg"
								>
									<RocketLaunchIcon className="h-5 w-5 mr-2" /> Start Now
								</motion.button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	);
}
