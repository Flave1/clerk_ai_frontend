import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import {
  Conversation,
  Action,
  Room,
  ConversationFilters,
  ActionFilters,
  Meeting,
  MeetingSummary,
  MeetingConfig,
  MeetingAgentStatus,
  MeetingFilters,
} from '@/types';

// Dashboard Store
interface DashboardState {
  // Data
  conversations: Conversation[];
  actions: Action[];
  rooms: Room[];
  meetings: Meeting[];
  meetingSummaries: MeetingSummary[];
  
  // Loading states
  conversationsLoading: boolean;
  actionsLoading: boolean;
  roomsLoading: boolean;
  meetingsLoading: boolean;
  meetingSummariesLoading: boolean;
  
  // Filters
  conversationFilters: ConversationFilters;
  actionFilters: ActionFilters;
  meetingFilters: MeetingFilters;
  
  // UI state
  selectedConversationId: string | null;
  selectedActionId: string | null;
  selectedMeetingId: string | null;
  sidebarOpen: boolean;
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActions: (actions: Action[]) => void;
  setRooms: (rooms: Room[]) => void;
  setMeetings: (meetings: Meeting[]) => void;
  setMeetingSummaries: (summaries: MeetingSummary[]) => void;
  setConversationsLoading: (loading: boolean) => void;
  setActionsLoading: (loading: boolean) => void;
  setRoomsLoading: (loading: boolean) => void;
  setMeetingsLoading: (loading: boolean) => void;
  setMeetingSummariesLoading: (loading: boolean) => void;
  setConversationFilters: (filters: ConversationFilters) => void;
  setActionFilters: (filters: ActionFilters) => void;
  setMeetingFilters: (filters: MeetingFilters) => void;
  setSelectedConversationId: (id: string | null) => void;
  setSelectedActionId: (id: string | null) => void;
  setSelectedMeetingId: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Data updates
  updateConversation: (conversation: Conversation) => void;
  updateAction: (action: Action) => void;
  updateRoom: (room: Room) => void;
  updateMeeting: (meeting: Meeting) => void;
  updateMeetingSummary: (summary: MeetingSummary) => void;
  
  // Add new items
  addConversation: (conversation: Conversation) => void;
  addAction: (action: Action) => void;
  addRoom: (room: Room) => void;
  addMeeting: (meeting: Meeting) => void;
  addMeetingSummary: (summary: MeetingSummary) => void;
  
  // Remove items
  removeConversation: (id: string) => void;
  removeAction: (id: string) => void;
  removeRoom: (id: string) => void;
  removeMeeting: (id: string) => void;
  removeMeetingSummary: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      conversations: [],
      actions: [],
      rooms: [],
      meetings: [],
      meetingSummaries: [],
      conversationsLoading: false,
      actionsLoading: false,
      roomsLoading: false,
      meetingsLoading: false,
      meetingSummariesLoading: false,
      conversationFilters: {},
      actionFilters: {},
      meetingFilters: {},
      selectedConversationId: null,
      selectedActionId: null,
      selectedMeetingId: null,
      sidebarOpen: true,
      
