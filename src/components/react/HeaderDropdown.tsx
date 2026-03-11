import React, { useState } from "react";

interface HeaderDropdownProps {
  username: string;
}

export default function HeaderDropdown({ username }: HeaderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        console.error("Logout failed with status:", response.status);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-slate-300 hover:text-cyan-400"
      >
        <span>{username}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-cyan-700/30 rounded-lg shadow-lg z-50">
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-cyan-400 transition rounded-lg"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
