/**
 * Integration Details - Comprehensive descriptions for all available integrations
 * This file serves as a centralized state manager for integration tool descriptions
 */

export interface IntegrationDetail {
  id: string;
  name: string;
  tagline: string;
  fullDescription: string;
  features: string[];
  capabilities: string[];
  useCases: string[];
  category: string;
  requiredWith?: string[]; // IDs of integrations that must be connected together
  worksWellWith?: string[]; // IDs of integrations that work well together (optional but recommended)
}

export const INTEGRATION_DETAILS: Record<string, IntegrationDetail> = {
  google_calendar: {
    id: 'google_calendar',
    name: 'Google Calendar',
    tagline: 'Seamlessly manage your schedule and never miss a meeting',
    fullDescription: 'Connect Google Calendar to Aurray and unlock powerful scheduling capabilities. Automatically sync your calendar events, create meetings directly from your conversations, and get intelligent reminders. Aurray can read your availability, schedule meetings on your behalf, and keep your calendar organized without you lifting a finger. Essential for Google Meet integration to schedule and manage video meetings.',
    features: [
      'View upcoming events and availability',
      'Create new calendar events and meetings',
      'Update existing events and reschedule meetings',
      'Delete events and manage invitations',
      'Check attendee availability',
      'Set reminders and notifications',
      'Manage multiple calendars'
    ],
    capabilities: [
      'Automatic meeting scheduling based on participant availability',
      'Smart conflict detection and resolution',
      'Recurring event management',
      'Time zone conversion and handling',
      'Calendar sharing and permissions',
      'Event color coding and categorization'
    ],
    useCases: [
      'Schedule team meetings automatically',
      'Get daily briefings of your upcoming schedule',
      'Coordinate meetings across different time zones',
      'Block out focus time automatically',
      'Sync meeting notes with calendar events'
    ],
    category: 'Productivity',
    worksWellWith: ['google_meet']
  },
  google_gmail: {
    id: 'google_gmail',
    name: 'Gmail',
    tagline: 'Intelligent email management powered by AI',
    fullDescription: 'Integrate Gmail with Aurray to transform how you handle email. Let Aurray read, compose, and send emails on your behalf. From drafting professional responses to organizing your inbox, Aurray becomes your intelligent email assistant that understands context and helps you stay on top of your communications.',
    features: [
      'Read and search emails',
      'Compose and send new emails',
      'Reply to and forward messages',
      'Organize emails with labels and filters',
      'Archive and delete messages',
      'Search through email history',
      'Manage attachments'
    ],
    capabilities: [
      'AI-powered email drafting and responses',
      'Smart inbox organization and prioritization',
      'Email summarization and key points extraction',
      'Automatic follow-up reminders',
      'Bulk email operations',
      'Email templates and signatures'
    ],
    useCases: [
      'Draft professional email responses automatically',
      'Summarize long email threads',
      'Extract action items from emails',
      'Schedule emails to send later',
      'Clean up and organize your inbox'
    ],
    category: 'Communication'
  },
  google_drive: {
    id: 'google_drive',
    name: 'Google Drive',
    tagline: 'Access and manage all your files effortlessly',
    fullDescription: 'Connect Google Drive to give Aurray access to your files and folders. Search for documents, share files with team members, and organize your storage—all through natural conversation. Aurray can help you find that one file you need, create new folders, and keep your Drive organized.',
    features: [
      'Browse and search files and folders',
      'Upload and download files',
      'Create new folders and organize content',
      'Share files and manage permissions',
      'Move and rename files',
      'Delete and restore files from trash',
      'Monitor file activity and changes'
    ],
    capabilities: [
      'Intelligent file search and retrieval',
      'Automatic file organization',
      'Bulk file operations',
      'Version history tracking',
      'Storage usage monitoring',
      'Shared drive management'
    ],
    useCases: [
      'Find files quickly using natural language',
      'Organize project files automatically',
      'Share meeting recordings with team members',
      'Backup important documents',
      'Clean up and free storage space'
    ],
    category: 'Storage'
  },
  google_docs: {
    id: 'google_docs',
    name: 'Google Docs',
    tagline: 'Create and collaborate on documents seamlessly',
    fullDescription: 'Integrate Google Docs with Aurray to streamline your document workflow. Aurray can read, create, and edit Google Docs documents, helping you draft content, take meeting notes, and collaborate with your team. From templates to formatting, Aurray makes document management effortless.',
    features: [
      'Read and access document content',
      'Create new documents from scratch',
      'Edit existing documents',
      'Format text and apply styles',
      'Add comments and suggestions',
      'Share documents with permissions',
      'Export documents in various formats'
    ],
    capabilities: [
      'Automatic meeting notes generation',
      'Document summarization',
      'Content suggestions and improvements',
      'Template-based document creation',
      'Collaborative editing support',
      'Document version tracking'
    ],
    useCases: [
      'Generate meeting notes automatically',
      'Create project proposals and reports',
      'Draft and edit team documentation',
      'Summarize long documents',
      'Convert conversations into formatted documents'
    ],
    category: 'Productivity'
  },
  google_meet: {
    id: 'google_meet',
    name: 'Google Meet',
    tagline: 'Enhanced video conferencing with AI assistance',
    fullDescription: 'Connect Google Meet to Aurray and revolutionize your video meetings. Aurray can join your meetings as a virtual assistant, take notes, record sessions, and provide real-time transcriptions. Never miss important details from your meetings again. Works seamlessly with Google Calendar to schedule and join meetings automatically.',
    features: [
      'Create instant and scheduled meetings',
      'Join meetings automatically',
      'Record meeting sessions',
      'Generate live transcriptions',
      'Access meeting attendance data',
      'Share meeting links easily',
      'Manage meeting settings and permissions'
    ],
    capabilities: [
      'AI-powered meeting note taking',
      'Automatic action item extraction',
      'Meeting summary generation',
      'Participant tracking and analytics',
      'Screen recording with highlights',
      'Real-time meeting insights'
    ],
    useCases: [
      'Record and transcribe important meetings',
      'Generate automated meeting summaries',
      'Track meeting attendance and participation',
      'Create searchable meeting archives',
      'Extract action items and follow-ups'
    ],
    category: 'Video Conferencing',
    requiredWith: ['google_calendar']
  },
  microsoft_email: {
    id: 'microsoft_email',
    name: 'Outlook Email',
    tagline: 'Professional email management with Microsoft',
    fullDescription: 'Integrate Outlook Email with Aurray for enterprise-grade email management. Aurray works seamlessly with your Outlook inbox to help you compose emails, manage conversations, and stay organized. Perfect for business users who rely on Microsoft\'s ecosystem.',
    features: [
      'Send and receive emails',
      'Organize inbox with folders',
      'Search and filter messages',
      'Manage email rules and categories',
      'Handle attachments efficiently',
      'Set up automatic replies',
      'Manage focused inbox'
    ],
    capabilities: [
      'Smart email composition',
      'Priority inbox management',
      'Email threading and conversation view',
      'Advanced search and filtering',
      'Email categorization',
      'Spam and junk mail handling'
    ],
    useCases: [
      'Manage business correspondence efficiently',
      'Create professional email responses',
      'Organize project-related emails',
      'Set up out-of-office replies',
      'Search through email archives'
    ],
    category: 'Communication'
  },
  microsoft_calendar: {
    id: 'microsoft_calendar',
    name: 'Outlook Calendar',
    tagline: 'Enterprise calendar management made simple',
    fullDescription: 'Connect Outlook Calendar to Aurray and streamline your professional scheduling. Aurray integrates deeply with Microsoft\'s calendar system to manage meetings, check availability, and coordinate with colleagues across your organization. Essential for Microsoft Teams integration to schedule and manage video meetings.',
    features: [
      'View and manage calendar events',
      'Schedule meetings with attendees',
      'Check room and resource availability',
      'Manage meeting responses',
      'Create recurring appointments',
      'Set meeting reminders',
      'Share calendar availability'
    ],
    capabilities: [
      'Meeting room booking and management',
      'Cross-organization scheduling',
      'Availability-based scheduling',
      'Meeting series management',
      'Calendar delegation',
      'Time zone awareness'
    ],
    useCases: [
      'Schedule meetings across departments',
      'Book conference rooms automatically',
      'Coordinate with external partners',
      'Manage executive calendars',
      'Set up team-wide events'
    ],
    category: 'Productivity',
    worksWellWith: ['microsoft_teams']
  },
  microsoft_contacts: {
    id: 'microsoft_contacts',
    name: 'Microsoft Contacts',
    tagline: 'Keep your professional network organized',
    fullDescription: 'Integrate Microsoft Contacts with Aurray to maintain and manage your professional relationships. Aurray can help you add new contacts, update information, and keep your network organized—all through simple conversation.',
    features: [
      'Add and edit contacts',
      'Search and filter contacts',
      'Organize contacts into groups',
      'Manage contact details and notes',
      'Import and export contacts',
      'Sync across devices',
      'Merge duplicate contacts'
    ],
    capabilities: [
      'Intelligent contact suggestions',
      'Automatic contact updates',
      'Contact grouping and tagging',
      'Birthday and anniversary reminders',
      'Contact history tracking',
      'Integration with email and calendar'
    ],
    useCases: [
      'Quickly add new business contacts',
      'Keep client information up to date',
      'Organize contacts by project or team',
      'Find contact details instantly',
      'Maintain a clean contact database'
    ],
    category: 'Productivity'
  },
  microsoft_teams: {
    id: 'microsoft_teams',
    name: 'Microsoft Teams',
    tagline: 'Collaboration and meetings unified',
    fullDescription: 'Connect Microsoft Teams to unlock powerful collaboration features with Aurray. From scheduling Teams meetings to managing channels and chats, Aurray becomes your intelligent Teams assistant that helps you stay connected with your organization. Works seamlessly with Outlook Calendar to schedule and join Teams meetings automatically.',
    features: [
      'Create and join Teams meetings',
      'Send messages in channels and chats',
      'Share files and documents',
      'Manage team channels',
      'Schedule team events',
      'Record meetings and calls',
      'Access meeting transcripts'
    ],
    capabilities: [
      'Meeting bot participation',
      'Automatic note taking',
      'Channel message monitoring',
      'File sharing automation',
      'Meeting analytics',
      'Team collaboration insights'
    ],
    useCases: [
      'Record and transcribe team meetings',
      'Automate meeting summaries',
      'Share meeting notes in channels',
      'Track team collaboration',
      'Schedule and manage recurring standups'
    ],
    category: 'Video Conferencing',
    requiredWith: ['microsoft_calendar']
  },
  microsoft_onedrive: {
    id: 'microsoft_onedrive',
    name: 'OneDrive',
    tagline: 'Cloud storage integrated with your workflow',
    fullDescription: 'Integrate OneDrive with Aurray to seamlessly manage your cloud storage. Access files, share documents, and organize your OneDrive—all through natural language commands. Aurray makes cloud storage management intuitive and effortless.',
    features: [
      'Browse and search files',
      'Upload and download documents',
      'Share files and folders',
      'Manage permissions and access',
      'Create and organize folders',
      'Monitor storage usage',
      'Restore deleted files'
    ],
    capabilities: [
      'Smart file search',
      'Automatic file organization',
      'Version history management',
      'Collaborative file editing',
      'Storage optimization',
      'Secure file sharing'
    ],
    useCases: [
      'Access work files from anywhere',
      'Share documents with team members',
      'Organize project files efficiently',
      'Backup important documents',
      'Collaborate on shared folders'
    ],
    category: 'Storage'
  },
  microsoft_sharepoint: {
    id: 'microsoft_sharepoint',
    name: 'SharePoint',
    tagline: 'Enterprise content management simplified',
    fullDescription: 'Connect SharePoint to Aurray and streamline your organization\'s content management. Access sites, documents, and lists through simple conversation. Aurray helps you navigate SharePoint\'s complexity with ease.',
    features: [
      'Access SharePoint sites and subsites',
      'Browse document libraries',
      'Search across sites',
      'Manage lists and libraries',
      'Upload and download files',
      'Share content securely',
      'Manage site permissions'
    ],
    capabilities: [
      'Cross-site content search',
      'Document library management',
      'Metadata management',
      'Site collection administration',
      'Content approval workflows',
      'Enterprise search integration'
    ],
    useCases: [
      'Find documents across multiple sites',
      'Manage team site content',
      'Organize departmental resources',
      'Access company-wide documentation',
      'Collaborate on enterprise projects'
    ],
    category: 'Storage'
  },
  microsoft_office: {
    id: 'microsoft_office',
    name: 'Microsoft Office',
    tagline: 'Work with Word, Excel, and PowerPoint effortlessly',
    fullDescription: 'Integrate Microsoft Office with Aurray to enhance your document productivity. Create, edit, and manage Word documents, Excel spreadsheets, and PowerPoint presentations through intelligent conversation.',
    features: [
      'Create and edit Word documents',
      'Work with Excel spreadsheets',
      'Manage PowerPoint presentations',
      'Format and style documents',
      'Insert tables, charts, and images',
      'Export in various formats',
      'Template-based creation'
    ],
    capabilities: [
      'Document generation from templates',
      'Data analysis in spreadsheets',
      'Presentation automation',
      'Content formatting',
      'Batch document processing',
      'Cross-application integration'
    ],
    useCases: [
      'Create reports and proposals',
      'Analyze data in spreadsheets',
      'Generate presentations automatically',
      'Format documents professionally',
      'Convert between Office formats'
    ],
    category: 'Productivity'
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    tagline: 'Team communication supercharged',
    fullDescription: 'Connect Slack to Aurray and revolutionize team communication. Send messages, create channels, and get notifications—all managed intelligently by Aurray. Keep your team connected and informed without switching contexts.',
    features: [
      'Send messages to channels and users',
      'Create and manage channels',
      'Search message history',
      'Share files and links',
      'Set reminders and notifications',
      'Manage user status',
      'Access workspace analytics'
    ],
    capabilities: [
      'Automated message posting',
      'Channel monitoring and alerts',
      'Smart message formatting',
      'File sharing automation',
      'Thread management',
      'Slash command integration'
    ],
    useCases: [
      'Post meeting summaries to channels',
      'Send automated status updates',
      'Share files with team members',
      'Create project channels',
      'Monitor important conversations'
    ],
    category: 'Communication'
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    tagline: 'All-in-one workspace for notes and docs',
    fullDescription: 'Integrate Notion with Aurray to supercharge your workspace. Create pages, update databases, and manage your knowledge base through natural conversation. Aurray makes Notion even more powerful and accessible.',
    features: [
      'Create and update pages',
      'Manage databases and tables',
      'Add notes and documentation',
      'Organize with folders and tags',
      'Share pages and workspaces',
      'Search across all content',
      'Export and backup data'
    ],
    capabilities: [
      'Automatic page generation',
      'Database management',
      'Template-based creation',
      'Cross-page linking',
      'Content organization',
      'Collaborative editing'
    ],
    useCases: [
      'Create meeting notes automatically',
      'Maintain project documentation',
      'Manage team wikis',
      'Track tasks and projects',
      'Build knowledge bases'
    ],
    category: 'Productivity'
  },
  zoom: {
    id: 'zoom',
    name: 'Zoom',
    tagline: 'Video meetings with AI-powered assistance',
    fullDescription: 'Connect Zoom to Aurray and enhance your video conferencing experience. Aurray can join your Zoom meetings, record sessions, transcribe conversations, and generate summaries—making every meeting more productive. Works with both Google Calendar and Outlook Calendar for seamless meeting scheduling.',
    features: [
      'Create instant and scheduled meetings',
      'Join meetings automatically',
      'Record video and audio',
      'Generate live transcriptions',
      'Access meeting recordings',
      'Manage meeting settings',
      'Track attendance and participants'
    ],
    capabilities: [
      'AI meeting notes',
      'Automatic transcription',
      'Meeting highlights extraction',
      'Recording management',
      'Participant analytics',
      'Action item tracking'
    ],
    useCases: [
      'Record and transcribe meetings',
      'Generate meeting summaries',
      'Extract action items automatically',
      'Build searchable meeting archives',
      'Track meeting participation'
    ],
    category: 'Video Conferencing',
    worksWellWith: ['google_calendar', 'microsoft_calendar']
  },
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    tagline: 'CRM that grows with your business',
    fullDescription: 'Integrate HubSpot with Aurray to streamline your sales and marketing operations. Sync contacts, manage deals, and track activities—all through intelligent conversation. Aurray becomes your HubSpot assistant.',
    features: [
      'Manage contacts and companies',
      'Track deals and pipelines',
      'Log activities and notes',
      'Create and update tickets',
      'Send and track emails',
      'Generate reports',
      'Manage marketing campaigns'
    ],
    capabilities: [
      'Automatic contact syncing',
      'Deal stage automation',
      'Activity logging from meetings',
      'Email tracking integration',
      'Report generation',
      'Pipeline management'
    ],
    useCases: [
      'Log meeting notes to contacts',
      'Update deal stages automatically',
      'Sync meeting participants to CRM',
      'Track sales activities',
      'Generate sales reports'
    ],
    category: 'CRM'
  },
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    tagline: 'Enterprise CRM powered by AI',
    fullDescription: 'Connect Salesforce to Aurray and unlock enterprise-grade CRM capabilities. Manage leads, opportunities, and customer data through natural conversation. Aurray makes Salesforce more accessible and powerful.',
    features: [
      'Manage leads and opportunities',
      'Track accounts and contacts',
      'Log activities and calls',
      'Update records and fields',
      'Create custom objects',
      'Generate reports and dashboards',
      'Manage sales processes'
    ],
    capabilities: [
      'Automated data entry',
      'Lead scoring integration',
      'Opportunity tracking',
      'Activity logging',
      'Custom field management',
      'Report generation'
    ],
    useCases: [
      'Log sales calls automatically',
      'Update opportunity stages',
      'Create leads from meetings',
      'Track customer interactions',
      'Generate sales forecasts'
    ],
    category: 'CRM'
  },
  github: {
    id: 'github',
    name: 'GitHub',
    tagline: 'Code collaboration made effortless',
    fullDescription: 'Integrate GitHub with Aurray to streamline your development workflow. Create issues, manage pull requests, and track repositories—all through simple conversation. Perfect for developers and engineering teams.',
    features: [
      'Create and manage issues',
      'Review and merge pull requests',
      'Manage repositories',
      'Track commits and branches',
      'Comment on code reviews',
      'Manage project boards',
      'Access repository insights'
    ],
    capabilities: [
      'Automated issue creation from meetings',
      'PR status tracking',
      'Code review assistance',
      'Repository analytics',
      'Branch management',
      'Project board updates'
    ],
    useCases: [
      'Create issues from meeting action items',
      'Track pull request status',
      'Review code changes',
      'Manage project milestones',
      'Generate development reports'
    ],
    category: 'Development'
  },
  jira: {
    id: 'jira',
    name: 'Jira',
    tagline: 'Project management for agile teams',
    fullDescription: 'Connect Jira to Aurray and supercharge your project management. Create and update issues, track sprints, and manage projects through intelligent conversation. Aurray makes Jira workflows seamless.',
    features: [
      'Create and update issues',
      'Manage sprints and backlogs',
      'Track project progress',
      'Assign tasks to team members',
      'Comment and collaborate',
      'Generate reports',
      'Manage workflows'
    ],
    capabilities: [
      'Automated issue creation',
      'Sprint planning assistance',
      'Progress tracking',
      'Workflow automation',
      'Burndown chart generation',
      'Team velocity tracking'
    ],
    useCases: [
      'Create tickets from meeting notes',
      'Update sprint progress',
      'Track team velocity',
      'Generate project reports',
      'Manage backlogs efficiently'
    ],
    category: 'Project Management'
  },
  asana: {
    id: 'asana',
    name: 'Asana',
    tagline: 'Work management for modern teams',
    fullDescription: 'Integrate Asana with Aurray to streamline task and project management. Create tasks, update projects, and track work through natural conversation. Aurray becomes your Asana productivity partner.',
    features: [
      'Create and assign tasks',
      'Manage projects and portfolios',
      'Track task progress',
      'Set deadlines and dependencies',
      'Comment and collaborate',
      'Generate status reports',
      'Manage team workload'
    ],
    capabilities: [
      'Automated task creation',
      'Project timeline management',
      'Workload balancing',
      'Status report generation',
      'Dependency tracking',
      'Team collaboration'
    ],
    useCases: [
      'Create tasks from meetings',
      'Update project status',
      'Track team workload',
      'Generate progress reports',
      'Manage project timelines'
    ],
    category: 'Project Management'
  },
  trello: {
    id: 'trello',
    name: 'Trello',
    tagline: 'Visual project boards simplified',
    fullDescription: 'Connect Trello to Aurray and make board management effortless. Create cards, update boards, and manage your Trello workspace through simple conversation. Perfect for visual task management.',
    features: [
      'Create and move cards',
      'Manage boards and lists',
      'Add labels and tags',
      'Assign members to cards',
      'Add attachments and comments',
      'Set due dates',
      'Archive and organize'
    ],
    capabilities: [
      'Automated card creation',
      'Board organization',
      'Label management',
      'Due date tracking',
      'Member assignment',
      'Activity monitoring'
    ],
    useCases: [
      'Create cards from action items',
      'Update board status',
      'Organize project workflows',
      'Track task progress',
      'Manage team boards'
    ],
    category: 'Project Management'
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    tagline: 'Payment processing and financial data',
    fullDescription: 'Integrate Stripe with Aurray to access payment information and customer data. View transactions, manage invoices, and track revenue—all through intelligent conversation. Perfect for businesses using Stripe.',
    features: [
      'View payment transactions',
      'Manage customer data',
      'Access invoice information',
      'Track revenue and metrics',
      'View subscription status',
      'Manage payment methods',
      'Generate financial reports'
    ],
    capabilities: [
      'Transaction monitoring',
      'Revenue tracking',
      'Customer insights',
      'Invoice management',
      'Subscription tracking',
      'Financial reporting'
    ],
    useCases: [
      'Check payment status',
      'View customer transactions',
      'Track monthly revenue',
      'Manage subscriptions',
      'Generate financial reports'
    ],
    category: 'Payments'
  },
  zapier: {
    id: 'zapier',
    name: 'Zapier',
    tagline: 'Connect everything and automate workflows',
    fullDescription: 'Connect Zapier to Aurray and unlock integration with 5000+ apps. Create automated workflows, trigger actions, and connect your entire tech stack—all managed through intelligent conversation.',
    features: [
      'Create and manage Zaps',
      'Connect multiple apps',
      'Trigger automated workflows',
      'Monitor Zap performance',
      'Manage multi-step workflows',
      'Access Zap history',
      'Configure app connections'
    ],
    capabilities: [
      'Workflow automation',
      'Multi-app integration',
      'Event-based triggers',
      'Data transformation',
      'Error handling',
      'Performance monitoring'
    ],
    useCases: [
      'Automate meeting follow-ups',
      'Sync data across platforms',
      'Create notification workflows',
      'Integrate disconnected tools',
      'Build custom automations'
    ],
    category: 'Automation'
  },
  airtable: {
    id: 'airtable',
    name: 'Airtable',
    tagline: 'Flexible database for any workflow',
    fullDescription: 'Integrate Airtable with Aurray to manage your bases and tables effortlessly. Create records, update data, and organize information through natural conversation. Aurray makes Airtable even more powerful.',
    features: [
      'Create and update records',
      'Manage bases and tables',
      'Filter and sort data',
      'Link records across tables',
      'Add attachments and files',
      'Collaborate with team',
      'Export and import data'
    ],
    capabilities: [
      'Automated record creation',
      'Data organization',
      'Cross-table linking',
      'View management',
      'Collaboration features',
      'Data export'
    ],
    useCases: [
      'Log meeting data to bases',
      'Track project information',
      'Manage content calendars',
      'Organize customer data',
      'Build custom workflows'
    ],
    category: 'Database'
  },
  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    tagline: 'Simple, secure file storage',
    fullDescription: 'Connect Dropbox to Aurray and manage your files seamlessly. Access, share, and organize your Dropbox content through natural language. Aurray makes cloud storage intuitive and efficient.',
    features: [
      'Browse and search files',
      'Upload and download content',
      'Share files and folders',
      'Manage permissions',
      'Create folders',
      'Monitor storage usage',
      'Restore deleted files'
    ],
    capabilities: [
      'Smart file search',
      'Automatic organization',
      'Secure sharing',
      'Version history',
      'Storage management',
      'Collaboration features'
    ],
    useCases: [
      'Access files anywhere',
      'Share large files easily',
      'Organize project files',
      'Backup important documents',
      'Collaborate on shared folders'
    ],
    category: 'Storage'
  },
  box: {
    id: 'box',
    name: 'Box',
    tagline: 'Enterprise cloud content management',
    fullDescription: 'Integrate Box with Aurray for enterprise-grade file management. Access files, manage folders, and collaborate securely—all through intelligent conversation. Perfect for organizations using Box.',
    features: [
      'Access and manage files',
      'Create and organize folders',
      'Share content securely',
      'Manage permissions and access',
      'Collaborate on files',
      'Track file activity',
      'Manage metadata'
    ],
    capabilities: [
      'Enterprise file search',
      'Secure sharing',
      'Compliance features',
      'Version control',
      'Activity tracking',
      'Metadata management'
    ],
    useCases: [
      'Access enterprise files',
      'Share documents securely',
      'Manage department content',
      'Collaborate on projects',
      'Track file access'
    ],
    category: 'Storage'
  },
  intercom: {
    id: 'intercom',
    name: 'Intercom',
    tagline: 'Customer messaging made personal',
    fullDescription: 'Connect Intercom to Aurray and enhance customer communication. Send messages, create conversations, and manage customer interactions through intelligent conversation. Perfect for customer-facing teams.',
    features: [
      'Send and receive messages',
      'Manage conversations',
      'Create and update contacts',
      'Track customer data',
      'Send targeted campaigns',
      'Manage help articles',
      'View conversation history'
    ],
    capabilities: [
      'Automated messaging',
      'Customer segmentation',
      'Conversation routing',
      'Help desk integration',
      'Analytics and reporting',
      'Campaign management'
    ],
    useCases: [
      'Send customer updates',
      'Manage support conversations',
      'Track customer interactions',
      'Create messaging campaigns',
      'Analyze customer engagement'
    ],
    category: 'Customer Support'
  },
  zendesk: {
    id: 'zendesk',
    name: 'Zendesk',
    tagline: 'Complete customer service platform',
    fullDescription: 'Integrate Zendesk with Aurray to streamline customer support. Create tickets, update requests, and manage customer service through natural conversation. Aurray becomes your support operations assistant.',
    features: [
      'Create and update tickets',
      'Manage support requests',
      'Track ticket status',
      'Assign tickets to agents',
      'Add comments and notes',
      'Generate support reports',
      'Manage SLA compliance'
    ],
    capabilities: [
      'Automated ticket creation',
      'Ticket routing and assignment',
      'Response templates',
      'SLA monitoring',
      'Support analytics',
      'Customer satisfaction tracking'
    ],
    useCases: [
      'Create tickets from conversations',
      'Update ticket status',
      'Track support metrics',
      'Manage agent workload',
      'Generate support reports'
    ],
    category: 'Customer Support'
  }
};

/**
 * Get integration detail by ID
 */
export function getIntegrationDetail(integrationId: string): IntegrationDetail | undefined {
  return INTEGRATION_DETAILS[integrationId];
}

/**
 * Check if an integration has detailed information available
 */
export function hasIntegrationDetail(integrationId: string): boolean {
  return integrationId in INTEGRATION_DETAILS;
}