      // Setters
      setConversations: (conversations) => set({ conversations }),
      setActions: (actions) => set({ actions }),
      setRooms: (rooms) => set({ rooms }),
      setMeetings: (meetings) => set({ meetings }),
      setMeetingSummaries: (meetingSummaries) => set({ meetingSummaries }),
      setConversationsLoading: (conversationsLoading) => set({ conversationsLoading }),
      setActionsLoading: (actionsLoading) => set({ actionsLoading }),
      setRoomsLoading: (roomsLoading) => set({ roomsLoading }),
      setMeetingsLoading: (meetingsLoading) => set({ meetingsLoading }),
      setMeetingSummariesLoading: (meetingSummariesLoading) => set({ meetingSummariesLoading }),
      setConversationFilters: (conversationFilters) => set({ conversationFilters }),
      setActionFilters: (actionFilters) => set({ actionFilters }),
      setMeetingFilters: (meetingFilters) => set({ meetingFilters }),
      setSelectedConversationId: (selectedConversationId) => set({ selectedConversationId }),
      setSelectedActionId: (selectedActionId) => set({ selectedActionId }),
      setSelectedMeetingId: (selectedMeetingId) => set({ selectedMeetingId }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      
      // Data updates
      updateConversation: (updatedConversation) => set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === updatedConversation.id ? updatedConversation : conv
        ),
      })),
      
      updateAction: (updatedAction) => set((state) => ({
        actions: state.actions.map(action =>
          action.id === updatedAction.id ? updatedAction : action
        ),
      })),
      
      updateRoom: (updatedRoom) => set((state) => ({
        rooms: state.rooms.map(room =>
          room.room_id === updatedRoom.room_id ? updatedRoom : room
        ),
      })),
      
      updateMeeting: (updatedMeeting) => set((state) => ({
        meetings: state.meetings.map(meeting =>
          meeting.id === updatedMeeting.id ? updatedMeeting : meeting
        ),
      })),
      
      updateMeetingSummary: (updatedSummary) => set((state) => ({
        meetingSummaries: state.meetingSummaries.map(summary =>
          summary.id === updatedSummary.id ? updatedSummary : summary
        ),
      })),
      
      // Add new items
      addConversation: (conversation) => set((state) => ({
        conversations: [conversation, ...state.conversations],
      })),
      
      addAction: (action) => set((state) => ({
        actions: [action, ...state.actions],
      })),
      
      addRoom: (room) => set((state) => ({
        rooms: [room, ...state.rooms],
      })),
      
      addMeeting: (meeting) => set((state) => ({
        meetings: [meeting, ...state.meetings],
      })),
      
      addMeetingSummary: (summary) => set((state) => ({
        meetingSummaries: [summary, ...state.meetingSummaries],
      })),
      
      // Remove items
      removeConversation: (id) => set((state) => ({
        conversations: state.conversations.filter(conv => conv.id !== id),
      })),
      
      removeAction: (id) => set((state) => ({
        actions: state.actions.filter(action => action.id !== id),
      })),
      
      removeRoom: (id) => set((state) => ({
        rooms: state.rooms.filter(room => room.room_id !== id),
      })),
      
      removeMeeting: (id) => set((state) => ({
        meetings: state.meetings.filter(meeting => meeting.id !== id),
      })),
      
      removeMeetingSummary: (id) => set((state) => ({
        meetingSummaries: state.meetingSummaries.filter(summary => summary.id !== id),
      })),
    })),
    {
      name: 'dashboard-store',
    }
  )
);

// WebSocket Store
interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: any;
  error: string | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setLastMessage: (message: any) => void;
  setError: (error: string | null) => void;
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set) => ({
      isConnected: false,
      isConnecting: false,
      lastMessage: null,
      error: null,
      
      setConnected: (isConnected) => set({ isConnected }),
      setConnecting: (isConnecting) => set({ isConnecting }),
      setLastMessage: (lastMessage) => set({ lastMessage }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'websocket-store',
    }
  )
);

// UI Store
interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
  }>;
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      notifications: [],
      
      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
          },
          ...state.notifications,
        ],
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(notif => notif.id !== id),
      })),
      
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'ui-store',
    }
  )
);

// Meeting Store
interface MeetingState {
  // Data
  meetings: Meeting[];
  activeMeetings: Meeting[];
  meetingSummaries: MeetingSummary[];
  meetingConfig: MeetingConfig | null;
  meetingAgentStatus: MeetingAgentStatus | null;
  
  // Loading states
  meetingsLoading: boolean;
  activeMeetingsLoading: boolean;
  summariesLoading: boolean;
  configLoading: boolean;
  statusLoading: boolean;
  
  // UI state
  selectedMeetingId: string | null;
  selectedSummaryId: string | null;
  
