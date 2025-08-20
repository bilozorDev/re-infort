import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserRole, isAdmin } from "@/app/utils/roles";

export default async function DashboardPage() {
  const { userId, orgId, orgSlug, sessionClaims } = await auth();
  const user = await currentUser();
  const userRole = await getCurrentUserRole();
  const userIsAdmin = await isAdmin();

  // Debug: Log entire JWT claims to console
  console.log('=== JWT Session Claims Debug ===');
  console.log('Full sessionClaims:', JSON.stringify(sessionClaims, null, 2));
  console.log('Organization role (o.rol):', (sessionClaims as any)?.o?.rol);
  console.log('Organization ID (o.id):', (sessionClaims as any)?.o?.id);
  console.log('metadata:', sessionClaims?.metadata);
  console.log('User publicMetadata from Clerk:', user?.publicMetadata);
  console.log('Computed userRole:', userRole);
  console.log('Is Admin?:', userIsAdmin);
  console.log('================================');

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    redirect("/onboarding/organization-selection");
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        {/* Role Test Component */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">User Role Information (Test Component)</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">User Role:</span>
              <span className={`px-2 py-1 rounded text-sm ${userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                {userRole || 'member (default)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Is Admin:</span>
              <span className={`px-2 py-1 rounded text-sm ${userIsAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {userIsAdmin ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Organization Role (o.rol in JWT):</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {(sessionClaims as any)?.o?.rol || 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Metadata (from JWT):</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {typeof sessionClaims?.metadata === 'string' 
                  ? sessionClaims.metadata 
                  : JSON.stringify(sessionClaims?.metadata) || 'Not set'}
              </span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Note:</strong> Admins can manage roles in the Clerk Dashboard:
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>Go to Clerk Dashboard → Users</li>
              <li>Click on a user</li>
              <li>Scroll to "Public metadata" and click Edit</li>
              <li>Add: <code className="bg-white px-1 py-0.5 rounded">{`{"role": "admin"}`}</code></li>
            </ol>
          </div>
        </div>

        {/* Permissions Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Permissions</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${true ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm">View Warehouses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${userIsAdmin ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm">Create Warehouses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${userIsAdmin ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm">Edit Warehouses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${userIsAdmin ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm">Delete Warehouses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}