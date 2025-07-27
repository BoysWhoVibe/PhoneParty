# Mafia Game Website

## Overview

This is a self-hosted online implementation of the party game Mafia, built with a modern full-stack architecture. The application supports multiple game phases including lobby management, town naming, role assignment, night/day cycles, voting, and game resolution. It's designed to handle real-time multiplayer gameplay with a focus on smooth user experience and reliable state management.

**Current Status**: Core lobby functionality is complete and tested. Players can create games with 4-letter codes, join lobbies, add test players for development, and successfully start games. The system transitions properly between game phases and supports both host-driven and player-voting town naming modes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: In-memory storage with fallback to database persistence
- **API Design**: RESTful endpoints with consistent error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database serverless
- **ORM**: Drizzle ORM with TypeScript-first schema definitions
- **Migration Strategy**: Drizzle Kit for database migrations
- **Development Storage**: In-memory storage class for rapid development
- **Session Storage**: Custom implementation supporting both memory and database backends

## Key Components

### Game State Management
- **Game Phases**: Lobby → Town Naming → Role Assignment → Night/Day Cycles → Voting → Game End
- **Player Management**: Real-time connection status tracking, host privileges, and role assignments
- **Action System**: Type-safe game actions with phase-specific validation
- **State Synchronization**: Polling-based updates every 2 seconds for real-time feel

### Authentication & Authorization
- **Player Identification**: UUID-based player IDs stored in localStorage
- **Host Privileges**: First player to create a game becomes host with special permissions
- **Game Access**: 4-letter game codes for joining games
- **No Traditional Auth**: Simplified flow without user accounts or passwords

### UI/UX Components
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Real-time Updates**: Live connection status indicators and game state polling
- **Accessibility**: ARIA labels and keyboard navigation support via Radix UI
- **Toast Notifications**: User feedback for actions and errors
- **Loading States**: Skeleton components and loading indicators

### Game Logic Implementation
- **Role Assignment**: Dynamic role distribution based on player count
- **Voting System**: Majority-based elimination with tie-breaking
- **Night Actions**: Role-specific abilities (Sheriff investigate, Doctor heal, etc.)
- **Win Conditions**: Town vs Mafia vs Neutral role victory conditions
- **Timer System**: Configurable time limits for phases

## Data Flow

### Game Creation Flow
1. Host creates game → generates 4-letter code → receives host privileges
2. Players join via code → real-time player list updates
3. Host configures town naming mode → starts game
4. System assigns roles randomly → game phases begin

### Game Phase Flow
1. **Town Naming**: Players submit suggestions → voting on favorites
2. **Role Assignment**: Display roles to players → confirmation to proceed
3. **Night Phase**: Role-specific actions → all actions submitted
4. **Day Phase**: Discussion period → player nomination
5. **Voting Phase**: Yes/no votes on nominated player → execution/pardon
6. **Win Check**: Evaluate victory conditions → continue or end game

### Data Persistence Flow
- Client actions → API endpoints → validation → database updates
- Database changes → next polling cycle → client state updates
- Error handling → toast notifications → user feedback

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Router (Wouter)
- **State Management**: TanStack React Query for server state
- **UI Components**: Radix UI primitives, Lucide React icons
- **Styling**: Tailwind CSS, Class Variance Authority, clsx utilities

### Backend Dependencies
- **Server Framework**: Express.js with TypeScript support
- **Database**: Drizzle ORM, Neon Database serverless driver
- **Utilities**: Nanoid for ID generation, Zod for validation
- **Development**: TSX for TypeScript execution, ESBuild for bundling

### Development Tools
- **Build System**: Vite with React plugin and custom configuration
- **Code Quality**: TypeScript compiler, ESLint integration
- **Development Server**: Vite dev server with HMR support
- **Database Tools**: Drizzle Kit for schema management and migrations

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: ESBuild compiles TypeScript server to `dist/index.js`
- **Assets**: Static assets served from build output directory
- **Environment**: NODE_ENV-based configuration for development/production

