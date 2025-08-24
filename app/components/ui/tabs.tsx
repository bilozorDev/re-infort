"use client";

import { Tab } from "@headlessui/react";
import * as React from "react";

import { cn } from "@/app/utils/cn";

interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  tabs: string[];
  registerTab: (value: string) => number;
}>({
  selectedIndex: 0,
  setSelectedIndex: () => {},
  tabs: [],
  registerTab: () => 0,
});

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [tabs, setTabs] = React.useState<string[]>([]);

  const registerTab = React.useCallback((value: string) => {
    setTabs((prev) => {
      if (!prev.includes(value)) {
        return [...prev, value];
      }
      return prev;
    });
    return tabs.indexOf(value) >= 0 ? tabs.indexOf(value) : tabs.length;
  }, [tabs]);

  React.useEffect(() => {
    if (value && tabs.includes(value)) {
      setSelectedIndex(tabs.indexOf(value));
    }
  }, [value, tabs]);

  const handleChange = (index: number) => {
    setSelectedIndex(index);
    if (onValueChange && tabs[index]) {
      onValueChange(tabs[index]);
    }
  };

  return (
    <TabsContext.Provider value={{ selectedIndex, setSelectedIndex: handleChange, tabs, registerTab }}>
      <Tab.Group selectedIndex={selectedIndex} onChange={handleChange}>
        <div className={className}>{children}</div>
      </Tab.Group>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <Tab.List
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500",
        className
      )}
    >
      {children}
    </Tab.List>
  );
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { registerTab } = React.useContext(TabsContext);
  
  React.useEffect(() => {
    registerTab(value);
  }, [value, registerTab]);

  return (
    <Tab
      className={({ selected }) =>
        cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          selected && "bg-white text-gray-950 shadow-sm",
          className
        )
      }
    >
      {children}
    </Tab>
  );
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { tabs, selectedIndex } = React.useContext(TabsContext);
  const index = tabs.indexOf(value);
  
  if (index === -1 || index !== selectedIndex) {
    return null;
  }

  return (
    <Tab.Panels className="mt-2">
      <Tab.Panel
        className={cn(
          "ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2",
          className
        )}
      >
        {children}
      </Tab.Panel>
    </Tab.Panels>
  );
}