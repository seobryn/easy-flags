import React, { useEffect, useState } from "react";
import type { UserPayload } from "@/utils/auth";

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch user from session/auth endpoint
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-slate-900/50 border-b border-cyan-700/30 backdrop-blur">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <a href="/" className="text-2xl font-bold text-gradient">
              Easy Flags
            </a>
          </div>

          <div className="hidden md:flex gap-8">
            <a
              href="/docs"
              className="text-slate-300 hover:text-cyan-400 transition"
            >
              Docs
            </a>
            <a
              href="/billing"
              className="text-slate-300 hover:text-cyan-400 transition"
            >
              Pricing
            </a>
            {user ? (
              <>
                <a
                  href="/spaces"
                  className="text-slate-300 hover:text-cyan-400 transition"
                >
                  Spaces
                </a>
                <a
                  href="/settings"
                  className="text-slate-300 hover:text-cyan-400 transition"
                >
                  Settings
                </a>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 text-slate-300 hover:text-cyan-400"
                >
                  <span>{user.username}</span>
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
            ) : (
              <>
                <a
                  href="/login"
                  className="text-cyan-100 hover:text-cyan-300 transition"
                >
                  Login
                </a>
                <a href="/create-account" className="btn-primary text-sm">
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
