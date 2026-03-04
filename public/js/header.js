// Minimal mobile menu logic only
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
  }
}

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
      setTimeout(() => {
        try {
          backdrop.style.display = "none";
        } catch (err) {}
      }, 220);
    }
  } else {
    if (backdrop) backdrop.style.display = "block";
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
    setTimeout(() => {
      try {
        backdrop.style.display = "none";
      } catch (err) {}
    }, 220);
  }
  if (hamb) hamb.setAttribute("aria-expanded", "false");
}

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
    setTimeout(() => {
      try {
        backdrop.style.display = "none";
      } catch (err) {}
    }, 220);
  }
  if (hamb) hamb.setAttribute("aria-expanded", "false");
}

function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", handleHamburgerClick);
    document.addEventListener("click", handleBodyClick);
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

function initLogoutButtons() {
  const btnLogout = document.getElementById("btnLogout");
  const btnLogoutMobile = document.getElementById("btnLogoutMobile");

  async function handleLogout() {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/login";
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", handleLogout);
  }
  if (btnLogoutMobile) {
    btnLogoutMobile.addEventListener("click", handleLogout);
  }
}

function initHeaderModule() {
  moveDrawerToBody();
  initMobileMenu();
  initLogoutButtons();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeaderModule);
} else {
  initHeaderModule();
}
