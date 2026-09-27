/**
 * Breath — Disclosure enhancement layer.
 *
 * Provides:
 *  - Accordion group behavior (one open at a time within a group)
 *  - Custom events for analytics and cart drawer integration
 *  - Focus retention on toggle (native <details> already handles this,
 *    but we ensure it works across browsers)
 *
 * The <details> element works without this script. This only adds
 * group-level accordion behavior and event dispatch.
 */

class DisclosureGroup extends HTMLElement {
  connectedCallback() {
    this.disclosures = Array.from(this.querySelectorAll("details.disclosure"));
    this.accordion = this.dataset.accordion === "true";

    this.disclosures.forEach((details) => {
      details.addEventListener("toggle", this.handleToggle.bind(this));
    });
  }

  handleToggle(event) {
    const details = event.currentTarget;

    // Accordion mode: close siblings when one opens
    if (this.accordion && details.open) {
      this.disclosures.forEach((other) => {
        if (other !== details && other.open) {
          other.open = false;
        }
      });
    }

    // Dispatch custom event for analytics / integrations
    details.dispatchEvent(
      new CustomEvent("disclosure:toggle", {
        bubbles: true,
        detail: { open: details.open, id: details.id },
      }),
    );
  }
}

customElements.define("disclosure-group", DisclosureGroup);

/**
 * Fallback: if a browser doesn't support the `toggle` event on <details>
 * (older Safari), we polyfill minimal behavior.
 */
if (!("open" in document.createElement("details"))) {
  document.querySelectorAll("details.disclosure").forEach((details) => {
    const summary = details.querySelector("summary");
    summary?.addEventListener("click", (event) => {
      event.preventDefault();
      details.open = !details.open;
    });
  });
}
