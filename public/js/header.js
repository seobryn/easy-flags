// Header/Navigation module - handles navigation and mobile menu

/**
 * Initialize header and navigation
 */
function initHeaderModule() {
  initNavigation();
  moveDrawerToBody();
  initMobileMenu();
}

/**
 * Move mobile drawer and backdrop to document.body to avoid stacking-context issues
 * that can cause the drawer to appear behind transformed/positioned ancestors.
 */
function moveDrawerToBody() {
  if (typeof document === "undefined") return;
  const mobileNav = document.getElementById("mobileNav");
  const backdrop = document.getElementById("navBackdrop");
  try {
    if (backdrop && backdrop.parentElement !== document.body) {
      document.body.appendChild(backdrop);
    }
    if (mobileNav && mobileNav.parentElement !== document.body) {
      document.body.appendChild(mobileNav);
    }
  } catch (err) {
    // ignore errors if DOM modifications are not allowed
    console.error("moveDrawerToBody error:", err);
  }
}

/**
 * Initialize navigation button handlers
 */
function initNavigation() {
  const logoutBtn = document.getElementById("btnLogout");
  // Set active nav on page load
  document.addEventListener("DOMContentLoaded", setActiveNav);
  try {
    setActiveNav();
  } catch (err) {
    // in case DOM isn't ready yet or setActiveNav isn't defined, ignore
  }

  // Handle navigation button clicks
  document
    .querySelectorAll("button[data-nav]")
    .forEach((b) => b.addEventListener("click", handleNavClick));

  if (logoutBtn) {
    logoutBtn.onclick = handleLogout;
  }
}

/**
 * Handle navigation button click
 * @param {Event} e - The click event
 */
function handleNavClick(e) {
  const p = e.target.closest("button[data-nav]").dataset.nav;
  if (p === "docs") {
    closeMobileNav();
    return (window.location.href = "/docs");
  }
  if (p === "envs") {
    closeMobileNav();
    return (window.location.href = "/environments");
  }
  if (p === "features") {
    closeMobileNav();
    return (window.location.href = "/features");
  }
  if (p === "pricing") {
    closeMobileNav();
    return (window.location.href = "/billing");
  }
  if (p === "login") {
    closeMobileNav();
    return (window.location.href = "/login");
  }
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", handleHamburgerClick);
    document.addEventListener("click", handleBodyClick);
    // Backdrop closes the drawer when tapped
    const backdrop = document.getElementById("navBackdrop");
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        closeMobileNav();
      });
    }
    const mobileClose = document.getElementById("mobileClose");
    if (mobileClose) mobileClose.addEventListener("click", closeMobileNav);
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await fetch("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies
    });
  } catch (err) {
    console.error("Logout error:", err);
  }
  window.location.href = "/login";
}

/**
 * Handle hamburger menu toggle
 * @param {Event} e - The click event
 */
function handleHamburgerClick(e) {
  e.stopPropagation();
  const mobileNav = document.getElementById("mobileNav");
  if (!mobileNav) return;
  const backdrop = document.getElementById("navBackdrop");
  const isOpen = mobileNav.classList.contains("translate-x-0");
  if (isOpen) {
    mobileNav.classList.remove("translate-x-0");
    mobileNav.classList.add("-translate-x-full");
    if (backdrop) {
      backdrop.classList.remove("opacity-100");
      backdrop.classList.add("opacity-0");
      backdrop.classList.remove("pointer-events-auto");
      backdrop.classList.add("pointer-events-none");
    }
  } else {
    mobileNav.classList.add("translate-x-0");
    mobileNav.classList.remove("-translate-x-full");
    if (backdrop) {
      backdrop.classList.remove("opacity-0");
      backdrop.classList.add("opacity-100");
      backdrop.classList.remove("pointer-events-none");
      backdrop.classList.add("pointer-events-auto");
    }
  }
  const hamb = document.getElementById("hamburger");
  if (hamb) hamb.setAttribute("aria-expanded", !isOpen ? "true" : "false");
}

/**
 * Handle clicks outside mobile menu
 * @param {Event} e - The click event
 */
function handleBodyClick(e) {
  const mobileNav = document.getElementById("mobileNav");
  if (!mobileNav) return;
  const hamb = document.getElementById("hamburger");
  if (!mobileNav.classList.contains("translate-x-0")) return;
  const target = e.target;
  if (mobileNav.contains(target) || (hamb && hamb.contains(target))) return;
  mobileNav.classList.remove("translate-x-0");
  mobileNav.classList.add("-translate-x-full");
  const backdrop = document.getElementById("navBackdrop");
  if (backdrop) {
    backdrop.classList.remove("opacity-100");
    backdrop.classList.add("opacity-0");
    backdrop.classList.remove("pointer-events-auto");
    backdrop.classList.add("pointer-events-none");
  }
  if (hamb) hamb.setAttribute("aria-expanded", "false");
}

/**
 * Close mobile nav/drawer and hide backdrop.
 */
function closeMobileNav() {
  const mobileNav = document.getElementById("mobileNav");
  const backdrop = document.getElementById("navBackdrop");
  const hamb = document.getElementById("hamburger");
  if (mobileNav) {
    mobileNav.classList.remove("translate-x-0");
    mobileNav.classList.add("-translate-x-full");
  }
  if (backdrop) {
    backdrop.classList.remove("opacity-100");
    backdrop.classList.add("opacity-0");
    backdrop.classList.remove("pointer-events-auto");
    backdrop.classList.add("pointer-events-none");
  }
  if (hamb) hamb.setAttribute("aria-expanded", "false");
}

/**
 * Highlight the active nav button based on current path.
 */
function setActiveNav() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "/";
  let target = null;
  if (path.startsWith("/environments")) target = "envs";
  else if (path.startsWith("/features")) target = "features";
  else if (path.startsWith("/docs") || path.startsWith("/api")) target = "docs";
  else if (path.startsWith("/billing")) target = "pricing";
  else if (path.startsWith("/login")) target = "login";

  document.querySelectorAll("button[data-nav]").forEach((b) => {
    try {
      if (b.dataset && b.dataset.nav === target) b.classList.add("active");
      else b.classList.remove("active");
    } catch (err) {
      // ignore individual element issues
    }
  });
}

// Initialize on DOMContentLoaded or immediately if DOM already ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeaderModule);
} else {
  initHeaderModule();
}
