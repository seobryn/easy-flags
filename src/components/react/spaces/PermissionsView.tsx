import { useState, useEffect } from "react";
import PageContainer from "@/components/react/shared/PageContainer";

// Role ID mapping
const ROLE_ID_MAP: Record<number, "admin" | "editor" | "viewer"> = {
  2: "admin",
  3: "editor",
  4: "viewer",
};

const ROLE_NAME_TO_ID: Record<"admin" | "editor" | "viewer", number> = {
  admin: 2,
  editor: 3,
  viewer: 4,
};

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  joinedAt: string;
}

interface SpaceMemberAPI {
  id: number;
  space_id: number;
  user_id: number;
  role_id: number;
  created_at: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

interface PermissionsViewProps {
  spaceId: string | undefined;
}

export default function PermissionsView({ spaceId }: PermissionsViewProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">(
    "editor",
  );
  const [selectedMemberForEdit, setSelectedMemberForEdit] =
    useState<TeamMember | null>(null);
  const [editingRole, setEditingRole] = useState<"admin" | "editor" | "viewer">(
    "editor",
  );
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  // Fetch team members on mount
  useEffect(() => {
    if (spaceId) {
      fetchTeamMembers();
    }
  }, [spaceId]);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/spaces/${spaceId}/team-members`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }

      const data = await response.json();
      const spaceMembers: SpaceMemberAPI[] = Array.isArray(data)
        ? data
        : data.data || [];

      // Convert SpaceMember to TeamMember
      const teamMembers: TeamMember[] = spaceMembers
        .map((member) => ({
          id: member.id,
          name: member.user?.username || `User ${member.user_id}`,
          email: member.user?.email || "",
          role: ROLE_ID_MAP[member.role_id] || "viewer",
          joinedAt: member.created_at,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setMembers(teamMembers);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load team members";
      setError(message);
      console.error("Error fetching team members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !spaceId) return;

    try {
      setIsInviting(true);
      setError(null);

      const response = await fetch(`/api/spaces/${spaceId}/team-members`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role_id: ROLE_NAME_TO_ID[inviteRole],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to invite member");
      }

      // Refresh team members list
      await fetchTeamMembers();
      setInviteEmail("");
      setInviteRole("editor");
      setShowInviteModal(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to invite member";
      setError(message);
      console.error("Error inviting member:", err);
    } finally {
      setIsInviting(false);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMemberForEdit(member);
    setEditingRole(member.role);
  };

  const handleSavePermissions = async () => {
    if (!selectedMemberForEdit || !spaceId) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(
        `/api/spaces/${spaceId}/team-members/${selectedMemberForEdit.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role_id: ROLE_NAME_TO_ID[editingRole],
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update member role");
      }