### Production Deployment
- **Server**: Single Node.js process serving both API and static files
- **Database**: Neon Database provides managed PostgreSQL with connection pooling
- **Static Files**: Express serves built frontend from `/dist/public`
- **Process Management**: Simple node process execution with environment variables

### Development Environment
- **Hot Reloading**: Vite HMR for frontend, TSX watch mode for backend
- **Database**: Same Neon Database instance with separate schemas/tables
- **CORS**: Development middleware for cross-origin requests
- **Logging**: Custom request logging with performance metrics

### Environment Configuration
- **DATABASE_URL**: Required PostgreSQL connection string
- **NODE_ENV**: Development/production mode switching
- **Port Configuration**: Dynamic port assignment for cloud deployment
- **Replit Integration**: Special handling for Replit development environment

## Recent Changes

### July 24, 2025 - Core Lobby Implementation Complete
- ✅ Fixed lobby interface TypeScript errors preventing UI rendering
- ✅ Implemented test player functionality (8 fake players: Alice, Bob, Carol, Dave, Emma, Frank, Grace, Harry)
- ✅ Resolved authorization issues with game start mechanism
- ✅ Added comprehensive debugging and error handling
- ✅ Verified end-to-end lobby flow: create game → join players → add test players → start game
- ✅ Confirmed proper game phase transitions from lobby to town naming/role assignment

### July 27, 2025 - Navigation and Debug Mode Features
- ✅ Added GameHeader component with home button navigation across all game phases
- ✅ Implemented debug mode configuration system for development vs production
- ✅ Created environment-based feature toggling (debug mode, test players)
- ✅ Fixed TypeScript errors in town naming and voting components
- ✅ Added consistent header with room code display throughout game flow
- ✅ Fixed missing GameHeader in role assignment page - home button now appears consistently
- ✅ Resolved JSX syntax errors and TypeScript type issues in role assignment component
- ✅ Fixed join game button functionality - players can now join games from home page
- ✅ Implemented lobby-only joining - players can only join games still in lobby phase

### July 27, 2025 - Simplified Host Detection Implementation
- ✅ Redesigned create game flow: host enters name first, then creates room and joins as first player
- ✅ Implemented simplified host detection: first player in room is always the host
- ✅ Fixed host control visibility issues - town naming controls now appear correctly for hosts
- ✅ Eliminated complex player ID matching logic that was causing host detection failures
- ✅ Verified end-to-end flow: create game with name → automatic join as host → town naming controls visible

### July 27, 2025 - Town Name Inline Editing Implementation Complete
- ✅ Implemented inline editing for town names with click-to-edit functionality
- ✅ Fixed complex race condition between client state and server polling updates
- ✅ Added sync protection system to prevent server data from overriding saved values
- ✅ Resolved issue where toast showed correct saved value but display showed previous value
- ✅ Implemented optimistic updates with 1-second protection window after saves
- ✅ Town name editing now works reliably with minor visual delay during sync

### July 27, 2025 - UI/UX Improvements and Polish
- ✅ Added Enter key support to homepage forms (create game and join game)
- ✅ Implemented large, prominent room code display at top of lobby page
- ✅ Repositioned start game button below town name and above players list
- ✅ Improved visual flow and hierarchy throughout lobby interface
- ✅ Enhanced user experience with consistent keyboard shortcuts

### July 27, 2025 - Phase 1 Code Optimization: Critical Issues Fixed
- ✅ Fixed all TypeScript errors in storage.ts and lobby.tsx components
- ✅ Eliminated duplicate game code generation between client and server
- ✅ Created consolidated game mutation hooks (use-game-mutations.ts)
- ✅ Created consolidated game data hooks (use-game-data.ts)
- ✅ Successfully refactored home.tsx to use consolidated patterns
- ✅ Fixed lobby.tsx references to use proper consolidated hook names

