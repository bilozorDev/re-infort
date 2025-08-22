export interface OrganizationMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: "org:admin" | "org:member";
  createdAt: string;
  userId: string;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: "org:admin" | "org:member";
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
  expiresAt: string;
}

export interface InviteUserRequest {
  email: string;
  role: "org:admin" | "org:member";
}

export interface UpdateRoleRequest {
  userId: string;
  role: "org:admin" | "org:member";
}
