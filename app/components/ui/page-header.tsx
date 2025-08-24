import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { type ReactNode } from "react";

interface ActionButton {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
}

interface BackLink {
  href: string;
  label: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: BackLink;
  primaryAction?: ActionButton;
  secondaryActions?: ActionButton[];
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  backLink,
  primaryAction,
  secondaryActions = [],
  children,
}: PageHeaderProps) {
  const renderButton = (action: ActionButton, index?: number) => {
    const Icon = action.icon;
    const isPrimary = action.variant === "primary" || !action.variant;
    
    const buttonContent = (
      <>
        {Icon && <Icon className="-ml-0.5 h-5 w-5" aria-hidden="true" />}
        {action.isLoading ? "Loading..." : action.label}
      </>
    );

    const className = isPrimary
      ? "inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
      : "inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50";

    if (action.href) {
      return (
        <Link key={action.href} href={action.href}>
          <button className={className}>
            {buttonContent}
          </button>
        </Link>
      );
    }

    return (
      <button
        key={index}
        onClick={action.onClick}
        disabled={action.isLoading}
        className={className}
      >
        {buttonContent}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      {backLink && (
        <div>
          <Link
            href={backLink.href}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {backLink.label}
          </Link>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>

        {/* Actions */}
        {(primaryAction || secondaryActions.length > 0) && (
          <div className="flex items-center gap-x-3 w-full sm:w-auto">
            {/* Secondary Actions */}
            {secondaryActions.map((action, index) =>
              renderButton({ ...action, variant: "secondary" }, index)
            )}
            
            {/* Primary Action */}
            {primaryAction && renderButton({ ...primaryAction, variant: "primary" })}
          </div>
        )}
      </div>

      {/* Additional Content */}
      {children}
    </div>
  );
}