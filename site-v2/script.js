const siteHeader = document.querySelector(".topbar");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const progress = document.querySelector(".progress");
const forms = document.querySelectorAll("[data-ajax-form]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.documentElement.classList.add("is-ready");

if (navToggle && siteHeader) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!siteHeader.contains(event.target)) {
      siteHeader.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  siteNav?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.closest("a")) {
      siteHeader.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const currentPage = document.body.dataset.page;
if (currentPage) {
  for (const link of document.querySelectorAll("[data-nav]")) {
    if (link.getAttribute("data-nav") === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  }
}

const reveals = document.querySelectorAll("[data-reveal]");
if (reveals.length && !prefersReducedMotion.matches) {
  reveals.forEach((node, index) => node.style.setProperty("--reveal-delay", `${Math.min(index * 70, 360)}ms`));

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.14 }
  );

  reveals.forEach((node) => observer.observe(node));

  window.setTimeout(() => {
    reveals.forEach((node) => node.classList.add("is-visible"));
  }, 1800);
} else {
  reveals.forEach((node) => node.classList.add("is-visible"));
}

function updateProgress() {
  if (!progress) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const amount = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
  document.documentElement.style.setProperty("--progress", `${amount}%`);
}

updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

const supportsFinePointer =
  !prefersReducedMotion.matches &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (supportsFinePointer) {
  const interactiveNodes = document.querySelectorAll(
    [
      ".button",
      ".button-secondary",
      ".pill",
      ".service-panel",
      ".grid-card",
      ".value-card",
      ".audience-panel",
      ".timeline__item",
      ".info-card",
      ".metric-card",
      ".signal-card",
      ".footer-card",
      ".contact-grid__card",
      ".form-shell",
      ".site-nav__links a",
      ".nav-toggle"
    ].join(",")
  );

  const updatePointerVars = (event) => {
    const { currentTarget, clientX, clientY } = event;

    if (!(currentTarget instanceof HTMLElement)) {
      return;
    }

    const rect = currentTarget.getBoundingClientRect();
    currentTarget.style.setProperty("--pointer-x", `${clientX - rect.left}px`);
    currentTarget.style.setProperty("--pointer-y", `${clientY - rect.top}px`);
  };

  interactiveNodes.forEach((node) => {
    node.classList.add("pointer-reactive");
    node.addEventListener("pointerenter", (event) => {
      node.classList.add("is-hovered");
      updatePointerVars(event);
    });
    node.addEventListener("pointermove", updatePointerVars);
    node.addEventListener("pointerleave", () => {
      node.classList.remove("is-hovered");
    });
  });
}

const rotatingNodes = document.querySelectorAll("[data-rotator]");
for (const node of rotatingNodes) {
  const values = (node.getAttribute("data-rotator") || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  if (values.length < 2 || prefersReducedMotion.matches) {
    continue;
  }

  let index = 0;
  window.setInterval(() => {
    index = (index + 1) % values.length;
    node.textContent = values[index];
  }, 2600);
}

const typewriterNodes = document.querySelectorAll("[data-typewriter]");
for (const node of typewriterNodes) {
  const fullText = (node.getAttribute("data-typewriter") || node.textContent || "").trim();

  if (!fullText) {
    continue;
  }

  node.setAttribute("aria-label", fullText);

  if (prefersReducedMotion.matches) {
    node.textContent = fullText;
    continue;
  }

  node.textContent = "";
  node.classList.add("is-typing");

  let index = 0;
  const tick = () => {
    index += 1;
    node.textContent = fullText.slice(0, index);

    if (index < fullText.length) {
      window.setTimeout(tick, 14);
    } else {
      node.classList.remove("is-typing");
    }
  };

  window.setTimeout(tick, 120);
}

if (!prefersReducedMotion.matches) {
  const motionScenes = [
    ...document.querySelectorAll(".hero-stage"),
    ...document.querySelectorAll(".image-band"),
    ...document.querySelectorAll(".editorial-photo")
  ];

  let motionFrame = 0;

  const applySceneMotion = () => {
    motionFrame = 0;
    const viewportHeight = window.innerHeight || 1;

    for (const scene of motionScenes) {
      const rect = scene.getBoundingClientRect();
      const centerOffset = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
      const clamped = Math.max(-1, Math.min(1, centerOffset));
      const lift = clamped * -18;
      const badgeShift = clamped * -10;

      scene.style.setProperty("--media-lift", `${lift}px`);
      scene.style.setProperty("--badge-shift", `${badgeShift}px`);

      if (scene.classList.contains("hero-stage")) {
        scene.style.setProperty("--hero-shift", `${clamped * -22}px`);
        scene.style.setProperty("--hero-tilt", `${clamped * 1.7}deg`);

        const cards = scene.querySelectorAll(".hero-stage__card");
        cards.forEach((card, index) => {
          const direction = index === 1 ? -1 : 1;
          card.style.setProperty("--motion-y", `${clamped * direction * 12}px`);
        });
      }
    }
  };

  const requestSceneMotion = () => {
    if (motionFrame) {
      return;
    }

    motionFrame = window.requestAnimationFrame(applySceneMotion);
  };

  requestSceneMotion();
  window.addEventListener("scroll", requestSceneMotion, { passive: true });
  window.addEventListener("resize", requestSceneMotion);
}

async function submitForm(form) {
  const statusNode = form.querySelector(".form-status");
  const submitButton = form.querySelector('button[type="submit"]');
  const action = form.getAttribute("action");

  if (!action || !statusNode || !(submitButton instanceof HTMLButtonElement)) {
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending Request";
  statusNode.className = "form-status is-visible";
  statusNode.textContent = "Coordinating your request...";

  try {
    const payload = new FormData(form);
    const response = await fetch(action, {
      method: "POST",
      body: payload,
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Submission failed.");
    }

    form.reset();
    statusNode.className = "form-status is-visible is-success";
    statusNode.textContent =
      "Request received. A maintenance advisor will follow up using your preferred contact method.";
  } catch (error) {
    statusNode.className = "form-status is-visible is-error";
    statusNode.textContent =
      "We could not send the request digitally. Please call +1 (630) 466-9297 or email service@midamericajetworks.com.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Start a service request";
  }
}

for (const form of forms) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(form);
  });
}