      // Refresh team members list
      await fetchTeamMembers();
      setSelectedMemberForEdit(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save permissions";
      setError(message);
      console.error("Error saving permissions:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!spaceId) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(
        `/api/spaces/${spaceId}/team-members/${memberId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to remove member");
      }

      // Refresh team members list
      await fetchTeamMembers();
      setSelectedMemberForEdit(null);
      setMemberToRemove(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove member";
      setError(message);
      console.error("Error removing member:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const roleDescriptions: Record<string, string> = {
    admin: "Full access including team management",
    editor: "Can modify features and environments",
    viewer: "Read-only access",
  };

  const roleIcons: Record<string, string> = {
    admin: "👑",
    editor: "✏️",
    viewer: "👁️",
  };

  const roleColors: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    admin: {
      bg: "bg-red-500/20",
      text: "text-red-300",
      border: "border-red-500/30",
    },
    editor: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-300",
      border: "border-yellow-500/30",
    },
    viewer: {
      bg: "bg-blue-500/20",
      text: "text-blue-300",
      border: "border-blue-500/30",
    },
  };

  // Roles available for space membership (excludes Super User)
  const availableSpaceRoles = ["admin", "editor", "viewer"] as const;

  return (
    <>
      <PageContainer
        spaceId={spaceId}
        spaceName="Acme Corporation"
        currentTab="permissions"
      >
        {/* Header */}
        <div className="mb-12 mt-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Team & Permissions
          </h1>
          <p className="text-slate-400">
            Manage team members and control access to this space
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Members Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Team Members
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isLoading
                        ? "Loading..."
                        : `${members.length} in this space`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-semibold transition"
                >
                  + Invite
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">Loading team members...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No team members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded hover:border-slate-600 transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-white">
                          {member.name}
                        </p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center justify-center gap-1 w-24 px-3 py-1 rounded text-xs font-semibold border ${roleColors[member.role].bg} ${roleColors[member.role].text} ${roleColors[member.role].border}`}
                        >
                          <span>{roleIcons[member.role]}</span>
                          {member.role.charAt(0).toUpperCase() +
                            member.role.slice(1)}
                        </span>
                        <button
                          onClick={() => handleEditMember(member)}
                          disabled={isSaving}
                          className="text-slate-500 hover:text-slate-300 p-2 hover:bg-slate-800 rounded transition disabled:opacity-50"
                          title="Edit permissions"
                        >
                          ⋮
                        </button>
                        <button
                          onClick={() => setMemberToRemove(member)}
                          disabled={isSaving}
                          className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded transition disabled:opacity-50"
                          title="Remove user"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Invitations */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📬</span>
                  <h2 className="text-xl font-bold text-white">
                    Pending Invitations
                  </h2>
                </div>
                <p className="text-slate-500 text-center py-8 text-sm">
                  No pending invitations
                </p>
              </div>
            </div>

            {/* Sidebar - Roles Reference */}
            <div className="space-y-6">
              {/* Role Permissions Card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🔐</span>
                  <h2 className="text-xl font-bold text-white">Roles</h2>
                </div>

                <div className="space-y-3">
                  {" "}
                  {(
                    [
                      { role: "admin", desc: roleDescriptions.admin },
                      { role: "editor", desc: roleDescriptions.editor },
                      { role: "viewer", desc: roleDescriptions.viewer },
                    ] as const
                  ).map(({ role, desc }) => (
                    <div
                      key={role}
                      className={`p-3 border rounded-lg ${roleColors[role].bg} ${roleColors[role].border}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{roleIcons[role]}</span>
                        <p
                          className={`text-sm font-semibold ${roleColors[role].text}`}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                  <p className="text-xs text-slate-500">
                    <span className="text-cyan-300 font-semibold">💡 Tip:</span>{" "}
                    A space must have at least one admin.
                  </p>
                  <div className="bg-slate-900/50 border border-slate-600/50 rounded p-2">
                    <p className="text-xs text-slate-400">
                      <span className="text-yellow-300 font-semibold">
                        ⓘ Note:
                      </span>{" "}
                      Super Admin roles are managed by system administrators
                      only. Contact support to manage Super Admin permissions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">
              Invite Team Member
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Add a new member to your team
            </p>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={isInviting}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(
                      e.target.value as "admin" | "editor" | "viewer",
                    )
                  }
                  disabled={isInviting}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition disabled:opacity-50"
                >
                  <option value="viewer">👁️ Viewer (Read-only)</option>
                  <option value="editor">✏️ Editor (Modify features)</option>
                  <option value="admin">👑 Admin (Full access)</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  {roleDescriptions[inviteRole]}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  ⓘ System roles are managed by Super Admins
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  disabled={isInviting}
                  className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-semibold transition disabled:opacity-50"
                >
                  {isInviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {selectedMemberForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-lg w-full mx-4 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-8 border-b border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center text-xl border border-cyan-500/30">
                  👤
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedMemberForEdit.name}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {selectedMemberForEdit.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Current Role */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Assign Role
                </label>
                <div className="space-y-2">
                  {(["admin", "editor", "viewer"] as const).map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 cursor-pointer hover:border-slate-600 hover:bg-slate-700/30 transition"
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={editingRole === role}
                        onChange={(e) =>
                          setEditingRole(
                            e.target.value as "admin" | "editor" | "viewer",
                          )
                        }
                        className="w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{roleIcons[role]}</span>
                          <span className="font-semibold text-white">
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 ml-6">
                          {roleDescriptions[role]}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Permissions Overview */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Permissions for{" "}
                  {editingRole.charAt(0).toUpperCase() + editingRole.slice(1)}
                </h3>
                <div className="space-y-2 text-xs text-slate-400">
                  {editingRole === "admin" && (
                    <>
                      <div className="flex items-center gap-2">
                        ✓ Manage team members
                      </div>
                      <div className="flex items-center gap-2">
                        ✓ Create and delete features
                      </div>
                      <div className="flex items-center gap-2">
                        ✓ Manage environments
                      </div>
                      <div className="flex items-center gap-2">
                        ✓ Configure permissions
                      </div>
                      <div className="flex items-center gap-2">
                        ✓ View analytics
                      </div>
                    </>
                  )}
                  {editingRole === "editor" && (
                    <>
                      <div className="flex items-center gap-2">
                        ✓ Create and modify features
                      </div>
                      <div className="flex items-center gap-2">
                        ✓ Manage feature rollouts
                      </div>
                      <div className="flex items-center gap-2">
                        ✓ Configure targeting rules
                      </div>
                      <div className="flex items-center gap-2">
                        ✗ Manage team members
                      </div>
                      <div className="flex items-center gap-2">
                        ✗ Configure permissions
                      </div>
                    </>
                  )}
                  {editingRole === "viewer" && (
                    <>
                      <div className="flex items-center gap-2">
                        ✓ View features
                      </div>
                      <div className="flex items-center gap-2">
                        ✓ View analytics
                      </div>
                      <div className="flex items-center gap-2">
                        ✗ Modify features
                      </div>
                      <div className="flex items-center gap-2">
                        ✗ Manage team members
                      </div>
                      <div className="flex items-center gap-2">
                        ✗ Configure permissions
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedMemberForEdit(null)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveMember(selectedMemberForEdit!.id)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded text-sm font-semibold transition disabled:opacity-50"
                >
                  {isSaving ? "..." : "Remove"}
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-semibold transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full mx-4 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500/20 to-slate-800 px-6 py-8 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-lg border border-red-500/30">
                  ⚠️
                </div>
                <h2 className="text-xl font-bold text-white">Remove User</h2>
              </div>
            </div>
            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-slate-300">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-white">
                  {memberToRemove?.name}
                </span>{" "}
                from this space?
              </p>
              <p className="text-sm text-slate-400">
                This action cannot be undone. They will lose access to all
                features and environments.
              </p>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setMemberToRemove(null)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveMember(memberToRemove?.id || 0)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-semibold transition disabled:opacity-50"
                >
                  {isSaving ? "Removing..." : "Remove User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
