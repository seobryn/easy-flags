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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto pt-12 pb-24 px-6 animate-in fade-in duration-700">
        <SpaceNavigationWithTabs
          spaceId={spaceId}
          spaceName={spaceName}
          currentTab="permissions"
          permissionSubTab={activeTab}
          onPermissionSubTabChange={setActiveTab}
          canManageFeaturePermissions={canManageFeaturePermissions}
        />

        <div className="relative z-10">
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
    </div>
  );
}

