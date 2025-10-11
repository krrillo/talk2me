# HablaConmigo - Educational Platform for Children with Hearing Difficulties

## Overview

HablaConmigo is an inclusive Spanish language learning platform designed for children aged 6-12 with mild to moderate hearing loss (hypoacusia neurosensorial bilateral). The application provides interactive stories and educational games focused on reading comprehension, grammar, and writing skills. The platform emphasizes accessibility (AA/AAA standards), low latency, child privacy, and safe content generation through AI-powered educational content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React with Vite for development and build tooling
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **Animations**: GSAP (GreenSock Animation Platform) and Framer Motion for premium animations
- **3D Graphics**: React Three Fiber with Drei helpers and post-processing effects
- **Game Engine**: Phaser.js/PixiJS support with GLSL shader capabilities
- **State Management**: Zustand stores for auth, game state, and audio
- **Data Fetching**: TanStack React Query for server state management
- **Routing**: React Router for client-side navigation

**Design Principles:**
- Accessibility-first design with high contrast mode support
- Reduced motion preferences for users with sensitivity
- Large text scaling options
- Font: Comic Neue for child-friendly readability
- Gradient backgrounds and engaging visual design
- Audio preloading for sound effects

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL via Neon serverless with Drizzle ORM
- **AI Orchestration**: LangChain with LangGraph for multi-step workflows
- **LLM Provider**: OpenAI (GPT-5 for text generation, DALL-E 3 for image generation)

**API Structure:**
- RESTful API design with `/api` prefix
- Route organization by domain:
  - `/api/auth` - Authentication and user management
  - `/api/stories` - Story generation and retrieval
  - `/api/exercises` - Exercise/game generation
  - `/api/progress` - User progress tracking
- Middleware: Rate limiting, authentication, request validation
- Error handling with consistent JSON responses

**Key Design Decisions:**
- **Serverless-ready architecture**: Designed to run on AWS Lambda + API Gateway (currently Express for development)
- **AI backend isolation**: All AI logic lives in the backend; frontend never calls models directly
- **Multi-step AI workflows**: LangGraph orchestrates story generation → image generation → exercise creation → asset storage
- **In-memory storage fallback**: MemStorage class provides development database with migration path to PostgreSQL

### Data Storage

**Database Schema (Drizzle ORM):**

1. **Users Table**
   - UUID primary key
   - Username, role (student/parent/therapist)
   - Level and experience points for gamification
   - JSON preferences for UI customization and accessibility settings

2. **Stories Table**
   - AI-generated educational stories
   - Level-based difficulty (1-10) with progressive complexity
   - JSON pages array with text and image URLs
   - AI metadata: wordCount, complexityIndex, grammar targets
   - Adaptive word ranges: 50-80 (Level 1) to 400-500 (Level 10)

3. **Exercises Table**
   - Game activities linked to stories
   - Implemented game types: drag_words, order_sentence, complete_words, multi_choice, free_writing
   - Planned advanced types: rewrite_sentence, find_error, contextual_choice (templates ready, frontend components pending)
   - JSON exercise data and correct answers
   - Difficulty and focus metadata for adaptive learning
   - Hints system for scaffolded learning

4. **Progress Table**
   - User performance tracking
   - Score (0-100), time spent, attempt count
   - Enhanced metrics: pointsEarned, accuracy, bonus, streak tracking
   - Links to user, exercise, and story

5. **User Stories Table**
   - Tracks user's story history and progress
   - Denormalized level field for efficient queries
   - Status tracking: not_started, in_progress, completed
   - Composite indexes: (userId, level), (userId, status), (userId, storyId)

6. **Assets Table** (referenced in workflow)
   - Stores generated images and multimedia
   - Version control for AI-generated content

**Storage Strategy:**
- PostgreSQL for structured data (Neon serverless)
- S3 (referenced in architecture docs) for images, sprites, and static assets
- CDN delivery via CloudFront (planned)

### Authentication & Authorization

**Current Implementation:**
- Google OAuth 2.0 authentication via Passport.js
- Session-based authentication with PostgreSQL session store
- Deterministic username collision handling with suffix system
- Security: Backend validation for OAuth callbacks prevents forged logins
- Session middleware: `requireAuth` for protected routes
- GDPR/COPPA compliant: minimal data collection for children

