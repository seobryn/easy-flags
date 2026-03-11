import { useState, useEffect } from "react";
import PageContainer from "@/components/react/shared/PageContainer";

interface RolePermission {
  roleId: number;
  roleName: string;
  roleDescription: string;
  features: string[];
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface FeaturesPermissionsViewProps {
  spaceId: string | undefined;
}

export default function FeaturesPermissionsView({
  spaceId,
}: FeaturesPermissionsViewProps) {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(),
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [changes, setChanges] = useState<
    Map<number, { added: Set<string>; removed: Set<string> }>
  >(new Map());

  // Fetch permissions on load
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/system/permissions", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage({
          type: "error",
          text: data.error || "Failed to load permissions",
        });
        return;
      }

      const data = await response.json();
      setPermissions(data.permissions);

      // Fetch available features
      const rolesResponse = await fetch("/api/system/permissions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getAllRoles" }),
      });

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setAvailableFeatures(rolesData.availableFeatures);
      }

      if (data.permissions.length > 0) {
        setSelectedRole(data.permissions[0].roleId);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setMessage({
        type: "error",
        text: "Failed to load feature permissions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update selected features when role changes
  useEffect(() => {
    if (selectedRole) {
      const role = permissions.find((p) => p.roleId === selectedRole);
      setSelectedFeatures(new Set(role?.features || []));
    }
  }, [selectedRole, permissions]);

  const handleFeatureToggle = (feature: string) => {
    if (!selectedRole) return;

    const newFeatures = new Set(selectedFeatures);
    const role = permissions.find((p) => p.roleId === selectedRole);
    const originalFeatures = new Set(role?.features || []);

    if (newFeatures.has(feature)) {
      newFeatures.delete(feature);
    } else {
      newFeatures.add(feature);
    }

    setSelectedFeatures(newFeatures);

    // Track changes
    const newChanges = new Map(changes);
    if (!newChanges.has(selectedRole)) {
      newChanges.set(selectedRole, { added: new Set(), removed: new Set() });
    }

    const roleChanges = newChanges.get(selectedRole)!;

    if (newFeatures.has(feature) && !originalFeatures.has(feature)) {
      roleChanges.added.add(feature);
      roleChanges.removed.delete(feature);
    } else if (!newFeatures.has(feature) && originalFeatures.has(feature)) {
      roleChanges.removed.add(feature);
      roleChanges.added.delete(feature);
    } else {
      roleChanges.added.delete(feature);
      roleChanges.removed.delete(feature);
    }

    if (roleChanges.added.size === 0 && roleChanges.removed.size === 0) {
      newChanges.delete(selectedRole);
    }

    setChanges(newChanges);
  };

  const handleSaveChanges = async () => {
    if (changes.size === 0 || !selectedRole) return;

    try {
      setIsSaving(true);
      const roleChanges = changes.get(selectedRole);
      if (!roleChanges) return;

      let hasError = false;
      let successCount = 0;

      // Remove features
      for (const feature of roleChanges.removed) {
        const response = await fetch("/api/system/permissions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "removeFeature",
            roleId: selectedRole,
            featureName: feature,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          hasError = true;
        }
      }

      // Add features
      for (const feature of roleChanges.added) {
        const response = await fetch("/api/system/permissions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "assignFeature",
            roleId: selectedRole,
            featureName: feature,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          hasError = true;
        }
      }

      // Refresh permissions
      await fetchPermissions();

      // Clear changes
      const newChanges = new Map(changes);
      newChanges.delete(selectedRole);
      setChanges(newChanges);

      if (!hasError) {
        setMessage({
          type: "success",
          text: `Successfully updated feature permissions (${successCount} changes)`,
        });
      } else {
        setMessage({
          type: "error",
          text: "Some changes may not have been saved. Please check and try again.",
        });
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save permissions:", error);
      setMessage({
        type: "error",
        text: "Failed to save feature permissions",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const featureDescriptions: Record<string, string> = {
    feature_flags: "Manage feature flags and rollouts",
    spaces: "Create and manage spaces",
    environments: "Manage deployment environments",
    billing: "Access billing and subscription settings",
    settings: "Access application settings",
    database_inspector: "Access database inspector (dev only)",
    api_reference: "View API reference and documentation",
  };

  const featureIcons: Record<string, string> = {
    feature_flags: "🚀",
    spaces: "📦",
    environments: "🌍",
    billing: "💳",
    settings: "⚙️",
    database_inspector: "🗄️",
    api_reference: "📚",
  };

  const hasUnsavedChanges = changes.size > 0;
  const selectedRoleData = permissions.find((p) => p.roleId === selectedRole);

  if (isLoading) {
    return (
      <PageContainer
        spaceId={spaceId}
        spaceName="Feature Permissions"
        currentTab="permissions"
      >
        <div className="text-center py-12">
          <p className="text-slate-400">Loading feature permissions...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      spaceId={spaceId}
      spaceName="System Administration"
      currentTab="permissions"
    >
      {/* Header */}
      <div className="mb-12 mt-12">
        <h1 className="text-4xl font-bold text-white mb-2">
          Feature Permissions
        </h1>
        <p className="text-slate-400">
          Manage which features are accessible to each role
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List - Left Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
            <h2 className="text-sm font-bold text-slate-300 mb-3 px-2">
              ROLES
            </h2>
            {permissions.map((perm) => (
              <button
                key={perm.roleId}
                onClick={() => setSelectedRole(perm.roleId)}
                className={`w-full text-left px-3 py-2 rounded transition ${
                  selectedRole === perm.roleId
                    ? "bg-cyan-600/30 border border-cyan-500 text-cyan-300"
                    : "bg-slate-700/30 hover:bg-slate-700/50 text-slate-300"
                }`}
              >
                <div className="font-semibold text-sm">{perm.roleName}</div>
                <div className="text-xs text-slate-400">
                  {perm.features.length} features
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features Matrix - Main Content */}
        <div className="lg:col-span-3">
          {selectedRoleData && (
            <div className="space-y-6">
              {/* Role Info */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedRoleData.roleName}
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  {selectedRoleData.roleDescription}
                </p>
                <div className="text-xs text-slate-500">
                  {selectedFeatures.size} of {availableFeatures.length} features
                  enabled
                </div>
              </div>

              {/* Features Grid */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Available Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableFeatures.map((feature) => (
                    <label
                      key={feature}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700/30 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeatures.has(feature)}
                        onChange={() => handleFeatureToggle(feature)}
                        className="w-4 h-4 mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {featureIcons[feature] || "✨"}
                          </span>
                          <span className="font-semibold text-white text-sm">
                            {feature
                              .replace(/_/g, " ")
                              .split(" ")
                              .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1),
                              )
                              .join(" ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {featureDescriptions[feature] || ""}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveChanges}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-semibold transition"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setSelectedFeatures(
                      new Set(selectedRoleData?.features || []),
                    );
                    const newChanges = new Map(changes);
                    newChanges.delete(selectedRole!);
                    setChanges(newChanges);
                  }}
                  disabled={!hasUnsavedChanges}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded font-semibold transition"
                >
                  Cancel
                </button>
              </div>

              {/* Unsaved Changes Indicator */}
              {hasUnsavedChanges && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-3 rounded text-sm">
                  💡 You have unsaved changes
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
