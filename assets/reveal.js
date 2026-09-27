/**
 * Breath — Scroll Reveal
 *
 * Progressive enhancement for the .reveal wrapper.
 * Without JS, content is fully visible.
 * With JS, elements fade in as they enter the viewport.
 *
 * Respects prefers-reduced-motion. Uses IntersectionObserver only.
 * No animation libraries. No layout thrashing.
 */

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

function initReveal() {
  const reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length === 0) return;

  // Progressive enhancement: only hide content when JS is running
  // and the user has not requested reduced motion.
  if (!prefersReducedMotion) {
    document.documentElement.classList.add("js-reveal");
  }

  // If reduced motion is on, mark everything revealed and bail.
  if (prefersReducedMotion) {
    reveals.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const variant = el.dataset.revealVariant;
        const delay = parseInt(el.dataset.revealDelay || "80", 10);

        if (variant === "stagger") {
          const children = Array.from(el.children);
          children.forEach((child, index) => {
            child.style.transitionDelay = `${index * delay}ms`;
          });
        }

        el.classList.add("is-revealed");
        observer.unobserve(el);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -5% 0px",
    },
  );

  reveals.forEach((el) => {
    const threshold = parseFloat(el.dataset.revealThreshold || "0.15");
    observer.observe(el);
  });
}

// Run on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReveal);
} else {
  initReveal();
}

// Expose for section re-rendering (Section Rendering API)
document.addEventListener("shopify:section:load", (event) => {
  const newReveals = event.target.querySelectorAll("[data-reveal]");
  if (newReveals.length === 0) return;

  if (prefersReducedMotion) {
    newReveals.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
  );

  newReveals.forEach((el) => observer.observe(el));
});
