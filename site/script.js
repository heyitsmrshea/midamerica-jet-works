const siteHeader = document.querySelector(".topbar");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const progress = document.querySelector(".progress");
const forms = document.querySelectorAll("[data-ajax-form]");

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
if (reveals.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
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

  if (values.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    continue;
  }

  let index = 0;
  window.setInterval(() => {
    index = (index + 1) % values.length;
    node.textContent = values[index];
  }, 2600);
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
