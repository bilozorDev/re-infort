"use client";

import { useAuth } from "@clerk/nextjs";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { UsersIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { OrganizationInvitation, OrganizationMember } from "@/app/types/team";

export default function TeamPage() {
  const { isLoaded, userId } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"org:admin" | "org:member">("org:member");
  const [searchQuery] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [newRole, setNewRole] = useState<"org:admin" | "org:member">("org:member");
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    if (isLoaded && userId) {
      fetchTeamData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [membersRes, invitationsRes] = await Promise.all([
        fetch("/api/team/members"),
        fetch("/api/team/invitations"),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);

        const currentUser = membersData.find((m: OrganizationMember) => m.userId === userId);
        setIsAdmin(currentUser?.role === "org:admin");
      }

      if (invitationsRes.ok) {
        const invitationsData = await invitationsRes.json();
        setInvitations(invitationsData);
      }
    } catch (error) {
      console.error("Error fetching team data:", error);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !isAdmin) return;

    setSendingInvite(true);
    try {
      const response = await fetch("/api/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (response.ok) {
        toast.success("Invitation sent successfully");
        setInviteEmail("");
        fetchTeamData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  const openRoleModal = (member: OrganizationMember) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setRoleModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedMember || !isAdmin || selectedMember.userId === userId) return;

    setUpdatingRole(true);
    try {
      const response = await fetch(`/api/team/members/${selectedMember.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success("Role updated successfully");
        setRoleModalOpen(false);
        fetchTeamData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleRemoveUser = async (targetUserId: string) => {
    if (!isAdmin || targetUserId === userId) return;

    if (!confirm("Are you sure you want to remove this user from the organization?")) {
      return;
    }

    try {
      const response = await fetch(`/api/team/members/${targetUserId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("User removed successfully");
        fetchTeamData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to remove user");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user");
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!isAdmin) return;

    try {
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Invitation revoked successfully");
        fetchTeamData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to revoke invitation");
      }
    } catch (error) {
      console.error("Error revoking invitation:", error);
      toast.error("Failed to revoke invitation");
    }
  };

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.email.toLowerCase().includes(query) ||
      member.firstName?.toLowerCase().includes(query) ||
      member.lastName?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <>
      {/* Role Change Modal */}
      {roleModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500/75 transition-opacity"
              onClick={() => setRoleModalOpen(false)}
            />

            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setRoleModalOpen(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">Change Role</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Change role for {selectedMember.firstName || selectedMember.email}
                    </p>

                    <div className="mt-4">
                      <label htmlFor="role" className="block text-sm/6 font-medium text-gray-900">
                        Select new role
                      </label>
                      <div className="mt-2 grid grid-cols-1">
                        <select
                          id="role"
                          name="role"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as "org:admin" | "org:member")}
                          className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6"
                        >
                          <option value="org:member">Member</option>
                          <option value="org:admin">Admin</option>
                        </select>
                        <ChevronDownIcon
                          aria-hidden="true"
                          className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                        />
                      </div>
                    </div>

                    {newRole === "org:admin" && selectedMember.role === "org:member" && (
                      <div className="mt-4 rounded-md bg-yellow-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-yellow-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                Admin users have full access to manage organization settings, team
                                members, and all data. Make sure you trust this person with
                                administrative privileges.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {newRole === "org:member" && selectedMember.role === "org:admin" && (
                      <div className="mt-4 rounded-md bg-blue-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-blue-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Note</h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <p>
                                This user will lose administrative privileges and won&apos;t be able
                                to manage organization settings or team members.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={updatingRole || newRole === selectedMember.role}
                  onClick={handleUpdateRole}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
                >
                  {updatingRole ? "Updating..." : "Update Role"}
                </button>
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-md sm:max-w-3xl py-8">
        {members.length === 0 && invitations.length === 0 ? (
          <div>
            <div className="text-center">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 48 48"
                aria-hidden="true"
                className="mx-auto size-12 text-gray-400"
              >
                <path
                  d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h2 className="mt-2 text-base font-semibold text-gray-900">Add team members</h2>
              <p className="mt-1 text-sm text-gray-500">
                You haven&apos;t added any team members to your project yet.
              </p>
            </div>
            {isAdmin && (
              <form onSubmit={handleInviteUser} className="mt-6 sm:flex sm:items-center">
                <div className="flex grow items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                  <input
                    name="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter an email"
                    aria-label="Email address"
                    className="block min-w-0 grow py-1.5 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                    required
                  />
                  <div className="grid shrink-0 grid-cols-1 focus-within:relative">
                    <select
                      name="role"
                      aria-label="Role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "org:admin" | "org:member")}
                      className="col-start-1 row-start-1 w-full appearance-none rounded-md py-1.5 pr-7 pl-3 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    >
                      <option value="org:member">Member</option>
                      <option value="org:admin">Admin</option>
                    </select>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                    />
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-4 sm:shrink-0">
                  <button
                    type="submit"
                    disabled={sendingInvite}
                    className="block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                  >
                    Send invite
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            <div>
              <div className="text-center">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  className="mx-auto size-12 text-gray-400"
                >
                  <path
                    d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h2 className="mt-2 text-base font-semibold text-gray-900">
                  {isAdmin ? "Manage team members" : "Team members"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isAdmin
                    ? "Here you can see full list of team members, invite new ones and manage existing."
                    : "View your organization's team members."}
                </p>
              </div>
              <form onSubmit={handleInviteUser} className="mt-6 sm:flex sm:items-center">
                <div className={`flex grow items-center rounded-md ${isAdmin ? 'bg-white' : 'bg-gray-50'} pl-3 outline-1 -outline-offset-1 outline-gray-300 ${isAdmin ? 'has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600' : ''}`}>
                  <input
                    name="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={isAdmin ? "Enter an email" : "Only admins can invite users"}
                    aria-label="Email address"
                    className={`block min-w-0 grow py-1.5 pr-3 text-base ${isAdmin ? 'text-gray-900' : 'text-gray-400'} placeholder:text-gray-400 ${isAdmin ? 'focus:outline-none' : ''} sm:text-sm/6 ${isAdmin ? '' : 'cursor-not-allowed bg-gray-50'}`}
                    required
                    disabled={!isAdmin}
                  />
                  <div className="grid shrink-0 grid-cols-1 focus-within:relative">
                    <select
                      name="role"
                      aria-label="Role"
                      value={inviteRole}
                      onChange={(e) =>
                        setInviteRole(e.target.value as "org:admin" | "org:member")
                      }
                      className={`col-start-1 row-start-1 w-full appearance-none rounded-md py-1.5 pr-7 pl-3 text-base text-gray-500 placeholder:text-gray-400 ${isAdmin ? 'focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600' : 'cursor-not-allowed bg-gray-50'} sm:text-sm/6`}
                      disabled={!isAdmin}
                    >
                      <option value="org:member">Member</option>
                      <option value="org:admin">Admin</option>
                    </select>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                    />
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-4 sm:shrink-0">
                  <button
                    type="submit"
                    disabled={!isAdmin || sendingInvite}
                    className={`block w-full rounded-md ${isAdmin ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-300 cursor-not-allowed'} px-3 py-2 text-center text-sm font-semibold text-white shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50`}
                  >
                    {isAdmin ? "Send invite" : "Admin only"}
                  </button>
                </div>
              </form>
            </div>

            {invitations.length > 0 && (
              <div className="mt-10">
                <h3 className="text-sm font-medium text-gray-500">Pending invitations</h3>
                <ul role="list" className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {invitations.map((invitation) => (
                    <li key={invitation.id}>
                      <div className="group flex w-full items-center justify-between space-x-3 rounded-full border border-gray-300 p-2 text-left shadow-xs hover:bg-gray-50">
                        <span className="flex min-w-0 flex-1 items-center space-x-3">
                          <span className="block shrink-0">
                            <div className="size-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UsersIcon className="size-5 text-gray-600" />
                            </div>
                          </span>
                          <span className="block min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-gray-900">
                              {invitation.email}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {invitation.role === "org:admin" ? "Admin" : "Member"}
                            </span>
                            <span className="block text-xs text-gray-500">Pending</span>
                          </span>
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleRevokeInvitation(invitation.id)}
                            className="inline-flex size-10 shrink-0 items-center justify-center pr-2"
                          >
                            <XMarkIcon
                              aria-hidden="true"
                              className="size-5 text-gray-400 group-hover:text-red-500"
                            />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {filteredMembers.length > 0 && (
              <div className="mt-10">
                {/* <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Team members</h3>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-48 rounded-md border-0 py-1 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                  placeholder="Search..."
                />
              </div> */}
                <ul role="list" className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {filteredMembers.map((member) => (
                    <li key={member.id}>
                      <div className="group flex w-full items-center justify-between space-x-3 rounded-full border border-gray-300 p-2 text-left shadow-xs hover:bg-gray-50">
                        <span className="flex min-w-0 flex-1 items-center space-x-3">
                          <span className="block shrink-0">
                            {member.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img alt="" src={member.imageUrl} className="size-10 rounded-full" />
                            ) : (
                              <div className="size-10 rounded-full bg-indigo-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {member.firstName?.[0] || member.email[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                          </span>
                          <span className="block min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-gray-900">
                              {member.firstName || member.lastName
                                ? `${member.firstName || ""} ${member.lastName || ""}`.trim()
                                : member.email}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {member.role === "org:admin" ? "Admin" : "Member"}
                            </span>
                            <span className="block text-xs text-gray-500">
                              Joined {formatDate(member.createdAt)}
                              {member.userId === userId && " · You"}
                            </span>
                          </span>
                        </span>
                        {isAdmin && member.userId !== userId && (
                          <span className="inline-flex items-center gap-2 pr-2">
                            <button
                              onClick={() => openRoleModal(member)}
                              className="text-gray-400 hover:text-indigo-600"
                              title="Edit role"
                            >
                              <PencilIcon aria-hidden="true" className="size-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveUser(member.userId)}
                              className="text-gray-400 hover:text-red-500"
                              title="Remove member"
                            >
                              <TrashIcon aria-hidden="true" className="size-4" />
                            </button>
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
