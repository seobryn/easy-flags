import SpaceNavigation from "@/components/react/shared/SpaceNavigation";

interface PageContainerProps {
  children: React.ReactNode;
  spaceId: string | undefined;
  spaceName?: string;
  currentTab?: "overview" | "environments" | "features" | "permissions";
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto pt-12 pb-24 px-6 animate-in fade-in duration-700">
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
