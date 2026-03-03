// Header/Navigation module - handles navigation and mobile menu

/**
 * Initialize header and navigation
 */
function initHeaderModule() {
  initNavigation();
  initMobileMenu();
}

/**
 * Initialize navigation button handlers
 */
function initNavigation() {
  const logoutBtn = document.getElementById("btnLogout");
  // Set active nav on page load
  document.addEventListener("DOMContentLoaded", setActiveNav);
  setActiveNav();

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
  if (p === "docs") return (window.location.href = "/docs");
  if (p === "envs") return (window.location.href = "/environments");
  if (p === "features") return (window.location.href = "/features");
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", handleHamburgerClick);
    document.addEventListener("click", handleBodyClick);
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
  const nav = document.getElementById("mainNav");
  if (!nav) return;
  const isOpen = nav.classList.toggle("open");
  const hamb = document.getElementById("hamburger");
  const backdrop = document.getElementById("navBackdrop");
  if (backdrop) {
    backdrop.classList.toggle("visible", isOpen);
  }
  if (hamb) hamb.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

/**
 * Handle clicks outside mobile menu
 * @param {Event} e - The click event
 */
function handleBodyClick(e) {
  const nav = document.getElementById("mainNav");
  if (!nav) return;
  const hamb = document.getElementById("hamburger");
  if (!nav.classList.contains("open")) return;
  const target = e.target;
  if (nav.contains(target) || (hamb && hamb.contains(target))) return;
  nav.classList.remove("open");
  const backdrop = document.getElementById("navBackdrop");
  if (backdrop) backdrop.classList.remove("visible");
  if (hamb) hamb.setAttribute("aria-expanded", "false");
}

// Close drawer when clicking the backdrop (supports tapping the overlay)
document.addEventListener("DOMContentLoaded", function () {
  const backdrop = document.getElementById("navBackdrop");
  if (backdrop) {
    backdrop.addEventListener("click", function () {
      const nav = document.getElementById("mainNav");
      const hamb = document.getElementById("hamburger");
      if (nav) nav.classList.remove("open");
      backdrop.classList.remove("visible");
      if (hamb) hamb.setAttribute("aria-expanded", "false");
    });
  }
});

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", initHeaderModule);
