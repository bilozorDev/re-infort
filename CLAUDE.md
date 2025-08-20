# Project Knowledge Base

## Important: Supabase RLS Policies with Clerk Authentication

### Key Learning: RLS Policy Pattern for Clerk + Supabase

When using Clerk authentication with Supabase, follow this pattern for Row Level Security (RLS) policies:

#### ✅ CORRECT APPROACH (Used in Warehouses, Categories, Subcategories)
1. **Database Level (RLS Policies)**: Only check organization membership
2. **API Level**: Check admin roles using the `isAdmin()` function from `@/app/utils/roles`

Example RLS Policy:
```sql
CREATE POLICY "Users can create items for own org" ON table_name
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );
```

#### ❌ AVOID: Checking Admin Roles in RLS Policies
Do NOT check admin roles at the database level in RLS policies. The JWT claim structure from Clerk can vary and cause RLS violations.

Bad example:
```sql
-- DON'T DO THIS
WITH CHECK (
    organization_clerk_id = ... 
    AND is_admin_user()  -- This can fail due to JWT structure issues
)
```

### API Route Pattern

All API routes should follow this pattern:

```typescript
import { auth } from "@clerk/nextjs/server";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

export async function POST(request: Request) {
  // 1. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Check admin role (if needed)
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    return NextResponse.json(
      { error: "Only administrators can perform this action" },
      { status: 403 }
    );
  }

  // 3. Get organization ID
  const orgId = await getCurrentOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // ... rest of the logic
}
```

### Important Functions

- `getCurrentOrgId()`: Extracts org ID from JWT claims (handles multiple possible locations)
- `isAdmin()`: Checks if user is admin (handles multiple JWT claim structures)
- Both functions are in `/app/utils/roles.ts`

### JWT Claim Locations

Clerk can store organization and role data in different places in the JWT:
- Organization ID: `jwt.org_id` or `jwt.o.id`
- Admin role: `jwt.metadata = 'org:admin'` or `jwt.o.rol = 'admin'`

The utility functions handle these variations automatically.

## Testing and Linting

Always run these commands before committing:
```bash
npm run lint
npm run typecheck
```

## UI Components

### Forms
- Use Tanstack Form (`@tanstack/react-form`) for all forms
- Use reusable form components from `@/app/components/ui/form`
- Components: `TextField`, `TextArea`, `Select`, `Checkbox`, `FormField`

### Cursor Hover Effects
Global CSS in `/app/globals.css` handles cursor hover effects for all interactive elements.

## Database Migrations

When creating new tables with RLS policies:
1. Follow the organization-filtering-only pattern
2. Handle admin checks in the API layer
3. Test with both admin and non-admin users
4. Compare with existing working implementations (warehouses)