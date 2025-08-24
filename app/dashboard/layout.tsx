"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Dialog, DialogBackdrop, DialogPanel, Disclosure, DisclosureButton, DisclosurePanel, Transition, TransitionChild } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  ArchiveBoxIcon,
  Bars3Icon,
  BellIcon,
  BuildingOfficeIcon,
  ChartPieIcon,
  ChevronDownIcon,
  CubeIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Logo } from "@/app/components/ui/Logo";
import { useLocalNavigationPreferences } from "@/app/hooks/use-local-navigation-preferences";

type NavItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children?: NavItem[];
};

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  {
    name: "Inventory",
    icon: ArchiveBoxIcon,
    children: [
      { name: "Overview", href: "/dashboard/inventory", icon: ChartPieIcon },
      { name: "Products", href: "/dashboard/products", icon: CubeIcon },
      { name: "Warehouses", href: "/dashboard/warehouses", icon: BuildingOfficeIcon },
    ],
  },
  {
    name: "Quoting",
    icon: DocumentTextIcon,
    children: [
      { name: "Quotes", href: "/dashboard/quotes", icon: DocumentTextIcon },
      { name: "Clients", href: "/dashboard/clients", icon: UserGroupIcon },
      { name: "Services", href: "/dashboard/services", icon: WrenchScrewdriverIcon },
    ],
  },
  { name: "Team", href: "/dashboard/team", icon: UsersIcon },
  { name: "Projects", href: "/dashboard/projects", icon: FolderIcon },
  { name: "Documents", href: "/dashboard/documents", icon: DocumentDuplicateIcon },
  { name: "Reports", href: "/dashboard/reports", icon: ChartPieIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { inventoryExpanded, setInventoryExpanded, isLoaded } = useLocalNavigationPreferences();
  
  // Check if we're on any inventory page
  const isOnInventoryPage = pathname.startsWith('/dashboard/inventory') || 
                           pathname.startsWith('/dashboard/products') || 
                           pathname.startsWith('/dashboard/warehouses');
  
  // Check if we're on any quoting page
  const isOnQuotingPage = pathname.startsWith('/dashboard/quotes') || 
                          pathname.startsWith('/dashboard/clients') || 
                          pathname.startsWith('/dashboard/services');
  
  // State for the disclosure components
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [quotingOpen, setQuotingOpen] = useState(false);

  // Initialize and sync state
  useEffect(() => {
    if (isLoaded) {
      // If on inventory page, always expand
      if (isOnInventoryPage) {
        setInventoryOpen(true);
        // Save this preference if it wasn't already expanded
        if (!inventoryExpanded) {
          setInventoryExpanded(true);
        }
      } else {
        // Not on inventory page, use saved preference
        setInventoryOpen(inventoryExpanded);
      }
      
      // Auto-expand quoting if on quoting page
      if (isOnQuotingPage) {
        setQuotingOpen(true);
      }
    }
  }, [isLoaded, inventoryExpanded, isOnInventoryPage, isOnQuotingPage, setInventoryExpanded, pathname]);

  const handleInventoryToggle = useCallback((open: boolean) => {
    setInventoryOpen(open);
    setInventoryExpanded(open);
  }, [setInventoryExpanded]);

  const isInventoryActive = (item: NavItem): boolean => {
    if (item.href) {
      return pathname.startsWith(item.href);
    }
    if (item.children) {
      return item.children.some(child => child.href && pathname.startsWith(child.href));
    }
    return false;
  };

  return (
    <div className="min-h-screen">
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="-m-2.5 p-2.5"
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden={true} className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>

            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
              <div className="relative flex h-16 shrink-0 items-center">
                <Logo size="xl" />
              </div>
              <nav className="relative flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          {item.children ? (
                            <Disclosure 
                              as="div" 
                              defaultOpen={
                                item.name === "Inventory" ? inventoryOpen : 
                                item.name === "Quoting" ? quotingOpen : 
                                false
                              } 
                              key={`mobile-${item.name}-${item.name === "Inventory" ? inventoryOpen : quotingOpen}`}
                            >
                              {({ open }) => (
                                <>
                                  <DisclosureButton
                                    onClick={() => {
                                      if (item.name === "Inventory") {
                                        handleInventoryToggle(!open);
                                      } else if (item.name === "Quoting") {
                                        setQuotingOpen(!open);
                                      }
                                    }}
                                    className={classNames(
                                        isInventoryActive(item)
                                          ? "bg-gray-50 text-indigo-600"
                                          : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600",
                                        "group flex w-full items-center gap-x-3 rounded-md p-2 text-left text-sm/6 font-semibold"
                                      )}
                                    >
                                      <item.icon
                                        aria-hidden={true}
                                        className={classNames(
                                          isInventoryActive(item)
                                            ? "text-indigo-600"
                                            : "text-gray-400 group-hover:text-indigo-600",
                                          "size-6 shrink-0"
                                        )}
                                      />
                                      {item.name}
                                      <ChevronDownIcon
                                        className={classNames(
                                          open ? "rotate-180" : "",
                                          "ml-auto h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200"
                                        )}
                                        aria-hidden={true}
                                      />
                                    </DisclosureButton>
                                    <Transition
                                      show={open}
                                      enter="transition ease-out duration-200"
                                      enterFrom="transform opacity-0 -translate-y-1"
                                      enterTo="transform opacity-100 translate-y-0"
                                      leave="transition ease-in duration-150"
                                      leaveFrom="transform opacity-100 translate-y-0"
                                      leaveTo="transform opacity-0 -translate-y-1"
                                    >
                                      <DisclosurePanel className="mt-1 space-y-1">
                                        {item.children?.map((subItem) => (
                                        <a
                                          key={subItem.name}
                                          href={subItem.href}
                                          className={classNames(
                                            subItem.href && pathname.startsWith(subItem.href)
                                              ? "bg-gray-50 text-indigo-600"
                                              : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600",
                                            "group flex items-center gap-x-3 rounded-md py-2 pl-11 pr-2 text-sm/6 font-medium"
                                          )}
                                        >
                                          {subItem.icon && (
                                            <subItem.icon
                                              aria-hidden={true}
                                              className={classNames(
                                                subItem.href && pathname.startsWith(subItem.href)
                                                  ? "text-indigo-600"
                                                  : "text-gray-400 group-hover:text-indigo-600",
                                                "size-5 shrink-0"
                                              )}
                                            />
                                          )}
                                          {subItem.name}
                                        </a>
                                      ))}
                                      </DisclosurePanel>
                                    </Transition>
                                </>
                              )}
                            </Disclosure>
                          ) : (
                            <a
                              href={item.href}
                              className={classNames(
                                item.href === "/dashboard"
                                  ? pathname === item.href
                                    ? "bg-gray-50 text-indigo-600"
                                    : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                  : pathname.startsWith(item.href!)
                                  ? "bg-gray-50 text-indigo-600"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600",
                                "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                              )}
                            >
                              <item.icon
                                aria-hidden={true}
                                className={classNames(
                                  item.href === "/dashboard"
                                    ? pathname === item.href
                                      ? "text-indigo-600"
                                      : "text-gray-400 group-hover:text-indigo-600"
                                    : pathname.startsWith(item.href!)
                                    ? "text-indigo-600"
                                    : "text-gray-400 group-hover:text-indigo-600",
                                  "size-6 shrink-0"
                                )}
                              />
                              {item.name}
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li className="mt-auto">
                    <div className="mb-4">
                      <OrganizationSwitcher
                        afterCreateOrganizationUrl="/dashboard"
                        afterSelectOrganizationUrl="/dashboard"
                        afterLeaveOrganizationUrl="/dashboard"
                        appearance={{
                          elements: {
                            rootBox: "w-full",
                            organizationSwitcherTrigger:
                              "w-full justify-between px-2 py-2 hover:bg-gray-50 rounded-md",
                          },
                        }}
                      />
                    </div>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <div className="hidden bg-gray-900 lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Logo size="4xl" />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      {item.children ? (
                        <Disclosure 
                          as="div" 
                          defaultOpen={
                            item.name === "Inventory" ? inventoryOpen : 
                            item.name === "Quoting" ? quotingOpen : 
                            false
                          } 
                          key={`desktop-${item.name}-${item.name === "Inventory" ? inventoryOpen : quotingOpen}`}
                        >
                          {({ open }) => (
                            <>
                              <DisclosureButton
                                onClick={() => {
                                  if (item.name === "Inventory") {
                                    handleInventoryToggle(!open);
                                  } else if (item.name === "Quoting") {
                                    setQuotingOpen(!open);
                                  }
                                }}
                                className={classNames(
                                    isInventoryActive(item)
                                      ? "bg-gray-50 text-indigo-600"
                                      : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600",
                                    "group flex w-full items-center gap-x-3 rounded-md p-2 text-left text-sm/6 font-semibold"
                                  )}
                                >
                                  <item.icon
                                    aria-hidden={true}
                                    className={classNames(
                                      isInventoryActive(item)
                                        ? "text-indigo-600"
                                        : "text-gray-400 group-hover:text-indigo-600",
                                      "size-6 shrink-0"
                                    )}
                                  />
                                  {item.name}
                                  <ChevronDownIcon
                                    className={classNames(
                                      open ? "rotate-180" : "",
                                      "ml-auto h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200"
                                    )}
                                    aria-hidden={true}
                                  />
                                </DisclosureButton>
                                <Transition
                                  show={open}
                                  enter="transition ease-out duration-200"
                                  enterFrom="transform opacity-0 -translate-y-1"
                                  enterTo="transform opacity-100 translate-y-0"
                                  leave="transition ease-in duration-150"
                                  leaveFrom="transform opacity-100 translate-y-0"
                                  leaveTo="transform opacity-0 -translate-y-1"
                                >
                                  <DisclosurePanel className="mt-1 space-y-1">
                                    {item.children && item.children.map((subItem) => (
                                    <a
                                      key={subItem.name}
                                      href={subItem.href}
                                      className={classNames(
                                        subItem.href && pathname.startsWith(subItem.href)
                                          ? "bg-gray-50 text-indigo-600"
                                          : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600",
                                        "group flex items-center gap-x-3 rounded-md py-2 pl-11 pr-2 text-sm/6 font-medium"
                                      )}
                                    >
                                      {subItem.icon && (
                                        <subItem.icon
                                          aria-hidden={true}
                                          className={classNames(
                                            subItem.href && pathname.startsWith(subItem.href)
                                              ? "text-indigo-600"
                                              : "text-gray-400 group-hover:text-indigo-600",
                                            "size-5 shrink-0"
                                          )}
                                        />
                                      )}
                                      {subItem.name}
                                    </a>
                                  ))}
                                  </DisclosurePanel>
                                </Transition>
                            </>
                          )}
                        </Disclosure>
                      ) : (
                        <a
                          href={item.href}
                          className={classNames(
                            item.href === "/dashboard"
                              ? pathname === item.href
                                ? "bg-gray-50 text-indigo-600"
                                : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                              : pathname.startsWith(item.href!)
                              ? "bg-gray-50 text-indigo-600"
                              : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600",
                            "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                          )}
                        >
                          <item.icon
                            aria-hidden={true}
                            className={classNames(
                              item.href === "/dashboard"
                                ? pathname === item.href
                                  ? "text-indigo-600"
                                  : "text-gray-400 group-hover:text-indigo-600"
                                : pathname.startsWith(item.href!)
                                ? "text-indigo-600"
                                : "text-gray-400 group-hover:text-indigo-600",
                              "size-6 shrink-0"
                            )}
                          />
                          {item.name}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="mb-4">
                  <OrganizationSwitcher
                    afterCreateOrganizationUrl="/dashboard"
                    afterSelectOrganizationUrl="/dashboard"
                    afterLeaveOrganizationUrl="/dashboard"
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        organizationSwitcherTrigger:
                          "w-full justify-between px-2 py-2 hover:bg-gray-50 rounded-md",
                      },
                    }}
                  />
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden={true} className="size-6" />
          </button>

          <div aria-hidden={true} className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form action="#" method="GET" className="grid flex-1 grid-cols-1">
              <input
                name="search"
                placeholder="Search"
                aria-label="Search"
                className="col-start-1 row-start-1 block size-full bg-white pl-8 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm/6"
              />
              <MagnifyingGlassIcon
                aria-hidden={true}
                className="pointer-events-none col-start-1 row-start-1 size-5 self-center text-gray-400"
              />
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                <span className="sr-only">View notifications</span>
                <BellIcon aria-hidden={true} className="size-6" />
              </button>

              <div aria-hidden={true} className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "size-8",
                  },
                }}
              />
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