**Design for Production:**
- AWS Cognito JWT tokens (referenced in architecture)
- Role-based access control (student/parent/therapist)
- Child privacy compliance (minimal data collection)

### AI Integration & Workflows

**LangChain Orchestration:**
- **Primary Service**: `LangChainOrchestrator` class manages all AI interactions
- **Model**: GPT-5 (latest OpenAI model as of August 2025)
- **Temperature**: Not supported in GPT-5
- **Token limits**: Uses `max_completion_tokens` instead of deprecated `max_tokens`
- **Dynamic Exercise Generation**: Uses structural template system (`server/config/exerciseTemplates.ts`) to generate level-appropriate exercises
- **Level Configuration**: Centralized in `server/config/levels.ts` with 10 progressive difficulty levels

**Multi-Modal Workflow (LangGraph):**
1. **Story Generation Node**: Creates age-appropriate Spanish content based on theme and level
2. **Image Generation Node**: Uses DALL-E 3 to create illustrations with "flat-illustration-child-friendly" style
3. **Save Story Node**: Persists story with metadata to database
4. **Exercise Generation Node**: Creates 4 types of educational games from story content
5. **Save Assets Node**: Stores images in S3 with versioning

**Content Safety:**
- Validation functions for age-appropriate content
- Grammar level checking for educational appropriateness
- Safety filters before content delivery

**Exercise Types (Implemented):**
- Drag and drop words (DnD with HTML5 backend)
- Sentence ordering (animated word tiles)
- Word completion (input-based)
- Multiple choice (with visual feedback)
- Free writing (open-ended composition)

**Exercise Types (Planned - Templates Ready):**
- Rewrite sentence (error correction)
- Find error (grammatical error identification)
- Contextual choice (deep comprehension and inference)

**Level System (1-10):**
- **Levels 1-2**: Basic (50-100 words) - drag_words, multi_choice
- **Level 3**: Intermediate (100-130 words) - order_sentence, complete_words, multi_choice
- **Levels 4-10**: Advanced/Expert (130-500 words) - order_sentence, complete_words, multi_choice, free_writing
- Progressive grammar complexity: simple sentences → compound structures → advanced discourse
- Adaptive word ranges and vocabulary based on level
- Dynamic exercise templates adjust to level-specific grammar targets

## External Dependencies

### Third-Party Services

**OpenAI API:**
- GPT-5 for story and exercise generation
- DALL-E 3 for educational illustrations
- API key required in environment variables

**Neon Database:**
- Serverless PostgreSQL provider
- WebSocket connection via `@neondatabase/serverless`
- DATABASE_URL environment variable required

**AWS Services (Architecture References):**
- Lambda for serverless compute
- API Gateway for HTTP endpoints
- S3 for asset storage
- CloudFront for CDN
- EventBridge for domain events
- CloudWatch/X-Ray for observability
- Cognito for authentication (planned)

### Key NPM Packages

**AI & Language Processing:**
- `@langchain/core` - LangChain framework
- `@langchain/langgraph` - Workflow orchestration
- `@langchain/openai` - OpenAI integration

**Database & ORM:**
- `drizzle-orm` - Type-safe database ORM
- `drizzle-kit` - Migration toolkit
- `@neondatabase/serverless` - Neon database driver

**UI Components:**
- `@radix-ui/*` - Accessible component primitives
- `@react-three/fiber`, `@react-three/drei` - 3D graphics
- `gsap` - Animation library
- `recharts` - Data visualization
- `react-dnd` - Drag and drop functionality

**Development Tools:**
- `vite` - Build tool and dev server
- `tsx` - TypeScript execution
- `esbuild` - Production bundling
- `tailwindcss` - Utility-first CSS

### Environment Variables Required

```
DATABASE_URL - PostgreSQL connection string
OPENAI_API_KEY - OpenAI API authentication
NODE_ENV - Environment (development/production)
```

### Validation & Type Safety

**Zod Schemas:**
- Request/response validation
- Database insert/select schemas via `drizzle-zod`
- Type inference for end-to-end safety

**TypeScript Configuration:**
- Strict mode enabled
- Path aliases: `@/*` for client, `@shared/*` for shared code
- ESM modules throughout
- Bundler module resolution