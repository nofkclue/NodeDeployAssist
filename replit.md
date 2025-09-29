# Overview

This is a diagnostic tool application built as a full-stack web application that performs comprehensive system health checks and diagnostics. The application provides real-time monitoring and analysis of system resources, network connectivity, file permissions, and dependencies. It features a modern React-based frontend with a Express.js backend that conducts various diagnostic tests and provides AI-powered reporting capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket connection for live progress updates during diagnostics

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with real-time WebSocket support
- **Data Storage**: In-memory storage with interface abstraction for future database integration
- **Development**: Hot module replacement via Vite integration in development mode

## Data Storage Solutions
- **ORM**: Drizzle ORM configured for PostgreSQL with schema definitions
- **Current Implementation**: Memory-based storage for development/testing
- **Schema**: Structured tables for diagnostic reports and system checks with JSON fields for flexible data storage
- **Migration Support**: Drizzle Kit for database schema management

## Component Architecture
- **Design System**: Modular component library with consistent styling patterns
- **Layout**: Multi-step wizard interface with sidebar navigation
- **Diagnostic Sections**: Specialized components for different check types (system, network, permissions, dependencies)
- **Progress Tracking**: Real-time progress indicators with WebSocket integration

## Key Features
- **System Diagnostics**: Comprehensive system information gathering (CPU, memory, disk, OS details)
- **Network Testing**: Port availability and connectivity checks
- **Permission Analysis**: File system permission verification
- **Dependency Management**: NPM package analysis and health checks
- **AI Reporting**: Automated report generation with diagnostic insights
- **Export Functionality**: Log and report export capabilities
- **Real-time Updates**: Live progress tracking via WebSocket connections

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Query for state management
- **Backend**: Express.js, Node.js runtime with TypeScript support
- **Database**: Drizzle ORM with PostgreSQL support, Neon Database serverless driver
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation

## UI and Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React icon library
- **Fonts**: Google Fonts integration (Inter, JetBrains Mono, DM Sans, etc.)

## Development and Tooling
- **Replit Integration**: Vite plugins for Replit development environment
- **Session Management**: Connect PG Simple for PostgreSQL session storage
- **Validation**: Zod for runtime type validation and schema generation
- **WebSocket**: ws library for real-time communication

## Utility Libraries
- **Date Handling**: date-fns for date manipulation
- **Class Management**: clsx and class-variance-authority for conditional styling
- **Form Handling**: React Hook Form with Hookform resolvers
- **Command Interface**: cmdk for command palette functionality