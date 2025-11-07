import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { ClipboardIcon, RocketLaunchIcon, XMarkIcon, SparklesIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useUIStore } from '@/store';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import { useRouter } from 'next/router';

type PlatformKey = 'clerk' | 'teams' | 'zoom' | 'google_meet';

interface PlatformOption {
	key: PlatformKey;
	name: string;
	image: string;
	gradient: string;
	tag?: string;
	description: string;
}

const PLATFORMS: PlatformOption[] = [
	{
		key: 'clerk',
		name: 'Aurray Meeting',
		image: '/images/logo/logo.png',
		gradient: 'from-primary-500/20 via-accent-500/10 to-transparent',
		description: 'Spin up a native Aurray environment with real-time AI note-taking, action item tracking, and automated follow-ups built in.',
	},
	{
		key: 'teams',
		name: 'Microsoft Teams',
		image: '/images/integrations/teams.png',
		gradient: 'from-[#4F46E5]/20 via-[#6366F1]/10 to-transparent',
		description: 'Generate a Teams meeting link that keeps all participants in sync with advanced note sharing and meeting intelligence.',
	},
	{
		key: 'zoom',
		name: 'Zoom',
		image: '/images/integrations/zoom.png',
		gradient: 'from-[#38BDF8]/20 via-[#0EA5E9]/10 to-transparent',
		description: 'Launch a Zoom call with embedded Aurray insights so every conversation is searchable, actionable, and archived instantly.',
	},
	{
		key: 'google_meet',
		name: 'Google Meet',
		image: '/images/integrations/meet.png',
		gradient: 'from-[#10B981]/20 via-[#34D399]/10 to-transparent',
		description: 'Create a Meet link that plugs directly into your Google Workspace with automated docs, notes, and calendar updates.',
	},
];

