import { useState, useEffect } from "react";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";
import { Icon, type IconName } from "@/components/react/shared/Icon";

interface RolePermission {
  roleId: number;
  roleName: string;
  roleDescription: string;
  features: string[];
}

interface FeaturesPermissionsViewProps {
  spaceId: string | undefined;
  initialLocale?: AvailableLanguages;
}

export default function FeaturesPermissionsView({
  spaceId,
  initialLocale,
}: FeaturesPermissionsViewProps) {
  const t = useTranslate(initialLocale);
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
          text: data.error || t('globalPermissions.fetchError'),
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
        text: t('globalPermissions.featureFetchError'),
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
          text: t('globalPermissions.updateSuccess', { count: successCount }),
        });
      } else {
        setMessage({
          type: "error",
          text: t('globalPermissions.saveWarning'),
        });
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save permissions:", error);
      setMessage({
        type: "error",
        text: t('globalPermissions.saveError'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const featureDescriptions: Record<string, string> = {
    feature_flags: t('globalPermissions.featureFlagsDesc'),
    spaces: t('globalPermissions.spacesDesc'),
    environments: t('globalPermissions.environmentsDesc'),
    billing: t('globalPermissions.billingDesc'),
    settings: t('globalPermissions.settingsDesc'),
    database_inspector: t('globalPermissions.dbInspectorDesc'),
    api_reference: t('globalPermissions.apiReferenceDesc'),
  };

  const featureIcons: Record<string, IconName> = {
    feature_flags: "Rocket",
    spaces: "Box",
    environments: "Globe",
    billing: "CreditCard",
    settings: "Settings",
    database_inspector: "Database",
    api_reference: "Book",
  };

  const hasUnsavedChanges = changes.size > 0;
  const selectedRoleData = permissions.find((p) => p.roleId === selectedRole);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">
          {t('globalPermissions.loadingPermissions')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Role <span className="text-gradient">Permissions</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">
          {t('globalPermissions.roleDesc')}
        </p>
      </header>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          <Icon name={message.type === "success" ? "Check" : "AlertTriangle"} size={20} />
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Roles List - Left Sidebar */}
        <div className="lg:col-span-3">
          <div className="card p-4! space-y-2 sticky top-8">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-3">
              {t('globalPermissions.systemRoles')}
            </h2>
            <div className="space-y-1.5">
              {permissions.map((perm) => (
                <button
                  key={perm.roleId}
                  onClick={() => setSelectedRole(perm.roleId)}
                  className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 border ${
                    selectedRole === perm.roleId
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                      : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <div className="font-bold text-sm">{perm.roleName}</div>
                  <div className="text-[10px] font-medium opacity-60">
                    {t('globalPermissions.activeFeatures', { count: perm.features.length })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Features Matrix - Main Content */}
        <div className="lg:col-span-9">
          {selectedRoleData ? (
            <div className="space-y-6">
              {/* Role Info */}
              <div className="card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                      {selectedRoleData.roleName}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                      {selectedRoleData.roleDescription}
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-white/1! border border-white/5 rounded-2xl min-w-fit">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      {t('globalPermissions.statusLabel')}
                    </p>
                    <p className="text-sm font-bold text-cyan-400">
                      {t('globalPermissions.enabledCount', { count: selectedFeatures.size, total: availableFeatures.length })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="card">
                <h3 className="text-lg font-bold text-white tracking-tight mb-6 flex items-center gap-2">
                  <Icon name="Plus" size={18} className="text-cyan-400" /> {t('globalPermissions.availableFeatures')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableFeatures.map((feature) => (
                    <label
                      key={feature}
                      className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedFeatures.has(feature)
                          ? "bg-cyan-500/5 border-cyan-500/20 shadow-[0_4px_20px_rgba(6,182,212,0.05)]"
                          : "bg-white/1! border-white/5 hover:bg-white/4 hover:border-white/10"
                      }`}
                    >
                      <div className="relative flex items-center mt-1">
                        <input
                          type="checkbox"
                          checked={selectedFeatures.has(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                          className="peer w-5 h-5 appearance-none rounded-lg border border-white/10 bg-slate-900 checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer"
                        />
                        <Icon 
                          name="Check" 
                          size={12} 
                          className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-1 top-1 transition-opacity" 
                          strokeWidth={4} 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon 
                            name={featureIcons[feature] || "Target"} 
                            size={20} 
                            className="group-hover:scale-110 transition-transform text-white" 
                          />
                          <span className="font-bold text-white text-sm tracking-tight">
                            {feature
                              .replace(/_/g, " ")
                              .split(" ")
                              .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1),
                              )
                              .join(" ")}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                          {featureDescriptions[feature] ||
                            t('globalPermissions.defaultFeatureDesc')}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSaveChanges}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="btn-primary flex-1! py-3.5! shadow-lg shadow-cyan-500/20 disabled:grayscale disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t('globalPermissions.savingChanges')}
                    </span>
                  ) : (
                    t('globalPermissions.savePermissions')
                  )}
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
                  className="btn-secondary flex-1! py-3.5!"
                >
                  {t('globalPermissions.discardChanges')}
                </button>
              </div>

              {/* Unsaved Changes Indicator */}
              {hasUnsavedChanges && (
                <div className="bg-amber-500/5 border border-amber-500/10 text-amber-400 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 animate-pulse">
                  <Icon name="Lightbulb" size={20} />
                  {t('globalPermissions.unsavedChanges')}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-20">
              <p className="text-slate-500">
                {t('globalPermissions.selectRolePrompt')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
