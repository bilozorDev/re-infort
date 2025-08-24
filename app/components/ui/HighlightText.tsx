"use client";

import { Fragment } from "react";

interface HighlightTextProps {
  text: string;
  searchQuery?: string;
  className?: string;
}

export default function HighlightText({ text, searchQuery, className = "" }: HighlightTextProps) {
  if (!searchQuery || searchQuery.trim() === "") {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters in the search query
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const escapedQuery = escapeRegex(searchQuery.trim());
  
  // Create case-insensitive regex
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  
  // Split text by the search term
  const parts = text.split(regex);
  
  if (parts.length === 1) {
    // No match found
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the search term (case-insensitive)
        const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
        
        return (
          <Fragment key={index}>
            {isMatch ? (
              <mark className="bg-yellow-200 text-inherit rounded-sm px-0.5">
                {part}
              </mark>
            ) : (
              part
            )}
          </Fragment>
        );
      })}
    </span>
  );
}