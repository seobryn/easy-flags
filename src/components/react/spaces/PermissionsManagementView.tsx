import { useState } from "react";
import SpaceNavigationWithTabs from "@/components/react/shared/SpaceNavigationWithTabs";
import PermissionsView from "./PermissionsView";
import FeaturesPermissionsView from "./FeaturesPermissionsView";

interface PermissionsManagementViewProps {
  spaceId: string | undefined;
  spaceName?: string;
  canManageFeaturePermissions: boolean;
}

export default function PermissionsManagementView({
  spaceId,
  spaceName,
  canManageFeaturePermissions,
}: PermissionsManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"space" | "features">("space");

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto py-12 px-4">
        <SpaceNavigationWithTabs
          spaceId={spaceId}
          spaceName={spaceName}
          currentTab="permissions"
          permissionSubTab={activeTab}
          onPermissionSubTabChange={setActiveTab}
          canManageFeaturePermissions={canManageFeaturePermissions}
        />

        {/* Content based on active tab */}
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
    </div>
  );
}
