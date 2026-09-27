class SiteIndex extends HTMLElement {
  connectedCallback() {
    this.trigger = document.querySelector("[data-site-index-open]");
    this.closeBtn = this.querySelector("[data-site-index-close]");
    this.previouslyFocused = null;

    this.trigger?.addEventListener("click", () => this.open());
    this.closeBtn?.addEventListener("click", () => this.close());
    this.addEventListener("click", (e) => this.handleBackdropClick(e));
    this.addEventListener("keydown", (e) => this.handleKeydown(e));
  }

  open() {
    this.previouslyFocused = document.activeElement;
    this.hidden = false;
    document.body.classList.add("site-index-open");
    this.closeBtn?.focus();
  }

  close() {
    this.hidden = true;
    document.body.classList.remove("site-index-open");
    this.previouslyFocused?.focus();
  }

  handleBackdropClick(event) {
    if (event.target === this) this.close();
  }

  handleKeydown(event) {
    if (event.key === "Escape") {
      this.close();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = this.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

customElements.define("site-index", SiteIndex);