export default function SelectMeetingPage() {
	const { theme } = useUIStore();
	const router = useRouter();
	const [loadingKey, setLoadingKey] = useState<PlatformKey | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [generated, setGenerated] = useState<{ platform: string; meeting_id: string; meeting_url: string } | null>(null);
	const [comingSoonModal, setComingSoonModal] = useState<{ isOpen: boolean; platformName: string; platformImage?: string }>({
		isOpen: false,
		platformName: '',
		platformImage: undefined,
	});

	const isDark = theme === 'dark';
	const pageBackground = isDark
		? 'from-[#05060f] via-[#0f1324] to-[#090b16]'
		: 'from-white via-[#f8fafc] to-[#eef2ff]';
	const activePlatform = generated ? PLATFORMS.find((platform) => platform.key === (generated.platform as PlatformKey)) : undefined;

	async function handleSelect(key: PlatformKey) {
		// Check if Zoom or Google Meet (temporarily down)
		if (key === 'zoom' || key === 'google_meet') {
			const platform = PLATFORMS.find((platform) => platform.key === key);
			const platformName = platform?.name || 'This service';
			setComingSoonModal({
				isOpen: true,
				platformName: platformName,
				platformImage: platform?.image,
			});
			return;
		}

		try {
			setLoadingKey(key);
			const res = await axios.post('/meetings/generate-url', { platform: key });
			const data = res.data;
			setGenerated(data);
			setDialogOpen(true);
			toast.success(`${PLATFORMS.find((platform) => platform.key === key)?.name || 'Meeting'} link ready`);
		} catch (e) {
			const err = e as any;
			const detail = err?.response?.data?.detail;
			const msg = typeof detail === 'string' ? detail : err?.message || 'Failed to generate meeting link';
			toast.error(msg);
		} finally {
			setLoadingKey(null);
		}
	}

	const resolveMeetingUrl = (url: string) => {
		try {
			const fullUrl = new URL(url, window.location.origin);
			return fullUrl.toString();
		} catch {
			const normalized = url.startsWith('/') ? url : `/${url}`;
			return `${window.location.origin}${normalized}`;
		}
	};

	async function copyToClipboard() {
		if (!generated?.meeting_url) return;
		try {
			const resolved = resolveMeetingUrl(generated.meeting_url);
			await navigator.clipboard.writeText(resolved);
			toast.success('Meeting link copied to clipboard');
		} catch {}
	}

	function startNow() {
		if (!generated?.meeting_url) return;
		const resolved = resolveMeetingUrl(generated.meeting_url);
		window.open(resolved, '_blank');
	}

	return (
		<>
			<Head>
				<title>Select Meeting - Aurray</title>
			</Head>
			<div className={`min-h-screen w-full bg-gradient-to-br ${pageBackground} transition-colors duration-300`}>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="mb-8">
						<button
							onClick={() => router.push('/meetings')}
							className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
						>
							<ArrowLeftIcon className="h-4 w-4 mr-2" />
							Back to Meetings
						</button>
					</div>
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="mb-12"
					>
						<div className="flex flex-col text-left">
							<h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
								Start a New Meeting
							</h1>
							<p className="mt-2 text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
								Choose your preferred platform to generate a meeting link
							</p>
						</div>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
					{PLATFORMS.map(({ key, name, image, gradient, tag, description }, index) => (
							<motion.button
								key={key}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1, duration: 0.5 }}
								whileHover={{ y: -6 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => handleSelect(key)}
								disabled={loadingKey === key}
								className={`relative group w-full overflow-hidden rounded-2xl border ${
									isDark ? 'border-primary-500/10 bg-[#0f172a]/60 shadow-[0_20px_45px_-20px_rgba(8,145,178,0.45)]' : 'border-primary-500/10 bg-white/80 shadow-[0_25px_55px_-25px_rgba(59,130,246,0.45)]'
								} backdrop-blur-xl transition-all duration-500 ${
									loadingKey === key ? 'opacity-70 pointer-events-none' : 'hover:-translate-y-1 hover:shadow-2xl'
								}`}
							>
								{/* Animated gradient flare */}
								<div className="absolute inset-0 overflow-hidden">
									<div
										className={`absolute -inset-[40%] blur-3xl opacity-0 group-hover:opacity-80 transition-opacity duration-700 bg-gradient-to-br ${gradient}`}
									/>
								</div>
								
								<div className="relative z-10 flex flex-col gap-4 text-left p-8">
									<div className="flex w-full items-center justify-between gap-3">
										<div className="flex items-center gap-4">
											<div className="relative h-14 w-14 rounded-2xl bg-white/80 dark:bg-white/10 flex items-center justify-center shadow-inner">
												<Image
													src={image}
													alt={`${name} logo`}
													width={48}
													height={48}
													className="object-contain"
													priority={index === 0}
												/>
											</div>
											<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
												{name}
											</h3>
										</div>
										{tag && (
											<span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-400">
												<SparklesIcon className="h-4 w-4" />
												{tag}
											</span>
										)}
									</div>

									<p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
										{description}
									</p>

									{loadingKey === key && (
										<div className="absolute inset-0 z-20 flex items-end justify-end p-4">
											<div className="inline-flex items-center gap-2 rounded-full bg-gray-900/80 px-4 py-2 text-xs text-white shadow-lg">
												<div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
												Generating...
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
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
							onClick={() => setDialogOpen(false)}
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.92, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							transition={{ duration: 0.25 }}
							className={`relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border ${
								isDark ? 'border-primary-500/10 bg-[#0b1220]' : 'border-primary-500/10 bg-white'
							} shadow-[0_30px_70px_-35px_rgba(59,130,246,0.45)] p-6`}
						>
							<div className="absolute inset-0 opacity-60">
								<div className="absolute -inset-1 bg-gradient-to-br from-primary-500/20 via-accent-500/10 to-transparent" />
							</div>

							<div className="relative z-10 flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-primary-400">Meeting link generated</p>
									<h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
										{activePlatform?.name || generated.platform}
									</h2>
								</div>
								<button
									onClick={() => setDialogOpen(false)}
									className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
								>
									<XMarkIcon className="h-5 w-5" />
								</button>
							</div>

							<div className="relative z-10 mt-6 flex flex-col gap-5 rounded-2xl border border-primary-500/10 bg-white/70 p-5 dark:bg-white/5">
								<div className="flex items-start gap-4">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-inner dark:bg-white/10">
										{activePlatform && (
											<Image
												src={activePlatform.image}
												alt={`${activePlatform.name} logo`}
												width={48}
												height={48}
												className="object-contain"
											/>
										)}
									</div>
									<div className="flex-1">
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{activePlatform?.description}
										</p>
									</div>
								</div>
								<div className="rounded-xl border border-dashed border-primary-500/40 bg-primary-500/5 p-4">
									<div className="text-xs uppercase tracking-wide text-primary-400">Shareable link</div>
									<div className="mt-2 break-all rounded-lg bg-white/80 p-3 font-mono text-sm text-gray-700 shadow-inner dark:bg-black/40 dark:text-gray-200">
										{generated.meeting_url}
									</div>
								</div>
							</div>

							<div className="relative z-10 mt-6 flex flex-wrap items-center justify-end gap-3">
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={copyToClipboard}
									className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
								>
									<ClipboardIcon className="h-5 w-5" /> Copy Link
								</motion.button>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={startNow}
									className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-primary-600 hover:to-accent-600"
								>
									<RocketLaunchIcon className="h-5 w-5" /> Start Now
								</motion.button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Coming Soon Modal for Zoom and Google Meet */}
			<ComingSoonModal
				featureName={"Back soon"}
				isOpen={comingSoonModal.isOpen}
				onClose={() => setComingSoonModal({ isOpen: false, platformName: '', platformImage: undefined })}
				title={`${comingSoonModal.platformName} Temporarily Unavailable`}
				message={`We recently brought down ${comingSoonModal.platformName}. We are working really hard to return it. Please use Aurray or Microsoft Teams for your meeting.`}
				image={comingSoonModal.platformImage}
			/>
		</>
	);
}
