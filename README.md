# Re-infort

An inventory tracking application built with Next.js, Clerk authentication, and Supabase.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **Form Management**: TanStack Form
- **Data Fetching**: TanStack Query (React Query)
- **Validation**: Zod
- **UI Components**: Headless UI

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI (for local development)
- A Clerk account
- A Supabase account (for production)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/re-infort.git
cd re-infort
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:

- **Supabase**: Get these from your [Supabase project dashboard](https://app.supabase.com)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Clerk**: Get these from your [Clerk dashboard](https://dashboard.clerk.com)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`

- **Mapbox**: Get your access token from [Mapbox account](https://account.mapbox.com/access-tokens/)
  - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

### 4. Set up Supabase locally

Start Supabase locally:

```bash
npx supabase start
```

This will start a local Supabase instance and output the local URLs and keys.

Run migrations:

```bash
npx supabase migration up --local
```

### 5. Configure Clerk JWT Template

In your Clerk dashboard:

1. Go to "JWT Templates"
2. Create a new template named "supabase"
3. Add the following claims:

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "org_id": "{{org.id}}",
  "o": {
    "id": "{{org.id}}",
    "rol": "{{org.role}}"
  }
}
```

4. Set the signing algorithm to HS256
5. Use your Supabase JWT secret as the signing key (find it in Supabase Dashboard → Settings → API → JWT Secret)

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Features

- **Multi-tenant Architecture**: Organization-based data isolation
- **Role-Based Access Control**: Admin and member roles with different permissions
- **Warehouse Management**: Create, read, update, and delete warehouse locations
- **Address Autocomplete**: Mapbox-powered address suggestions for easy data entry
- **Row Level Security**: Database-level security policies
- **Real-time Updates**: Using React Query for optimistic updates and caching

## Project Structure

```
app/
├── api/              # API routes
├── components/       # Reusable UI components
├── dashboard/        # Dashboard pages and components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and services
├── types/           # TypeScript type definitions
└── utils/           # Helper functions

supabase/
├── migrations/      # Database migrations
└── config.toml     # Supabase configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Database Schema

The application uses the following main tables:

- **warehouses**: Stores warehouse/location information
  - Filtered by organization
  - Role-based access control for CRUD operations

## Security

- Authentication handled by Clerk
- Authorization at both API and database levels
- Row Level Security (RLS) policies ensure data isolation
- JWT tokens passed from Clerk to Supabase for authentication

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

### Deploy Supabase

1. Link to your Supabase project: `npx supabase link --project-ref your-project-ref`
2. Push migrations: `npx supabase db push`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
