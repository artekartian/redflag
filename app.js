(function () {
  // =========================
  // Helpers
  // =========================
  const mailTo = "kontakt@redflag.tech";
  const enc = (s) => encodeURIComponent(s);

  function highlight(el) {
    if (!el) return;
    el.classList.add("is-highlighted");
    setTimeout(() => el.classList.remove("is-highlighted"), 1600);
  }

  function scrollToEl(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    highlight(el);
  }

  // =========================
  // Mobile menu
  // =========================
  const menuBtn = document.getElementById("menuBtn");
  const overlay = document.getElementById("overlay");
  const menu = document.getElementById("mobileMenu");
  const menuClose = document.getElementById("menuClose");

  let lastFocus = null;

  function isMenuOpen() {
    return menuBtn && menuBtn.getAttribute("aria-expanded") === "true";
  }

  function openMenu() {
    if (!menuBtn || !overlay || !menu) return;
    lastFocus = document.activeElement;

    menu.hidden = false;
    overlay.hidden = false;

    requestAnimationFrame(() => {
      menu.classList.add("active");
      overlay.classList.add("active");
      menuBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      document.body.classList.add("menu-open"); // sticky CTA hide
    });

    const firstLink = menu.querySelector("a");
    if (firstLink) setTimeout(() => firstLink.focus(), 50);
  }

  function closeMenu() {
    if (!menuBtn || !overlay || !menu) return;

    menu.classList.remove("active");
    overlay.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.body.classList.remove("menu-open"); // sticky CTA show

    setTimeout(() => {
      menu.hidden = true;
      overlay.hidden = true;
      if (lastFocus) lastFocus.focus();
    }, 260);
  }

  function toggleMenu() {
    isMenuOpen() ? closeMenu() : openMenu();
  }

  if (menuBtn) menuBtn.addEventListener("click", toggleMenu);
  if (menuClose) menuClose.addEventListener("click", closeMenu);
  if (overlay) overlay.addEventListener("click", closeMenu);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMenuOpen()) closeMenu();
  });

  if (menu) {
    menu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) closeMenu();
    });
  }

  // =========================
  // Sticky CTA: padding helper
  // =========================
  const sticky = document.querySelector(".sticky-cta");
  if (sticky) document.body.classList.add("has-sticky-cta");

  // =========================
  // Auto-active link (desktop + mobile)
  // =========================
  function normalizePath(path) {
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path;
  }

  function getCurrentFile() {
    const p = normalizePath(window.location.pathname);
    const parts = p.split("/");
    const last = parts[parts.length - 1] || "index.html";
    return last === "" ? "index.html" : last;
  }

  function cleanHref(href) {
    try {
      const u = new URL(href, window.location.href);
      const path = normalizePath(u.pathname);
      const parts = path.split("/");
      return parts[parts.length - 1] || "index.html";
    } catch {
      return href;
    }
  }

  function setActiveLinks(containerSelector) {
    const current = getCurrentFile();
    const links = document.querySelectorAll(containerSelector + " a");

    links.forEach((a) => a.classList.remove("active"));

    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;

      if (href.startsWith("#")) return;

      if (href.includes("/blog")) {
        const isBlog = window.location.pathname.includes("/blog");
        if (isBlog) a.classList.add("active");
        return;
      }

      const file = cleanHref(href);
      if (file === current) a.classList.add("active");

      if (current === "index.html") {
        if (href === "./" || href === "/") a.classList.add("active");
      }
    });
  }

  setActiveLinks(".nav-links");
  setActiveLinks("#mobileMenu");

  // =========================
  // Pricing -> Timeline: click "Zakres"
  // =========================
  document.querySelectorAll(".js-scope").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = btn.getAttribute("data-target") || btn.getAttribute("href");
      if (!target || !target.startsWith("#")) return;
      e.preventDefault();

      scrollToEl(target);

      // highlight matching plan card (#scope-basic -> #plan-basic)
      const maybePlanId = target.replace("#scope-", "#plan-");
      highlight(document.querySelector(maybePlanId));
    });
  });

  // =========================
  // Mailto generator for plan buttons
  // =========================
  function buildMailto(plan, extraState) {
    const subject = `RedFlag – ${plan} (Microsoft 365) – 15 min`;

    const body =
`Pakiet: ${plan}
Liczba użytkowników:
Etap: ${extraState?.stage || "(nie wybrano)"}
Migracja: ${extraState?.migration || "(nie wybrano)"}
Security: ${extraState?.security || "(nie wybrano)"}
Problem: (phishing / logowania / urządzenia / backup)
Obecne licencje:

Chcę umówić 15 min.`;

    return `mailto:${mailTo}?subject=${enc(subject)}&body=${enc(body)}`;
  }

  document.querySelectorAll(".js-mailto").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const plan = a.getAttribute("data-plan") || "Standard";
      window.location.href = buildMailto(plan, {});
    });
  });

  // =========================
  // Flow decision (2.3)
  // =========================
  const flow = document.querySelector("[data-flow]");
  if (flow) {
    const state = { stage: null, migration: null, security: null };

    function setActive(groupEl, value) {
      groupEl.querySelectorAll(".pill-btn").forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-v") === value);
      });
    }

    function recommend() {
      // Premium wins if DLP/MDM/monitoring
      if (state.security === "dlp-mdm") return "Premium";

      // Standard if migration or CA/mail security or already have MFA
      if (state.migration === "mail" || state.migration === "mail-data") return "Standard";
      if (state.security === "ca-mail") return "Standard";
      if (state.stage === "have-mfa") return "Standard";

      return "Basic";
    }

    function updateUI() {
      const plan = recommend();

      // Write recommendation
      const p = flow.querySelector("[data-result] p");
      if (p) {
        const reason =
          plan === "Premium"
            ? "Wybrałeś DLP/MDM/monitoring — to jest poziom Premium."
            : plan === "Standard"
            ? "Masz migrację lub potrzebujesz CA/ochrony poczty — Standard jest właściwy."
            : "Potrzebujesz fundamentu tenant/konta/MFA — Basic jest właściwym startem.";
        p.textContent = `Rekomendowany pakiet: ${plan}. ${reason}`;
      }

      // Highlight plan card if exists
      const planMap = { Basic: "#plan-basic", Standard: "#plan-standard", Premium: "#plan-premium" };
      highlight(document.querySelector(planMap[plan]));

      // Set mailto
      const mailBtn = flow.querySelector("[data-flow-mail]");
      if (mailBtn) mailBtn.href = buildMailto(plan, state);

      // Set scope link (fallback to #pakiety if scopes not present)
      const scopeBtn = flow.querySelector("[data-flow-scope]");
      if (scopeBtn) {
        const scopeMap = { Basic: "#scope-basic", Standard: "#scope-standard", Premium: "#scope-premium" };
        const target = document.querySelector(scopeMap[plan]) ? scopeMap[plan] : "#pakiety";
        scopeBtn.href = target;
        scopeBtn.textContent = document.querySelector(scopeMap[plan]) ? `Zobacz zakres ${plan}` : `Zobacz pakiety (${plan})`;
      }
    }

    flow.querySelectorAll(".flow-options").forEach((group) => {
      group.addEventListener("click", (e) => {
        const btn = e.target.closest(".pill-btn");
        if (!btn) return;

        const q = group.getAttribute("data-q");
        const v = btn.getAttribute("data-v");
        if (!q) return;

        state[q] = v;
        setActive(group, v);
        updateUI();
      });
    });

    updateUI();
    console.log("Flow działa ✅");
  }
})();