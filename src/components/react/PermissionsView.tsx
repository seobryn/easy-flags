import React, { useState } from "react";
import PageContainer from "./PageContainer";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  joinedAt: string;
}

interface PermissionsViewProps {
  spaceId: string | undefined;
}

export default function PermissionsView({ spaceId }: PermissionsViewProps) {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      joinedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "editor",
      joinedAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "viewer",
      joinedAt: new Date().toISOString(),
    },
  ]);

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

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: Math.max(...members.map((m) => m.id), 0) + 1,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      joinedAt: new Date().toISOString(),
    };

    setMembers([...members, newMember]);
    setInviteEmail("");
    setInviteRole("editor");
    setShowInviteModal(false);
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMemberForEdit(member);
    setEditingRole(member.role);
  };

  const handleSavePermissions = () => {
    if (!selectedMemberForEdit) return;

    setMembers(
      members.map((m) =>
        m.id === selectedMemberForEdit.id ? { ...m, role: editingRole } : m,
      ),
    );
    setSelectedMemberForEdit(null);
  };

  const handleRemoveMember = (memberId: number) => {
    setMembers(members.filter((m) => m.id !== memberId));
    setSelectedMemberForEdit(null);
    setMemberToRemove(null);
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
                      {members.length} in this space
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-semibold transition"
                >
                  + Invite
                </button>
              </div>

              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded hover:border-slate-600 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-white">{member.name}</p>
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
                        className="text-slate-500 hover:text-slate-300 p-2 hover:bg-slate-800 rounded transition"
                        title="Edit permissions"
                      >
                        ⋮
                      </button>
                      <button
                        onClick={() => setMemberToRemove(member)}
                        className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded transition"
                        title="Remove user"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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

              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  <span className="text-cyan-300 font-semibold">💡 Tip:</span> A
                  space must have at least one admin.
                </p>
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
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
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
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                >
                  <option value="viewer">👁️ Viewer (Read-only)</option>
                  <option value="editor">✏️ Editor (Modify features)</option>
                  <option value="admin">👑 Admin (Full access)</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  {roleDescriptions[inviteRole]}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-semibold transition"
                >
                  Send Invite
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
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveMember(selectedMemberForEdit.id)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded text-sm font-semibold transition"
                >
                  Remove
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-semibold transition"
                >
                  Save Changes
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
                  {memberToRemove.name}
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
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveMember(memberToRemove.id)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-semibold transition"
                >
                  Remove User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
