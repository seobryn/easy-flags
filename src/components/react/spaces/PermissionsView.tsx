import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/react/shared/Modals";

interface Space {
  id: number;
  name: string;
  slug: string;
  description?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

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
  user_id: number;
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
  canManageFeaturePermissions?: boolean;
}

export default function PermissionsView({
  spaceId,
  canManageFeaturePermissions,
}: PermissionsViewProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [space, setSpace] = useState<Space | null>(null);
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

  const fetchTeamMembers = useCallback(async () => {
    if (!spaceId) return;
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
          user_id: member.user_id,
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
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  const fetchSpaceInfo = useCallback(async () => {
    if (!spaceId) return;
    try {
      const spaceRes = await fetch(`/api/spaces/${spaceId}`, {
        credentials: "include",
      });
      if (!spaceRes.ok) throw new Error("Failed to fetch space");
      const spaceData = await spaceRes.json();
      setSpace(spaceData.data || spaceData);
    } catch (err) {
      console.error("Error fetching space info:", err);
    }
  }, [spaceId]);

  useEffect(() => {
    if (spaceId) {
      fetchSpaceInfo();
      fetchTeamMembers();
    }
  }, [spaceId, fetchSpaceInfo, fetchTeamMembers]);

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

      await fetchTeamMembers();
      setInviteEmail("");
      setInviteRole("editor");
      setShowInviteModal(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to invite member";
      setError(message);
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

      await fetchTeamMembers();
      setSelectedMemberForEdit(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save permissions";
      setError(message);
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

      await fetchTeamMembers();
      setSelectedMemberForEdit(null);
      setMemberToRemove(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove member";
      setError(message);
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
    { bg: string; text: string; border: string; glow: string }
  > = {
    admin: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/30",
      glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    },
    editor: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    },
    viewer: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/30",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    },
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-700">
        <header>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Team & <span className="text-gradient">Permissions</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">
            Manage team members and control access to this space. Assign roles with different levels of permissions.
          </p>
        </header>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <span className="text-lg">⚠️</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Members Card */}
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Team Members
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                      {isLoading ? "Fetching..." : `${members.length} members joined`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  disabled={isLoading}
                  className="btn-primary !px-6 !py-2.5 text-sm"
                >
                  <span className="mr-2">+</span> Invite Member
                </button>
              </div>

              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Loading Team...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-20 bg-white/2 border border-dashed border-white/10 rounded-[2rem]">
                  <span className="text-4xl mb-4 block">🏝️</span>
                  <p className="text-slate-400 font-medium">No team members yet</p>
                  <p className="text-slate-600 text-sm mt-1">Start by inviting your colleagues.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/2 border border-white/5 rounded-[1.5rem] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold border border-white/10 group-hover:scale-110 transition-transform">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white tracking-tight">
                            {member.name}
                            {space && member.user_id === space.owner_id && (
                              <span className="ml-2 text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">
                                Owner
                              </span>
                            )}
                          </p>
                          <p className="text-xs font-medium text-slate-500">{member.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-4 sm:mt-0">
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${roleColors[member.role].bg} ${roleColors[member.role].text} ${roleColors[member.role].border} ${roleColors[member.role].glow}`}
                        >
                          <span className="text-xs">{roleIcons[member.role]}</span>
                          {member.role}
                        </span>
                        
                        {space && member.user_id !== space.owner_id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditMember(member)}
                              disabled={isSaving}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                              title="Edit permissions"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                            <button
                              onClick={() => setMemberToRemove(member)}
                              disabled={isSaving}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95 disabled:opacity-50"
                              title="Remove user"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Invitations Card */}
            <div className="card overflow-hidden">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <span className="text-2xl">📬</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Pending Invitations
                  </h2>
                </div>
              <div className="text-center py-12 bg-white/2 border border-dashed border-white/10 rounded-[1.5rem]">
                <p className="text-slate-500 font-medium">No pending invitations</p>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Roles Reference Card */}
            <div className="card h-fit sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <span className="text-xl">🔐</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Roles Guide</h2>
              </div>

              <div className="space-y-4">
                {(Object.entries(roleIcons) as Array<[keyof typeof roleIcons, string]>).map(([role, icon]) => (
                  <div
                    key={role}
                    className={`p-4 border rounded-[1.5rem] transition-colors ${roleColors[role].bg} ${roleColors[role].border}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{icon}</span>
                      <p className={`text-xs font-black uppercase tracking-[0.2em] ${roleColors[role].text}`}>
                        {role}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {roleDescriptions[role]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-4 flex gap-3">
                  <span className="text-cyan-400 text-lg">💡</span>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    <span className="text-cyan-400 font-bold block mb-1">PRO TIP</span>
                    A space must have at least one administrator. We recommend having at least two.
                  </p>
                </div>
                
                {canManageFeaturePermissions && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3">
                    <span className="text-amber-400 text-lg">ⓘ</span>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      <span className="text-amber-400 font-bold block mb-1">SYSTEM ROLES</span>
                      Super Admin roles are managed by system administrators.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        id="invite-member-modal"
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleInviteMember} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              disabled={isInviting}
              className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
              Assign Role
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(["admin", "editor", "viewer"] as const).map((role) => (
                <label
                  key={role}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                    inviteRole === role
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-white/2 border-white/5 hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="inviteRole"
                    value={role}
                    checked={inviteRole === role}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="hidden"
                  />
                  <span className="text-xl">{roleIcons[role]}</span>
                  <div className="flex-1">
                    <p className={`text-xs font-bold uppercase tracking-widest ${inviteRole === role ? "text-cyan-400" : "text-white"}`}>
                      {role}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {roleDescriptions[role]}
                    </p>
                  </div>
                  {inviteRole === role && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              disabled={isInviting}
              className="btn-secondary !flex-1 !py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInviting}
              className="btn-primary !flex-1 !py-3"
            >
              {isInviting ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        id="edit-permissions-modal"
        isOpen={!!selectedMemberForEdit}
        onClose={() => setSelectedMemberForEdit(null)}
        title="Edit Permissions"
      >
        {selectedMemberForEdit && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-5 bg-white/2 border border-white/10 rounded-3xl mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-white/10">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <p className="font-bold text-white tracking-tight leading-tight">{selectedMemberForEdit.name}</p>
                <p className="text-xs font-medium text-slate-500">{selectedMemberForEdit.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">
                New Role
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(["admin", "editor", "viewer"] as const).map((role) => (
                  <label
                    key={role}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                      editingRole === role
                        ? "bg-cyan-500/10 border-cyan-500/50"
                        : "bg-white/2 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editingRole"
                      value={role}
                      checked={editingRole === role}
                      onChange={(e) => setEditingRole(e.target.value as any)}
                      className="hidden"
                    />
                    <span className="text-xl">{roleIcons[role]}</span>
                    <div className="flex-1">
                      <p className={`text-xs font-bold uppercase tracking-widest ${editingRole === role ? "text-cyan-400" : "text-white"}`}>
                        {role}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {roleDescriptions[role]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedMemberForEdit(null)}
                  disabled={isSaving}
                  className="btn-secondary !flex-1 !py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="btn-primary !flex-1 !py-3"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
              <button
                onClick={() => {
                  setMemberToRemove(selectedMemberForEdit);
                  setSelectedMemberForEdit(null);
                }}
                className="w-full py-2 text-red-500/50 hover:text-red-400 text-[10px] font-black uppercase tracking-[0.3em] transition-colors"
              >
                Remove from Team
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        id="remove-member-modal"
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        title="Confirm Removal"
      >
        {memberToRemove && (
          <div className="space-y-6">
            <div className="text-center p-8 bg-red-500/5 border border-red-500/10 rounded-3xl">
              <span className="text-5xl mb-6 block">⚠️</span>
              <p className="text-lg font-bold text-white tracking-tight mb-2">Remove Member?</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                You are about to remove <span className="text-white font-bold">{memberToRemove.name}</span>. 
                They will immediately lose all access to this space and its configurations.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setMemberToRemove(null)}
                className="btn-secondary !flex-1 !py-3"
              >
                Keep Member
              </button>
              <button
                onClick={() => handleRemoveMember(memberToRemove.id)}
                className="!flex-1 py-3 rounded-full bg-red-500 hover:bg-red-400 text-white font-bold font-display tracking-widest text-[10px] uppercase transition-all shadow-lg shadow-red-500/20 active:scale-95"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

