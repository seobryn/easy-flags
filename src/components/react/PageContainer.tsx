import React from "react";
import SpaceNavigation from "./SpaceNavigation";

interface PageContainerProps {
  children: React.ReactNode;
  spaceId: string | undefined;
  spaceName?: string;
  currentTab?:
    | "overview"
    | "environments"
    | "features"
    | "permissions";
  subPage?: {
    name: string;
    path?: string;
  };
}

export default function PageContainer({
  children,
  spaceId,
  spaceName,
  currentTab,
  subPage,
}: PageContainerProps) {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto py-12 px-4">
        <SpaceNavigation
          spaceId={spaceId}
          spaceName={spaceName}
          currentTab={currentTab}
          subPage={subPage}
        />
        {children}
      </div>
    </div>
  );
}