### July 27, 2025 - Phase 2 Architectural Improvements: Complete
- ✅ Split massive routes.ts file (505 lines → 19 lines) into modular architecture
- ✅ Created game-logic.ts module for utility functions and game mechanics
- ✅ Created game-routes.ts module for game management endpoints
- ✅ Created action-routes.ts module for player action endpoints  
- ✅ Created phase-routes.ts module for game phase management
- ✅ Eliminated code duplication and mixed responsibilities in route handling

### July 27, 2025 - Phase 3 Polish & Performance: Complete
- ✅ Created reusable LoadingSpinner and FullPageLoader components
- ✅ Created centralized ErrorDisplay and FullPageError components  
- ✅ Optimized polling: Consolidated voting-phase.tsx to use useGameData hook
- ✅ Optimized polling: Consolidated day-phase.tsx to use useGameData hook
- ✅ Optimized polling: Consolidated night-phase.tsx to use useGameData + usePlayerRole hooks
- ✅ Optimized polling: Consolidated town-naming.tsx to use useGameData hook
- ✅ Optimized polling: Consolidated role-assignment.tsx to use useGameData + usePlayerRole hooks  
- ✅ Optimized polling: Consolidated town-voting.tsx to use useGameData hook
- ✅ Verified all components now use standardized loading/error states and consolidated hooks
- 🎯 All three optimization phases complete: Project ready for next development phase

### July 27, 2025 - Critical Bug Fixes: Complete
- ✅ Fixed role assignment system: Roles now properly assigned during game start
- ✅ Fixed GameState TypeScript errors: Added required phaseStartTime and phaseDuration fields
- ✅ Fixed town naming mode switching: Resolved client/server value mismatch ("vote" vs "voting")
- ✅ Fixed request payload format: Corrected parameter name from townNamingMode to mode
- ✅ Verified end-to-end functionality: Role lookup works, mode switching works, game starts properly

### July 27, 2025 - Test Player Enhancement: Complete
- ✅ Expanded test player roster from 8 to 16 players for better game testing
- ✅ Added 8 new test players: Ivy, Jack, Kate, Leo, Maya, Noah, Olivia, Paul
- ✅ Verified all 16 test players are generated and added correctly to fresh game rooms
- ✅ Confirmed duplicate prevention logic works properly (prevents re-adding existing players)

## Future Tasks & Reminders

**SYNC PROTOCOL: When updating TODO items, ALWAYS update BOTH files in the same action:**
1. Update replit.md (this file) 
2. Update attached_assets/TODO list
3. Use identical content in both locations
4. Verify both changes completed successfully before proceeding

### User's TODO List

#### Core Game Mechanics (High Priority)
1. Town naming voting mode implementation
   - Players submit town name suggestions
   - Voting on favorite names
   - Mario Party-style tie-breaker

2. Role assignment system enhancements
   - Custom setup options for different player counts
   - Host-selectable role breakdowns and quantities
   - Preset configurations alongside current auto-assignment
   - Role reveal to individual players

3. Night/Day cycle mechanics
   - Night phase: role-specific actions
   - Day phase: discussion and voting
   - Timer fallbacks for slow players

4. Voting and elimination system
   - Player nomination process
   - Yes/no voting on execution
   - Majority required logic

#### Polish & Enhancement Features (Lower Priority)
5. Audio cues and sound effects
   - "Town, go to sleep" voice lines
   - State transition sounds
   - Text-to-speech integration

6. Animations and visual polish
   - Mario Party-style tie-breaker wheel
   - Smooth transitions between phases
   - Enhanced mobile UI interactions

### User Preferences & Notes
- Keep everything mobile-friendly
- Maintain simple, everyday language in UI
- Focus on reliable functionality over flashy features
- Role assignment system needs flexibility: custom setups by player count + host-selectable role distributions