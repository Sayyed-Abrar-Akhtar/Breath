/**
 * Breath — Search Overlay
 * Full-screen dialog with focus trap, Escape close, and focus return.
 */

class SearchOverlay extends HTMLElement {
  connectedCallback() {
    this.triggers = document.querySelectorAll("[data-search-open]");
    this.closeTriggers = this.querySelectorAll("[data-search-close]");
    this.input = this.querySelector('input[type="search"]');
    this.previouslyFocused = null;

    this.triggers.forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        this.open(trigger);
      });
    });

    this.closeTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => this.close());
    });

    this.addEventListener("keydown", this.handleKeydown.bind(this));
  }

  open(trigger) {
    this.previouslyFocused = trigger || document.activeElement;
    this.hidden = false;
    document.body.classList.add("search-open");

    if (this.previouslyFocused) {
      this.previouslyFocused.setAttribute("aria-expanded", "true");
    }

    // Focus input on next tick so the panel has rendered
    requestAnimationFrame(() => this.input?.focus());
  }

  close() {
    this.hidden = true;
    document.body.classList.remove("search-open");

    if (this.previouslyFocused) {
      this.previouslyFocused.setAttribute("aria-expanded", "false");
      this.previouslyFocused.focus();
    }
  }

  handleKeydown(event) {
    if (this.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = this.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

customElements.define("search-overlay", SearchOverlay);
