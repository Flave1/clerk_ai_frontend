import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';
import { ClipboardIcon, RocketLaunchIcon, XMarkIcon, SparklesIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useUIStore, useAuthStore } from '@/store';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

type PlatformKey = 'aurray' | 'teams' | 'zoom' | 'google_meet';

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
		key: 'aurray',
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

const DEFAULT_VOICE_ID = 'f5HLTX707KIM4SzJYzSz';

// Map platform keys to integration IDs
const PLATFORM_TO_INTEGRATION: Record<PlatformKey, string | null> = {
	'aurray': null, // No integration needed for Aurray
	'zoom': 'zoom',
	'google_meet': 'google_workspace',
	'teams': 'microsoft_365',
};

export default function SelectMeetingPage() {
	const { theme } = useUIStore();
	const { user } = useAuth();
	const router = useRouter();
	const [loadingKey, setLoadingKey] = useState<PlatformKey | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [generated, setGenerated] = useState<{ platform: string; meeting_id: string; meeting_url: string; conversation_id?: string; meeting_ui_url?: string; message?: string } | null>(null);
	const [comingSoonModal, setComingSoonModal] = useState<{ isOpen: boolean; platformName: string; platformImage?: string; platformKey?: PlatformKey }>({
		isOpen: false,
		platformName: '',
		platformImage: undefined,
		platformKey: undefined,
	});
	const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(new Set());
	const [integrationsLoading, setIntegrationsLoading] = useState(true);

	const isDark = theme === 'dark';
	const pageBackground = isDark
		? 'from-[#05060f] via-[#0f1324] to-[#090b16]'
		: 'from-white via-[#f8fafc] to-[#eef2ff]';

	// Fetch user integrations on mount
	useEffect(() => {
		async function loadIntegrations() {
			if (!user) {
				setIntegrationsLoading(false);
				return;
			}

			try {
				const integrations = await apiClient.getConnectedIntegrations();
				const connectedIds = new Set(integrations.map((integration: any) => integration.integration_id));
				setConnectedIntegrations(connectedIds);
			} catch (error) {
				console.error('Failed to load integrations:', error);
			} finally {
				setIntegrationsLoading(false);
			}
		}

		loadIntegrations();
	}, [user]);

	// Check if a platform is installed
	function isPlatformInstalled(key: PlatformKey): boolean {
		const integrationId = PLATFORM_TO_INTEGRATION[key];
		if (!integrationId) return true; // Aurray doesn't need integration
		return connectedIntegrations.has(integrationId);
	}

	async function handleSelect(key: PlatformKey) {
		// Check if platform is installed
		if (!isPlatformInstalled(key)) {
			const platform = PLATFORMS.find((platform) => platform.key === key);
			const platformName = platform?.name || 'This service';
			setComingSoonModal({
				isOpen: true,
				platformName: platformName,
				platformImage: platform?.image,
				platformKey: key,
			});
			return;
		}

		// Check if Zoom or Google Meet (temporarily down)
		if (key === 'zoom' || key === 'google_meet') {
			const platform = PLATFORMS.find((platform) => platform.key === key);
			const platformName = platform?.name || 'This service';
			setComingSoonModal({
				isOpen: true,
				platformName: platformName,
				platformImage: platform?.image,
				platformKey: key,
			});
			return;
		}

		try {
			setLoadingKey(key);
			
			if (key === 'aurray') {
				// Use authenticated user's ID, or generate UUID as fallback
				const userId = user?.user_id || uuidv4();
				const tempRoomId = `room-${userId}`;

				// Call conversations/start endpoint for Aurray
				const res = await axios.post('/conversations/start', {
					room_id: tempRoomId,
					user_id: userId,
					meeting_platform: key,
				});
				const data = res.data;

				// Navigate directly to meeting-room
				const query = new URLSearchParams({
					meetingId: data.meeting_id || data.conversation_id,
					conversationId: data.conversation_id,
					isHost: 'true',
				});
				
				if (data.meeting_url) {
					query.set('meetingUrl', data.meeting_url);
				}
				const meetingRoomUrl = `/meeting-room?${query.toString()}`;
				
				// Open Aurray meeting in a new tab
				if (typeof window !== 'undefined') {
					window.open(meetingRoomUrl, '_blank', 'noopener,noreferrer');
				} else {
					// Fallback for non-browser environments
				router.push(meetingRoomUrl);
				}
				toast.success('Starting Aurray meeting in a new tab...');
			} else {
				// Call external meeting start endpoint instead of conversations/start
				const res = await axios.post('/conversations/start-external', {
					meeting_url: '',
					type: key,
					transcript: true,
					audio_record: false,
					video_record: false,
					voice_id: DEFAULT_VOICE_ID,
					bot_name: 'Aurray Bot',
					context_id: null,
				});
				const data = res.data || {};
				const platformConfig = PLATFORMS.find((platform) => platform.key === key);

				setGenerated({
					platform: key,
					meeting_id: data.meeting_id || '',
					meeting_url: data.meeting_url || data.meeting_ui_url || '',
					conversation_id: data.conversation_id || data.meeting_id,
					meeting_ui_url: data.meeting_ui_url,
					message: data.message,
				});
				setDialogOpen(true);
				toast.success(data.message || `${platformConfig?.name || 'Meeting'} link ready`);
			}
		} catch (e) {
			const err = e as any;
			const detail = err?.response?.data?.detail;
			const msg = typeof detail === 'string' ? detail : err?.message || 'Failed to start meeting';
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
		if (!generated) return;
		
		// If it's an Aurray meeting, navigate to meeting-room
		if (generated.platform === 'aurray' && generated.conversation_id) {
			const query = new URLSearchParams({
				meetingId: generated.meeting_id || generated.conversation_id,
				conversationId: generated.conversation_id,
				isHost: 'true',
			});
			
			if (generated.meeting_url) {
				query.set('meetingUrl', generated.meeting_url);
			}
			
			const meetingRoomUrl = `/meeting-room?${query.toString()}`;
			router.push(meetingRoomUrl);
		} else if (generated.meeting_url) {
			// For other platforms, open the meeting URL
		const resolved = resolveMeetingUrl(generated.meeting_url);
		window.open(resolved, '_blank');
		}
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

									{!isPlatformInstalled(key) && (
										<div className="absolute inset-0 z-20 flex items-end justify-end p-4">
											<span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 border border-red-500/20 backdrop-blur-sm">
												Not installed
											</span>
										</div>
									)}

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
										{PLATFORMS.find((platform) => platform.key === generated.platform)?.name || generated.platform}
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
										{PLATFORMS.find((platform) => platform.key === generated.platform) && (
											<Image
												src={PLATFORMS.find((platform) => platform.key === generated.platform)?.image}
												alt={`${PLATFORMS.find((platform) => platform.key === generated.platform)?.name} logo`}
												width={48}
												height={48}
												className="object-contain"
											/>
										)}
									</div>
									<div className="flex-1 space-y-2">
										{generated.message && (
											<p className="text-sm font-medium text-gray-800 dark:text-gray-200">{generated.message}</p>
										)}
										{!generated.message && (
											<p className="text-sm text-gray-600 dark:text-gray-400">Your meeting link is ready. Share it with your participants or launch immediately.</p>
										)}
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
									<RocketLaunchIcon className="h-5 w-5" /> Open Link
								</motion.button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Coming Soon Modal for Zoom, Google Meet, or Not Installed apps */}
			<ComingSoonModal
				featureName={comingSoonModal.platformName}
				isOpen={comingSoonModal.isOpen}
				onClose={() => setComingSoonModal({ isOpen: false, platformName: '', platformImage: undefined, platformKey: undefined })}
				title={`${comingSoonModal.platformName} ${comingSoonModal.platformKey && !isPlatformInstalled(comingSoonModal.platformKey) ? 'Not Installed' : 'Temporarily Unavailable'}`}
				message={
					comingSoonModal.platformKey && !isPlatformInstalled(comingSoonModal.platformKey) ? (
						<>
							{comingSoonModal.platformKey === 'teams' ? (
								<>
									Microsoft Teams is part of Microsoft 365. Please{' '}
									<Link href="/integrations" className="text-primary-500 hover:text-primary-600 underline font-semibold">
										go to Integrations
									</Link>
									{' '}to install Microsoft 365 integration.
								</>
							) : comingSoonModal.platformKey === 'google_meet' ? (
								<>
									Google Meet is part of Google Workspace. Please{' '}
									<Link href="/integrations" className="text-primary-500 hover:text-primary-600 underline font-semibold">
										go to Integrations
									</Link>
									{' '}to install Google Workspace integration.
								</>
							) : (
								<>
									{comingSoonModal.platformName} integration is not installed. Please{' '}
									<Link href="/integrations" className="text-primary-500 hover:text-primary-600 underline font-semibold">
										go to Integrations
									</Link>
									{' '}to install it.
								</>
							)}
						</>
					) : (
						`We recently brought down ${comingSoonModal.platformName}. We are working really hard to return it. Please use Aurray or Microsoft Teams for your meeting.`
					)
				}
				image={comingSoonModal.platformImage}
			/>
		</>
	);
}
