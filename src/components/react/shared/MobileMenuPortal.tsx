import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface MobileMenuPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileMenuPortal({ isOpen, onClose, children }: MobileMenuPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-start pt-20 pb-8 transition-all duration-300 ease-in-out overflow-y-auto ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      style={{
        background: "#06080f",
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-cyan-400 transition-all"
        aria-label="Close menu"
      >
        <Icon name="X" size={20} />
      </button>

      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full px-10">
        {children}
      </div>
    </div>,
    document.body
  );
}