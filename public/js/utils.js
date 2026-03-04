// Utilities and shared functions

const api = "/api";

/**
 * Make an authenticated fetch request
 * Cookies are sent automatically with credentials: 'include'
 * @param {string} url - The URL to fetch
 * @param {object} opts - Fetch options
 * @returns {Promise<object>} The JSON response
 */
function authFetch(url, opts = {}) {
  opts.headers = opts.headers || {};
  opts.headers["Content-Type"] = "application/json";
  opts.credentials = "include"; // Include cookies in request
  return fetch(url, opts).then((r) => r.json());
}

/**
 * Show the login view
 */
function showLogin() {
  const lm = document.getElementById("loginMsg");
  if (lm) {
    lm.innerText = "";
    lm.classList.remove("login-error");
    lm.removeAttribute("role");
  }
  document.getElementById("login").style.display = "flex";
  document.getElementById("main").style.display = "none";
}

/**
 * Show the main view
 */
function showMain() {
  const lm = document.getElementById("loginMsg");
  if (lm) {
    lm.innerText = "";
    lm.classList.remove("login-error");
    lm.removeAttribute("role");
  }
  document.getElementById("login").style.display = "none";
  document.getElementById("main").style.display = "block";
  navigateFromLocation();
}

/**
 * Navigate to a specific page
 * @param {string} page - The page to navigate to
 */
function navigate(page) {
  document
    .querySelectorAll("#pages .page")
    .forEach((p) => (p.style.display = "none"));
  const el = document.getElementById("page-" + page);
  if (el) el.style.display = "block";
  document
    .querySelectorAll("button[data-nav]")
    .forEach((b) => b.classList.toggle("active", b.dataset.nav === page));

  if (page === "envs") loadEnvs();
  if (page === "features") {
    loadEnvs();
    loadFeatures();
  }

  // close mobile nav when navigating
  closeMobileNav();
}

/**
 * Navigate based on hash or query parameter
 */
function navigateFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const navParam = params.get("nav");
  const hash = (window.location.hash || "").replace("#", "");
  const page = navParam || hash || "envs";
  navigate(page);
}

/**
 * Set active navigation button
 */
function setActiveNav() {
  const path = window.location.pathname;
  const navMap = {
    "/environments": "envs",
    "/features": "features",
    "/docs": "docs",
    "/users": "users",
  };
  const currentNav = navMap[path];
  if (currentNav) {
    document
      .querySelectorAll("button[data-nav]")
      .forEach((b) =>
        b.classList.toggle("active", b.dataset.nav === currentNav),
      );
  }
}

/**
 * Close mobile navigation
 */
function closeMobileNav() {
  const mobileNav = document.getElementById("mainNav");
  const hamburger = document.getElementById("hamburger");
  if (mobileNav && mobileNav.classList.contains("open")) {
    mobileNav.classList.remove("open");
    if (hamburger) hamburger.setAttribute("aria-expanded", "false");
  }
}

/**
 * Close open modal dialogs when Escape is pressed
 */
function handleEscapeForModals(event) {
  if (event.key !== "Escape") return;

  const modalIds = ["modal", "envModal"];
  modalIds.forEach((modalId) => {
    const modal = document.getElementById(modalId);
    if (modal && modal.style.display !== "none") {
      modal.style.display = "none";
    }
  });
}

/**
 * Initialize shared keyboard shortcuts
 */
function initSharedKeyboardShortcuts() {
  document.addEventListener("keydown", handleEscapeForModals);
}

/**
 * Validate a feature key
 * @param {string} key - The feature key to validate
 * @returns {object} { valid: boolean, message: string }
 */
function validateFeatureKey(key) {
  if (!key || key.trim().length === 0)
    return { valid: false, message: "Feature key is required" };
  if (/\s/.test(key))
    return { valid: false, message: "Feature key cannot contain spaces" };
  if (!/^[A-Za-z0-9_-]+$/.test(key))
    return {
      valid: false,
      message: "Allowed characters: letters, numbers, - and _",
    };
  if (key.length > 64)
    return { valid: false, message: "Feature key too long (max 64 chars)" };
  return { valid: true };
}

// Storage for data
window._envs = [];
window._features = [];
window._loadFlagsSeq = 0;

document.addEventListener("DOMContentLoaded", initSharedKeyboardShortcuts);
