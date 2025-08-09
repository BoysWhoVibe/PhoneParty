# Mafia Game Website

## Overview

This project is a self-hosted online implementation of the party game Mafia, offering a modern full-stack architecture for real-time multiplayer gameplay. It encompasses all game phases from lobby management and town naming to role assignment, night/day cycles, voting, and game resolution. The core vision is to provide a smooth, reliable user experience for an online Mafia game, allowing for diverse gameplay mechanics based on user input and game specifications.

## User Preferences

Preferred communication style: Simple, everyday language.
Development approach: Make the website as personal as possible - gameplay mechanics (role assignment, voting, etc.) should only come from user's ideas and the attached game specification document. Technical implementation choices remain at developer's discretion.
UI/UX Standard: All text input fields across all game phases should support Enter key submission in addition to button clicks.
Keep everything mobile-friendly.
Maintain simple, everyday language in UI.
Focus on reliable functionality over flashy features.
Role assignment system needs flexibility: custom setups by player count + host-selectable role distributions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: In-memory storage with fallback to database persistence
- **API Design**: RESTful endpoints

### Data Storage Solutions
- **Primary Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Migration Strategy**: Drizzle Kit
- **Development Storage**: In-memory storage class
- **Session Storage**: Custom implementation (memory and database backends)

### Key Components
- **Game State Management**: Supports phases including Lobby, Town Naming, Role Assignment, Night/Day Cycles, Voting, and Game End. Features real-time player management, type-safe game actions, and polling-based state synchronization.
- **Authentication & Authorization**: UUID-based player IDs (localStorage), host privileges for game creators, 4-letter game codes for access. No traditional user accounts.
- **UI/UX Components**: Responsive, mobile-first design, live connection status, ARIA labels, keyboard navigation, toast notifications, and loading states.
- **Game Logic**: Dynamic role distribution, majority-based voting with tie-breaking, role-specific night actions, and comprehensive win conditions.

### Data Flow
- **Game Creation**: Host creates game, generates code, players join, host configures settings, game starts, roles assigned.
- **Game Phase Flow**: Structured progression through town naming, role assignment, night/day cycles, discussion, voting, and win checks.
- **Data Persistence**: Client actions via API update database, triggering client state updates on next polling cycle.

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, Wouter
- **State Management**: TanStack React Query
- **UI Components**: Radix UI, Lucide React
- **Styling**: Tailwind CSS, Class Variance Authority, clsx

### Backend Dependencies
- **Server Framework**: Express.js
- **Database**: Drizzle ORM, Neon Database driver
- **Utilities**: Nanoid, Zod
- **Development**: TSX, ESBuild

### Development Tools
- **Build System**: Vite
- **Code Quality**: TypeScript compiler, ESLint
- **Development Server**: Vite dev server with HMR
- **Database Tools**: Drizzle Kit