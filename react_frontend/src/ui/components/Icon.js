import React from "react";

const commonProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
};

function Path({ d }) {
  return <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
}

// PUBLIC_INTERFACE
export function Icon({ name }) {
  /** Minimal icon set used throughout the UI. */
  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <Path d="M3 13h8V3H3v10Z" />
          <Path d="M13 21h8V11h-8v10Z" />
          <Path d="M13 3h8v6h-8V3Z" />
          <Path d="M3 21h8v-6H3v6Z" />
        </svg>
      );
    case "folder":
      return (
        <svg {...commonProps}>
          <Path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
          <Path d="M3 7a2 2 0 0 1 2-2h5l2 2h9" />
        </svg>
      );
    case "checklist":
      return (
        <svg {...commonProps}>
          <Path d="M9 6h12" />
          <Path d="M9 12h12" />
          <Path d="M9 18h12" />
          <Path d="M3.5 6l1.5 1.5L7 5" />
          <Path d="M3.5 12l1.5 1.5L7 11" />
          <Path d="M3.5 18l1.5 1.5L7 17" />
        </svg>
      );
    case "user":
      return (
        <svg {...commonProps}>
          <Path d="M20 21a8 8 0 0 0-16 0" />
          <Path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...commonProps}>
          <Path d="M10 17l5-5-5-5" />
          <Path d="M15 12H3" />
          <Path d="M21 3v18" />
        </svg>
      );
    case "search":
      return (
        <svg {...commonProps}>
          <Path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          <Path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case "spark":
      return (
        <svg {...commonProps}>
          <Path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2Z" />
          <Path d="M5 14l.7 2.6L8 17.3 5.4 18 5 20l-.7-2.6L2 16.7 4.6 16 5 14Z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...commonProps}>
          <Path d="M12 5v14" />
          <Path d="M5 12h14" />
        </svg>
      );
    case "edit":
      return (
        <svg {...commonProps}>
          <Path d="M12 20h9" />
          <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      );
    case "trash":
      return (
        <svg {...commonProps}>
          <Path d="M3 6h18" />
          <Path d="M8 6V4h8v2" />
          <Path d="M6 6l1 16h10l1-16" />
          <Path d="M10 11v6" />
          <Path d="M14 11v6" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <Path d="M12 20h.01" />
          <Path d="M12 4h.01" />
        </svg>
      );
  }
}
