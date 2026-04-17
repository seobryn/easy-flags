import React, { useState, useRef, useEffect, useMemo } from "react";
import { Icon } from "../shared/Icon";
import { useTranslate } from "@/infrastructure/i18n/context";
import type { AvailableLanguages } from "@/infrastructure/i18n/locales";

interface Option {
  value: string;
  label: string;
  flag?: string;
}

interface BillingSelectorProps {
  label: string;
  value: string;
  onChange: (value: string, label: string) => void;
  options: Option[];
  placeholder?: string;
  searchable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  initialLocale?: AvailableLanguages;
}

export const BillingSelector: React.FC<BillingSelectorProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  searchable = false,
  loading = false,
  disabled = false,
  className = "",
  initialLocale,
}) => {
  const t = useTranslate(initialLocale);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery("");
      setActiveIndex(-1);
    }
  }, [isOpen, searchable]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && activeIndex >= 0) {
          const opt = filteredOptions[activeIndex];
          onChange(opt.value, opt.label);
          setIsOpen(false);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "Tab":
        if (isOpen) setIsOpen(false);
        break;
    }
  };

  const selectOption = (opt: Option) => {
    onChange(opt.value, opt.label);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
        {label}
      </label>
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between px-5 py-3.5 bg-slate-950/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-inner text-left disabled:opacity-50 ${
          isOpen ? "border-cyan-500/50 ring-4 ring-cyan-500/10" : ""
        }`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.flag && <span>{selectedOption.flag}</span>}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-slate-700">{placeholder || t("billing.selectPlaceholder")}</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="w-3 h-3 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          )}
          <span className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
            <Icon name="ChevronDown" size={16} className="text-slate-500" />
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full bg-[#0b0e14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
          {searchable && (
            <div className="p-3 border-b border-white/5 bg-white/2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icon name="Search" size={14} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("billing.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/30 transition-all"
                />
              </div>
            </div>
          )}

          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto py-2 custom-scrollbar"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={value === opt.value}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`px-5 py-2.5 text-sm flex items-center gap-3 cursor-pointer transition-colors ${
                    activeIndex === index
                      ? "bg-cyan-500/10 text-cyan-400"
                      : value === opt.value
                      ? "bg-white/5 text-white font-medium"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {opt.flag && <span className="text-base">{opt.flag}</span>}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {value === opt.value && (
                    <Icon name="Check" size={14} className="text-cyan-500" />
                  )}
                </li>
              ))
            ) : (
              <li className="px-5 py-4 text-xs text-slate-600 text-center uppercase tracking-widest font-bold">
                {t("billing.noResults")}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
