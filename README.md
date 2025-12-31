# Next.js Admin Platform Boilerplate

Modern administrative platform boilerplate built with Next.js 14, TypeScript, and PostgreSQL. This is a complete starter template that can be adapted for any administrative or management platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Drizzle ORM
- **Database Naming**: snake_case convention
- **Validation**: Zod schemas
- **UI**: Tailwind CSS (MUI to be added)

## Project Structure

```
project-root/
├── src/                   # Source code
│   ├── app/              # Next.js App Router
│   │   ├── [locale]/     # Internationalized routes
│   │   │   ├── (auth)/   # Authentication pages
│   │   │   ├── dashboard/# Dashboard pages
│   │   │   └── api/      # API routes
│   │   └── api/          # Additional API routes
│   ├── components/       # React components
│   │   ├── ui/          # Base UI components
│   │   ├── forms/       # Form components
│   │   └── layouts/     # Layout components
│   ├── lib/             # Utilities and services
│   │   ├── auth.ts      # Authentication utilities
│   │   ├── db.ts        # Database client
│   │   ├── rbac.ts      # Role-based access control
│   │   └── session.ts   # Session management
│   ├── hooks/           # React hooks
│   ├── locales/         # Internationalization files
│   └── types/           # TypeScript type definitions
├── database/            # Database configuration
│   ├── schema/          # Database schema definitions
│   ├── migrations/      # Database migrations
│   ├── client.ts       # Database client
│   └── seed.ts         # Database seeding script
├── drizzle/            # Drizzle ORM schemas (legacy)
│   └── schema/         # Additional schema definitions
├── app/                # Legacy API routes (App Router)
├── components/         # Legacy components
├── lib/                # Legacy utilities
├── domains/            # Domain-specific modules
├── shared/             # Shared utilities
└── config/             # Configuration files
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and configure the following variables:
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_COOKIE_NAME` - Name of the session cookie (optional, default: 'session')
- `SESSION_MAX_AGE` - Session maximum age in seconds (optional, default: 604800)
- `BCRYPT_ROUNDS` - Number of bcrypt rounds for password hashing (optional, default: 12)
- `NODE_ENV` - Node environment (optional, default: 'development')

4. Set up the database:
```bash
npm run db:migrate
```

5. (Optional) Seed the database with initial roles and permissions:
```bash
npm run db:seed
```

6. Run the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

## Database Schema

The database schema is defined using Drizzle ORM with snake_case naming convention. All schemas are organized by domain in `drizzle/schema/` and `database/schema/`:

### Core Schemas
- `users.ts` - User authentication and management
- `rbac.ts` - Role-based access control (roles, permissions, role-permissions, user-roles)
- `sessions.ts` - User session management

### Domain Schemas
The boilerplate includes example domain schemas that can be adapted or removed based on your needs:
- `parohii.ts` - Example domain schema
- `cimitire.ts` - Example domain schema
- `biblioteca.ts` - Example domain schema
- `auto.ts` - Example domain schema
- `nomenclatoare.ts` - Example domain schema
- `contracte.ts` - Example domain schema
- `articole.ts` - Example domain schema
- `parohie_registers.ts` - Example domain schema
- `rip.ts` - Example domain schema
- `documente.ts` - Example domain schema
- `previziuni.ts` - Example domain schema
- `help.ts` - Example domain schema

You can modify or remove these schemas to match your specific requirements.

## API Routes

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/health` - Health check

## Features

### ✅ Included

- Next.js 14 project setup with App Router
- TypeScript with strict mode
- Drizzle ORM configuration
- PostgreSQL database integration
- Complete authentication system (login, register, password hashing)
- Session management with secure cookies
- RBAC system (roles, permissions, role-permissions, user-roles)
- Core infrastructure (types, error handling, logging)
- Internationalization support (next-intl)
- Tailwind CSS for styling
- Example domain schemas and API routes
- Database seeding script for initial roles and permissions

### 🔧 Customization

This boilerplate is designed to be easily customizable:
- Modify or remove domain schemas in `drizzle/schema/` and `database/schema/`
- Update API routes in `app/api/` and `src/app/api/`
- Customize UI components in `src/components/`
- Adjust authentication and authorization logic in `src/lib/auth.ts` and `src/lib/rbac.ts`
- Update internationalization files in `src/locales/`

## License

This boilerplate can be used as a starting point for your projects. Modify the license as needed for your use case.
