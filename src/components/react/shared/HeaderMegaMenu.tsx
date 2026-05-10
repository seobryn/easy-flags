import React, { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon";

interface MegaMenuItem {
  href: string;
  label: string;
  icon: "Layers" | "Activity" | "CreditCard" | "AlertCircle" | "Book" | "Code" | "Rocket";
}

interface MegaMenuGroup {
  title: string;
  items: MegaMenuItem[];
}

interface HeaderMegaMenuProps {
  groups: MegaMenuGroup[];
  currentPath: string;
  user?: { username: string } | null;
}

export default function HeaderMegaMenu({
  groups,
  currentPath,
  user,
}: HeaderMegaMenuProps) {
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGroupClick = (index: number) => {
    setOpenGroup(openGroup === index ? null : index);
  };

  const handleLinkClick = () => {
    setOpenGroup(null);
  };

  const isActive = (href: string) => {
    return currentPath.startsWith(href);
  };

  return (
    <div ref={menuRef} className="relative flex items-center gap-1">
      {groups.map((group, index) => (
        <div key={index} className="relative">
          <button
            onClick={() => handleGroupClick(index)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:text-cyan-400 ${
              openGroup === index
                ? "text-cyan-400"
                : user
                ? "text-slate-300"
                : "text-cyan-100"
            }`}
          >
            {group.title}
            <Icon
              name="ChevronDown"
              size={12}
              className={`transition-transform duration-300 ${
                openGroup === index ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-[#0a0f1a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden transition-all duration-300 ${
              openGroup === index
                ? "opacity-100 visible translate-y-0"
                : "opacity-0 invisible -translate-y-2"
            }`}
          >
            <div className="p-2">
              {group.items.map((item, itemIndex) => (
                <a
                  key={itemIndex}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive(item.href)
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-cyan-400"
                    }`}
                  >
                    <Icon name={item.icon} size={16} />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};