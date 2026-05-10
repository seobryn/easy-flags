import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Icon, type IconName } from "./Icon";

interface Tab {
  id: string;
  label: string;
  icon?: IconName;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTab, className = "" }: TabsProps) {
  return (
    <TabsPrimitive.Root defaultTab={defaultTab || tabs[0]?.id} className={className}>
      <TabsPrimitive.List className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            {tab.icon && <Icon name={tab.icon} size={18} />}
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {tabs.map((tab) => (
        <TabsPrimitive.Content key={tab.id} value={tab.id} className="mt-4">
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

export { TabsPrimitive };