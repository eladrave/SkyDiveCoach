# Overview

SkyMentor is a comprehensive skydiving mentorship platform that connects experienced mentors with aspiring skydivers. The application facilitates mentor-mentee matching, session scheduling, progression tracking, and achievement management within skydiving communities. Built as a full-stack web application, it serves three primary user roles: mentors, mentees, and administrators, each with tailored dashboards and functionality.

## Recent Changes (August 17, 2025)
- ✅ Fixed authentication system with proper cookie parsing middleware 
- ✅ Updated cookie settings for development environment compatibility
- ✅ All interactive buttons now functional (Update Availability, Create Session, Accept/Decline)
- ✅ Clear workflow guide added to session management explaining assignment process
- ✅ Fixed progression tracking to be role-appropriate (mentors select mentees, mentees see own progress)
- ✅ Added mentee selector dropdown for mentors in progression tracking
- ✅ Improved assignment request UI with clear explanations and status indicators
- ✅ Enhanced session assignment workflow with step-by-step instructions
- ✅ Updated progression steps for A-license skydivers (under 100 jumps):
  - 2 2-way formation skills (jumps 26-30)
  - 6 3-way formation skills (jumps 35-60)
  - 10 4-way formation skills (jumps 65-95)
  - 3 canopy control skills (jumps 30-50)
  - 3 safety skills (jumps 26-45)
- ✅ Created comprehensive database documentation (DATABASE.md)
- ✅ Built Python database setup script (db_setup.py) for creating new database instances
- ✅ Added environment configuration template (.env.example)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Authentication**: Context-based auth provider with JWT token management via cookies
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API with role-based route protection
- **Authentication**: JWT tokens with bcrypt password hashing
- **Middleware**: Custom authentication and authorization middleware
- **Session Management**: Cookie-based session handling
- **Error Handling**: Centralized error handling with structured error responses

## Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL with UUID primary keys
- **Schema Design**: Normalized relational schema with proper foreign key relationships
- **Key Entities**: Users, Mentors, Mentees, Availability, SessionBlocks, Assignments, ProgressionSteps, Badges, Awards
- **Enums**: PostgreSQL enums for roles, status, comfort levels, and categories

## Authentication & Authorization
- **Strategy**: JWT-based authentication with role-based access control (RBAC)
- **Roles**: Three distinct roles - mentor, mentee, admin
- **Password Security**: bcrypt hashing with salt rounds
- **Session Persistence**: HTTP-only cookies for token storage
- **Route Protection**: Middleware-based protection with role verification

## File Structure
- **Monorepo Architecture**: Client, server, and shared code in single repository
- **Shared Types**: Common TypeScript types and Zod schemas in `/shared`
- **Client**: React application in `/client` with component-based architecture
- **Server**: Express API in `/server` with modular route structure

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **Connection Pooling**: Node.js pg pool for database connections
- **Database Setup**: Python script (db_setup.py) for initializing new database instances
- **Documentation**: Comprehensive schema documentation (DATABASE.md)

## UI Component Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast build tool with HMR for development
- **ESBuild**: Fast JavaScript bundler for production builds
- **Drizzle Kit**: Database migration and schema management tools

## Authentication & Security
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing and verification
- **cookie-parser**: HTTP cookie parsing middleware

## Additional Integrations
- **Replit**: Development environment with custom plugins and runtime error overlay
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition