import React, { useState, useEffect } from "react";
import { MobileMenuPortal } from "./MobileMenuPortal";
import { Icon } from "./Icon";

interface NavItem {
  href: string;
  label: string;
  showFor: boolean;
}

interface MobileMenuProps {
  navItems: {
    pricing: NavItem;
    spaces: NavItem;
    metrics: NavItem;
    planUsage: NavItem;
    alerts: NavItem;
    docs: NavItem;
    apiReference: NavItem;
    login: NavItem;
  };
  user?: { username: string } | null;
  t: {
    navigation: {
      product: string;
      resources: string;
    };
  };
  lang: string;
  currentPath: string;
}

export default function MobileMenu({ navItems, user, t, lang, currentPath }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };
    
    const button = document.getElementById("mobile-menu-button");
    if (button) {
      button.addEventListener("click", handleToggle);
    }

    return () => {
      if (button) {
        button.removeEventListener("click", handleToggle);
      }
    };
  }, []);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const getLocalizedPath = (path: string) => {
    if (path === "/") return `/${lang}`;
    return `/${lang}${path}`;
  };

  return (
    <MobileMenuPortal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="flex flex-col gap-8 w-full">
          {navItems.pricing.showFor && (
            <a 
              href={navItems.pricing.href}
              onClick={handleLinkClick}
              className="mobile-nav-link text-3xl font-bold text-white uppercase tracking-[0.3em] hover:text-cyan-400 transition-colors text-center"
            >
              {navItems.pricing.label}
            </a>
          )}

          {/* Product Group (Logged in users) */}
          {user && (
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 text-center">
                {t.navigation.product || "Product"}
              </span>
              <div className="grid grid-cols-2 gap-4">
                <a href={navItems.spaces.href} onClick={handleLinkClick} className="mobile-nav-link-with-icon">
                  <Icon name="Layers" size={28} className="text-cyan-400" />
                  <span>{navItems.spaces.label}</span>
                </a>
                <a href={navItems.metrics.href} onClick={handleLinkClick} className="mobile-nav-link-with-icon">
                  <Icon name="Activity" size={28} className="text-cyan-400" />
                  <span>{navItems.metrics.label}</span>
                </a>
                <a href={navItems.planUsage.href} onClick={handleLinkClick} className="mobile-nav-link-with-icon">
                  <Icon name="CreditCard" size={28} className="text-cyan-400" />
                  <span>{navItems.planUsage.label}</span>
                </a>
                <a href={navItems.alerts.href} onClick={handleLinkClick} className="mobile-nav-link-with-icon">
                  <Icon name="AlertCircle" size={28} className="text-cyan-400" />
                  <span>{navItems.alerts.label}</span>
                </a>
              </div>
            </div>
          )}

          {/* Resources Group */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 text-center">
              {t.navigation.resources || "Resources"}
            </span>
            <div className="grid grid-cols-2 gap-4">
              <a href={navItems.docs.href} onClick={handleLinkClick} className="mobile-nav-link-with-icon">
                <Icon name="Book" size={28} className="text-cyan-400" />
                <span>{navItems.docs.label}</span>
              </a>
              <a href={navItems.apiReference.href} onClick={handleLinkClick} className="mobile-nav-link-with-icon">
                <Icon name="Code" size={28} className="text-cyan-400" />
                <span>{navItems.apiReference.label}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="w-20 h-px bg-white/10 my-4"></div>

        {user ? (
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-cyan-500/20">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-white text-xl font-medium tracking-tight">{user.username}</span>
            </div>

            <div className="flex flex-col items-center gap-4 mt-2">
              <a href={getLocalizedPath("/billing")} className="text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">Billing</a>
              <a href={getLocalizedPath("/settings")} className="text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">Settings</a>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-widest text-xs font-bold">
                  Logout
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-xs">
            <a href={navItems.login.href} onClick={handleLinkClick} className="text-xl font-bold text-white uppercase tracking-widest hover:text-cyan-400 transition-colors">
              {navItems.login.label}
            </a>
            <a href={getLocalizedPath("/create-account")} onClick={handleLinkClick} className="w-full text-center py-5 rounded-2xl bg-cyan-500 text-white font-bold uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-2xl shadow-cyan-500/20">
              Get Started
            </a>
          </div>
        )}
      </div>

      <style>{`
        .mobile-nav-link-with-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: white;
          font-weight: bold;
          letter-spacing: 0.05em;
          transition: all 0.3s ease;
        }
        .mobile-nav-link-with-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #22d3ee;
          border-color: rgba(6, 182, 212, 0.3);
        }
      `}</style>
    </MobileMenuPortal>
  );
}