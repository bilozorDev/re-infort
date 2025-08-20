'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export function JWTDebugClient() {
  const { getToken, sessionClaims } = useAuth();
  const { user } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);

  useEffect(() => {
    async function fetchToken() {
      const jwt = await getToken();
      setToken(jwt);
      
      if (jwt) {
        // Decode JWT (base64)
        try {
          const parts = jwt.split('.');
          const payload = JSON.parse(atob(parts[1]));
          setDecodedToken(payload);
          
          console.log('=== Client-side JWT Debug ===');
          console.log('Raw JWT:', jwt);
          console.log('Decoded JWT payload:', payload);
          console.log('Session claims from useAuth:', sessionClaims);
          console.log('User publicMetadata:', user?.publicMetadata);
          console.log('=============================');
        } catch (e) {
          console.error('Failed to decode JWT:', e);
        }
      }
    }
    
    fetchToken();
  }, [getToken, sessionClaims, user]);

  return (
    <div className="bg-gray-100 rounded-lg p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4">JWT Debug (Client-side)</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm text-gray-600 mb-1">User Public Metadata (from Clerk):</h3>
          <pre className="bg-white p-2 rounded text-xs overflow-auto">
            {JSON.stringify(user?.publicMetadata, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-medium text-sm text-gray-600 mb-1">Session Claims (from useAuth hook):</h3>
          <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(sessionClaims, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-medium text-sm text-gray-600 mb-1">Decoded JWT Payload:</h3>
          <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(decodedToken, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-medium text-sm text-gray-600 mb-1">Key Claims:</h3>
          <div className="bg-white p-2 rounded text-xs space-y-1">
            <div>org_role: <span className="font-mono">{decodedToken?.org_role || 'not set'}</span></div>
            <div>metadata: <span className="font-mono">{JSON.stringify(decodedToken?.metadata)}</span></div>
            <div>metadata.role: <span className="font-mono">{decodedToken?.metadata?.role || 'not set'}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-xs text-yellow-800">
          <strong>Important:</strong> If metadata is not showing in the JWT, make sure you've configured the session token in Clerk Dashboard → Sessions → Customize session token
        </p>
      </div>
    </div>
  );
}