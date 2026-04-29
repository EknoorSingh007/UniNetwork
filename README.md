# UniNetwork

UniNetwork is a full-stack alumni networking platform built to help university students and graduates stay connected, share opportunities, and grow together. Think of it as a focused LinkedIn — but specifically designed for your college community.

## Why We Built This

Most alumni networks rely on scattered WhatsApp groups or outdated email lists. We wanted something better — a dedicated space where students and alumni can discover each other, chat in real time, and share job/internship opportunities without the noise of general-purpose social media.

## What It Does

- **AI-Powered Discovery** — Uses profile embeddings and vector similarity search to recommend people you should connect with, based on shared skills, interests, and background.
- **Real-Time Chat** — Message your connections directly within the platform.
- **Opportunity Board** — Post and browse jobs, internships, and collaboration opportunities shared by fellow alumni.
- **Smart Onboarding** — Guided profile setup that captures your university, skills, graduation year, and more.
- **Resume Section** — Manage and showcase your resume right from your profile.
- **User Profiles** — View detailed profiles with skills, university info, and connection status.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Auth | Clerk |
| Database | PostgreSQL via Supabase |
| ORM | Prisma (with `@prisma/adapter-pg`) |
| AI / Embeddings | Mistral AI, OpenAI |
| UI | shadcn/ui, Radix UI, Tailwind CSS v4 |
| Animations | Framer Motion |
| Styling | Tailwind CSS + CSS variables for theming |

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Supabase project (for PostgreSQL + pgvector)
- Clerk account (for authentication)
- Mistral / OpenAI API keys (for the AI features)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/UniNetwork.git
   cd UniNetwork
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   DATABASE_URL=your_supabase_connection_string
   DIRECT_URL=your_supabase_direct_url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   MISTRAL_API_KEY=your_mistral_key
   OPENAI_API_KEY=your_openai_key
   ```

4. Generate the Prisma client and push the schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
UniNetwork/
├── app/
│   ├── (auth)/          # Sign-in / Sign-up pages
│   ├── (user)/          # Authenticated user pages (home, chats, connections, etc.)
│   ├── api/             # API routes (embeddings, posts, connections, chat, etc.)
│   ├── onboarding/      # New user onboarding flow
│   └── u/               # Public user profiles
├── components/          # Reusable UI components (shadcn + custom)
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions, DB client, AI helpers
├── prisma/              # Prisma schema and seed files
└── middleware.ts        # Auth middleware (Clerk)
```

## Deployment

The app is designed to be deployed on **Vercel**. Just connect your GitHub repo, set the environment variables in the Vercel dashboard, and you're good to go.

Make sure Supabase has the `pgvector` extension enabled for the AI-powered discovery features to work.

## License

This project was built as a university project and is open for learning and reference purposes.

---

## Contributors

- **Eknoor Singh**
- **Mahavir**
- **Vipul**
