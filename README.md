# 🌌 Cinematic Personal Portfolio & Multimedia Hub

A high-performance, visually immersive web experience built with **Next.js 16**, **Tailwind CSS 4**, and **Anime.js**. This project serves as a sophisticated portfolio and media showcase, featuring cinematic transitions, dynamic backgrounds, and a curated "fanmade" and music integration.

![Banner](https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop)

## ✨ Features

- **🎬 Cinematic Transitions**: Smooth, frame-perfect page navigations powered by `anime.js` v4.
- **🎨 Tailwind CSS 4 Design System**: Utilizing the latest CSS-first configuration for lightning-fast styling and modern aesthetics.
- **🎼 Integrated Media Suite**: Dedicated music and fanmade project pages with custom visualizers and layouts.
- **🌗 Immersive UI**: Deep black aesthetics with subtle noise textures and dynamic background components.
- **🏗️ Modern Tech Stack**: Built for the future with Bun, React 19, and Next.js 16.
- **🔐 Secure & Scalable**: Integrated with Prisma for database management and NextAuth for secure access.

## 🚀 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Runtime**: [Bun](https://bun.sh/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [Shadcn UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/)
- **Animations**: [Anime.js 4](https://animejs.com/)
- **Database**: [Prisma](https://www.prisma.io/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **AI Integration**: [z-ai-web-dev-sdk](https://github.com/google-deepmind/z-ai-web-dev-sdk)

## 🛠️ Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed on your machine.
- A SQL database (PostgreSQL/SQLite) for Prisma.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/stoy109/myproject.git
   cd myproject
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="your_database_url"
   NEXTAUTH_SECRET="your_secret"
   ```

4. **Initialize Database**
   ```bash
   bun run db:push
   bun run db:generate
   ```

5. **Run Development Server**
   ```bash
   bun run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the result.

## 📁 Directory Structure

- `src/app`: Next.js App Router and global styles.
- `src/components/pages`: High-level page components (Main, Project, Music, Fanmade).
- `src/components/ui`: Reusable UI primitives (Shadcn).
- `src/components/visualizers`: Custom animation and media visualizer logic.
- `prisma`: Database schema and migration files.

## 📜 License

This project is private and for personal use.

---
Built with 🖤 by [stoy109](https://github.com/stoy109)
