# RTA Life - Personal Task Management App

A real-time schedule management tool that acts as your "Second Brain" - designed for busy parents to dynamically manage daily schedules based on context changes.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- Google AI API key (for Gemini)

### Environment Setup

1. Copy `.env.local` and fill in your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google AI (Gemini) Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key
```

2. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL in `supabase/schema.sql` in the SQL Editor
   - Get your project URL and anon key from Settings > API

3. Get Google AI API key:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create an API key
   - Add it to your `.env.local`

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
rta-life/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts    # AI chat endpoint with Gemini
│   │   ├── globals.css          # Tailwind + theme configuration
│   │   ├── layout.tsx           # Root layout with dark mode
│   │   └── page.tsx             # Main dashboard page
│   ├── components/
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── dashboard.tsx        # Main split-view dashboard
│   │   ├── timeline.tsx         # Task timeline component
│   │   └── chat-interface.tsx   # AI chat interface
│   └── lib/
│       ├── types.ts             # TypeScript types & Zod schemas
│       ├── utils.ts             # Utility functions
│       └── supabase/            # Supabase client setup
├── supabase/
│   └── schema.sql               # Database schema
└── .env.local                   # Environment variables
```

## 🎯 Features

### Split View UI
- **Timeline View**: Vertical list of tasks with times, categories, and status
- **Chat Interface**: Communicate with AI Commander to update schedule

### AI Commander
The AI responds to context changes and updates your schedule:
- "Son has fever" → Reschedules work, adds doctor visit
- "Working from home today" → Adjusts commute tasks
- "It's raining" → Suggests indoor activities

### Task Properties
- Time & Duration
- Priority (High/Medium/Low)
- Status (Pending/In-Progress/Completed/Cancelled)
- Category (Work/Family/Personal/Health/Errand)

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Icons**: Lucide React
- **Backend/DB**: Supabase (Auth & Postgres)
- **AI**: Google Gemini via Vercel AI SDK

## 🚢 Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

```bash
# Or deploy via CLI
npm i -g vercel
vercel
```

## 📝 License

MIT