  // Actions
  setMeetings: (meetings: Meeting[]) => void;
  setActiveMeetings: (meetings: Meeting[]) => void;
  setMeetingSummaries: (summaries: MeetingSummary[]) => void;
  setMeetingConfig: (config: MeetingConfig) => void;
  setMeetingAgentStatus: (status: MeetingAgentStatus) => void;
  setMeetingsLoading: (loading: boolean) => void;
  setActiveMeetingsLoading: (loading: boolean) => void;
  setSummariesLoading: (loading: boolean) => void;
  setConfigLoading: (loading: boolean) => void;
  setStatusLoading: (loading: boolean) => void;
  setSelectedMeetingId: (id: string | null) => void;
  setSelectedSummaryId: (id: string | null) => void;
  
  // Data updates
  updateMeeting: (meeting: Meeting) => void;
  updateMeetingSummary: (summary: MeetingSummary) => void;
  
  // Add new items
  addMeeting: (meeting: Meeting) => void;
  addMeetingSummary: (summary: MeetingSummary) => void;
  
  // Remove items
  removeMeeting: (id: string) => void;
  removeMeetingSummary: (id: string) => void;
}

export const useMeetingStore = create<MeetingState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      meetings: [],
      activeMeetings: [],
      meetingSummaries: [],
      meetingConfig: null,
      meetingAgentStatus: null,
      meetingsLoading: false,
      activeMeetingsLoading: false,
      summariesLoading: false,
      configLoading: false,
      statusLoading: false,
      selectedMeetingId: null,
      selectedSummaryId: null,
      
      // Setters
      setMeetings: (meetings) => set({ meetings }),
      setActiveMeetings: (activeMeetings) => set({ activeMeetings }),
      setMeetingSummaries: (meetingSummaries) => set({ meetingSummaries }),
      setMeetingConfig: (meetingConfig) => set({ meetingConfig }),
      setMeetingAgentStatus: (meetingAgentStatus) => set({ meetingAgentStatus }),
      setMeetingsLoading: (meetingsLoading) => set({ meetingsLoading }),
      setActiveMeetingsLoading: (activeMeetingsLoading) => set({ activeMeetingsLoading }),
      setSummariesLoading: (summariesLoading) => set({ summariesLoading }),
      setConfigLoading: (configLoading) => set({ configLoading }),
      setStatusLoading: (statusLoading) => set({ statusLoading }),
      setSelectedMeetingId: (selectedMeetingId) => set({ selectedMeetingId }),
      setSelectedSummaryId: (selectedSummaryId) => set({ selectedSummaryId }),
      
      // Data updates
      updateMeeting: (updatedMeeting) => set((state) => ({
        meetings: state.meetings.map(meeting =>
          meeting.id === updatedMeeting.id ? updatedMeeting : meeting
        ),
        activeMeetings: state.activeMeetings.map(meeting =>
          meeting.id === updatedMeeting.id ? updatedMeeting : meeting
        ),
      })),
      
      updateMeetingSummary: (updatedSummary) => set((state) => ({
        meetingSummaries: state.meetingSummaries.map(summary =>
          summary.id === updatedSummary.id ? updatedSummary : summary
        ),
      })),
      
      // Add new items
      addMeeting: (meeting) => set((state) => ({
        meetings: [meeting, ...state.meetings],
      })),
      
      addMeetingSummary: (summary) => set((state) => ({
        meetingSummaries: [summary, ...state.meetingSummaries],
      })),
      
      // Remove items
      removeMeeting: (id) => set((state) => ({
        meetings: state.meetings.filter(meeting => meeting.id !== id),
        activeMeetings: state.activeMeetings.filter(meeting => meeting.id !== id),
      })),
      
      removeMeetingSummary: (id) => set((state) => ({
        meetingSummaries: state.meetingSummaries.filter(summary => summary.id !== id),
      })),
    })),
    {
      name: 'meeting-store',
    }
  )
);
