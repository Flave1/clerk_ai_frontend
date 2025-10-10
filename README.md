# AI Receptionist Frontend

A modern Next.js dashboard for the AI Receptionist and Meeting Assistant system.

## Features

- 📊 **Real-time Dashboard** - Monitor conversations, actions, and system performance
- 💬 **Conversation Management** - View detailed conversation transcripts and turns
- ⚡ **Live Updates** - WebSocket integration for real-time data updates
- 🎨 **Modern UI** - Built with Tailwind CSS and Headless UI components
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: Zustand
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API
- **UI Components**: Headless UI, Heroicons
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update environment variables if needed:
```bash
# Edit .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
clerk_frontend/
├── components/           # Reusable UI components
│   ├── layout/          # Layout components (Header, Sidebar)
│   └── ui/              # Basic UI components (Buttons, Cards, etc.)
├── lib/                 # Utility libraries
│   ├── api.ts          # API client for backend communication
│   └── ws.ts           # WebSocket client
├── pages/              # Next.js pages
│   ├── conversations/  # Conversation management pages
│   ├── _app.tsx       # App wrapper with global providers
│   └── index.tsx      # Dashboard overview
├── store/              # Zustand state management
├── styles/             # Global styles and Tailwind config
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks
```

## API Integration

The frontend communicates with the backend through:

- **REST API**: For CRUD operations on conversations, actions, and rooms
- **WebSocket**: For real-time updates and live data streaming

### API Endpoints

- `GET /api/v1/conversations` - List conversations
- `GET /api/v1/conversations/:id` - Get conversation details
- `GET /api/v1/conversations/:id/turns` - Get conversation turns
- `GET /api/v1/actions` - List actions
- `GET /api/v1/actions/:id` - Get action details
- `GET /api/v1/rooms` - List rooms

### WebSocket Events

- `conversation_update` - Conversation status changes
- `action_update` - Action status changes
- `room_update` - Room participant changes

## State Management

The application uses Zustand for state management with three main stores:

1. **Dashboard Store** - Manages conversations, actions, rooms, and filters
2. **WebSocket Store** - Tracks connection status and real-time updates
3. **UI Store** - Handles theme, sidebar state, and notifications

## Styling

The application uses Tailwind CSS with custom component classes:

- `.btn` - Base button styles
- `.card` - Card container styles
- `.status-badge` - Status indicator styles

## Development Guidelines

### Code Style

- Use TypeScript for all components and utilities
- Follow React best practices with hooks
- Use Tailwind CSS for styling
- Implement proper error handling and loading states

### Component Structure

```tsx
// Component with props interface
interface ComponentProps {
  title: string;
  onAction: () => void;
}

export default function Component({ title, onAction }: ComponentProps) {
  return (
    <div className="card">
      <h2 className="text-lg font-medium">{title}</h2>
      <button onClick={onAction} className="btn-primary">
        Action
      </button>
    </div>
  );
}
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

Build the application and deploy the static files:

```bash
npm run build
npm run export  # If using static export
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
