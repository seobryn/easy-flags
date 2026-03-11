import { useState } from "react";
import PermissionsView from "./PermissionsView";
import FeaturesPermissionsView from "./FeaturesPermissionsView";

interface PermissionsManagementViewProps {
  spaceId: string | undefined;
  canManageFeaturePermissions: boolean;
}

export default function PermissionsManagementView({
  spaceId,
  canManageFeaturePermissions,
}: PermissionsManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"space" | "features">("space");

  return (
    <div>
      {canManageFeaturePermissions && (
        <div className="mb-6 border-b border-slate-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("space")}
              className={`pb-3 px-2 font-semibold transition ${
                activeTab === "space"
                  ? "border-b-2 border-cyan-400 text-cyan-300"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Space Permissions
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={`pb-3 px-2 font-semibold transition ${
                activeTab === "features"
                  ? "border-b-2 border-cyan-400 text-cyan-300"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              🔐 Feature Permissions (Admin)
            </button>
          </div>
        </div>
      )}

      {activeTab === "space" && (
        <PermissionsView
          spaceId={spaceId}
          canManageFeaturePermissions={canManageFeaturePermissions}
        />
      )}
      {activeTab === "features" && canManageFeaturePermissions && (
        <FeaturesPermissionsView spaceId={spaceId} />
      )}
    </div>
  );
}
