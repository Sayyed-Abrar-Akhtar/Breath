/**
 * Breath — Cart Drawer
 *
 * Focus-trapped dialog for the cart. Updates via Section Rendering API.
 *
 * Requirements satisfied:
 *  - Escape closes the drawer
 *  - Focus is trapped inside the drawer while open
 *  - Focus returns to the trigger on close
 *  - Quantity changes and removals refresh via AJAX
 *  - Screen reader announces updates via aria-live
 */

class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.triggers = document.querySelectorAll("[data-cart-open]");
    this.closeTriggers = this.querySelectorAll("[data-cart-close]");
    this.previouslyFocused = null;
    this.sectionId = "cart-drawer";

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

    // Quantity changes inside the drawer
    this.addEventListener("change", this.handleQuantityChange.bind(this));

    // Remove buttons
    this.addEventListener("click", this.handleRemove.bind(this));
  }

  open(trigger) {
    this.previouslyFocused = trigger || document.activeElement;
    this.hidden = false;
    document.body.classList.add("cart-drawer-open");

    const closeBtn = this.querySelector(".cart-drawer__close");
    closeBtn?.focus();

    if (this.previouslyFocused) {
      this.previouslyFocused.setAttribute("aria-expanded", "true");
    }
  }

  close() {
    this.hidden = true;
    document.body.classList.remove("cart-drawer-open");

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
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  async handleQuantityChange(event) {
    const target = event.target;
    if (!target.matches('.cart-drawer__quantity input[name="updates[]"]'))
      return;

    const lineKey = target.closest("[data-cart-line-item]")?.dataset
      .cartLineItem;
    if (!lineKey) return;

    const quantity = parseInt(target.value, 10);
    if (isNaN(quantity) || quantity < 0) return;

    await this.updateCart({ [lineKey]: quantity });
  }

  async handleRemove(event) {
    const button = event.target.closest("[data-cart-remove]");
    if (!button) return;

    event.preventDefault();
    const lineKey = button.dataset.lineKey;
    if (!lineKey) return;

    button.disabled = true;
    await this.updateCart({ [lineKey]: 0 });
  }

  async updateCart(updates) {
    const body = {
      updates,
      sections: this.sectionId,
      sections_url: window.location.pathname,
    };

    try {
      const response = await fetch(
        `${window.Shopify.routes.root}cart/update.js`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      // Update the drawer's section HTML
      if (data.sections && data.sections[this.sectionId]) {
        this.updateFromHtml(data.sections[this.sectionId]);
      }

      // Dispatch cart:updated for other components (e.g., header count)
      document.dispatchEvent(
        new CustomEvent("cart:updated", {
          detail: {
            item_count: data.item_count,
            total_price: data.total_price,
          },
        }),
      );

      // Announce for screen readers
      this.announce(
        `${data.item_count} ${data.item_count === 1 ? "item" : "items"} in cart`,
      );
    } catch (error) {
      console.error("Cart update failed:", error);
      window.location.reload();
    }
  }

  updateFromHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const newBody = doc.querySelector("[data-cart-drawer-body]");
    const currentBody = this.querySelector("[data-cart-drawer-body]");

    if (newBody && currentBody) {
      currentBody.replaceWith(newBody);
    }

    const newCount = doc.querySelector("[data-cart-drawer-count]");
    const currentCount = this.querySelector("[data-cart-drawer-count]");
    if (newCount && currentCount) {
      currentCount.textContent = newCount.textContent;
    }
  }

  announce(message) {
    let live = this.querySelector("[data-cart-live]");
    if (!live) {
      live = document.createElement("div");
      live.setAttribute("data-cart-live", "");
      live.setAttribute("aria-live", "polite");
      live.setAttribute("role", "status");
      live.className = "visually-hidden";
      this.appendChild(live);
    }
    live.textContent = message;
  }
}

customElements.define("cart-drawer", CartDrawer);
