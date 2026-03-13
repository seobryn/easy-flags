import { useState } from "react";

interface SpaceNavigationWithTabsProps {
  spaceId: string | undefined;
  spaceName?: string;
  currentTab?: "overview" | "environments" | "features" | "permissions";
  permissionSubTab?: "space" | "features";
  onPermissionSubTabChange?: (tab: "space" | "features") => void;
  canManageFeaturePermissions?: boolean;
  children?: React.ReactNode;
}

export default function SpaceNavigationWithTabs({
  spaceId,
  spaceName,
  currentTab = "overview",
  permissionSubTab = "space",
  onPermissionSubTabChange,
  canManageFeaturePermissions = false,
  children,
}: SpaceNavigationWithTabsProps) {
  const isActive = (tab: string) =>
    currentTab === tab ? "border-b-2 border-cyan-400 text-cyan-300" : "";

  const isPermissionSubTabActive = (tab: string) =>
    permissionSubTab === tab
      ? "border-b-2 border-cyan-400 text-cyan-300"
      : "text-slate-400 hover:text-slate-300";

  return (
    <div className="space-y-0 mb-8">
      {/* Back Link & Space Name */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <a
            href="/spaces"
            className="text-cyan-400 hover:text-cyan-300 text-sm mb-2 inline-block"
          >
            ← Back to Spaces
          </a>
          <div className="flex items-center gap-2">
            <a
              href={`/spaces/${spaceId}`}
              className="text-3xl font-bold text-gradient hover:opacity-80 transition"
              title="Go to space overview"
            >
              {spaceName || `Space ${spaceId}`}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex gap-8">
          <a
            href={`/spaces/${spaceId}`}
            className={`pb-3 text-slate-300 hover:text-cyan-300 transition ${isActive("overview")}`}
          >
            Overview
          </a>
          <a
            href={`/spaces/${spaceId}/environments`}
            className={`pb-3 text-slate-300 hover:text-cyan-300 transition ${isActive("environments")}`}
          >
            Environments
          </a>
          <a
            href={`/spaces/${spaceId}/features`}
            className={`pb-3 text-slate-300 hover:text-cyan-300 transition ${isActive("features")}`}
          >
            Features
          </a>
          <a
            href={`/spaces/${spaceId}/permissions`}
            className={`pb-3 text-slate-300 hover:text-cyan-300 transition ${isActive("permissions")}`}
          >
            Team & Permissions
          </a>
        </nav>
      </div>

      {/* Permission Sub-Tabs (Only shown on permissions page) */}
      {currentTab === "permissions" && canManageFeaturePermissions && (
        <div className="border-b border-slate-600 bg-slate-900/20">
          <nav className="flex gap-4 px-0">
            <button
              onClick={() => onPermissionSubTabChange?.("space")}
              className={`pb-3 px-2 font-semibold transition text-slate-300 ${isPermissionSubTabActive("space")}`}
            >
              Space Permissions
            </button>
            <button
              onClick={() => onPermissionSubTabChange?.("features")}
              className={`pb-3 px-2 font-semibold transition text-slate-300 ${isPermissionSubTabActive("features")}`}
            >
              🔐 Feature Permissions (Admin)
            </button>
          </nav>
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
}
