/**
 * Breath — Product Form
 *
 * Handles variant selection, price updates, media swaps,
 * URL updates, and add to cart.
 */

class VariantPicker extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.productUrl = this.dataset.productUrl;
    this.variantData = JSON.parse(
      this.querySelector("[data-variant-data]").textContent,
    );
    this.inputs = this.querySelectorAll('input[type="radio"]');
    this.selectedValuesEl = this.querySelectorAll("[data-selected-value]");

    this.inputs.forEach((input) => {
      input.addEventListener("change", () => this.handleChange());
    });

    this.syncFromUrl();
  }

  syncFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const variantId = params.get("variant");
    if (!variantId) return;

    const variant = this.variantData.find(
      (v) => v.id === parseInt(variantId, 10),
    );
    if (!variant) return;

    variant.options.forEach((value, index) => {
      const input = this.querySelector(
        `input[data-option-index="${index}"][value="${CSS.escape(value)}"]`,
      );
      if (input) input.checked = true;
    });
  }

  handleChange() {
    const selectedOptions = [];
    this.querySelectorAll("fieldset").forEach((fieldset, index) => {
      const checked = fieldset.querySelector('input[type="radio"]:checked');
      if (checked) {
        selectedOptions[index] = checked.value;
        const selectedEl = fieldset.querySelector("[data-selected-value]");
        if (selectedEl) selectedEl.textContent = checked.value;
      }
    });

    const variant = this.variantData.find((v) =>
      v.options.every((opt, i) => opt === selectedOptions[i]),
    );

    if (!variant) return;

    this.updateOptionStates(variant);
    this.dispatchEvent(
      new CustomEvent("variant:change", {
        bubbles: true,
        detail: { variant },
      }),
    );
  }

  updateOptionStates(variant) {
    this.querySelectorAll('input[type="radio"]').forEach((input) => {
      const optionIndex = parseInt(input.dataset.optionIndex, 10);
      const value = input.dataset.optionValue;

      const exists = this.variantData.some((v) => {
        if (v.options[optionIndex] !== value) return false;
        for (let i = 0; i < optionIndex; i++) {
          const checked = this.querySelector(
            `fieldset:nth-child(${i + 1}) input:checked`,
          );
          if (checked && v.options[i] !== checked.value) return false;
        }
        return v.available;
      });

      input.disabled = !exists;
      input.closest("label")?.classList.toggle("is-unavailable", !exists);
    });
  }
}

customElements.define("variant-picker", VariantPicker);

/**
 * Product form — reacts to variant changes.
 * Updates price, media, URL, buy button state, pickup availability.
 */
class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector("form");
    this.sectionId = this.dataset.sectionId;
    this.productId = this.dataset.productId;

    document.addEventListener(
      "variant:change",
      this.handleVariantChange.bind(this),
    );
    this.form?.addEventListener("submit", this.handleSubmit.bind(this));
  }

  async handleVariantChange(event) {
    const { variant } = event.detail;
    if (!variant) return;

    // Update hidden input
    const idInput = this.form?.querySelector('input[name="id"]');
    if (idInput) idInput.value = variant.id;

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("variant", variant.id);
    history.replaceState({ variant: variant.id }, "", url.toString());

    // Update buy button
    const button = this.form?.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = !variant.available;
      button.textContent = variant.available
        ? window.theme.strings.add_to_cart || "Add to cart"
        : window.theme.strings.sold_out || "Sold out";
    }

    // Update media
    if (variant.featured_media) {
      this.switchMedia(variant.featured_media.id);
    }

    // Update price via Section Rendering API
    await this.refreshSection();
  }

  switchMedia(mediaId) {
    const stage = document.querySelector("[data-product-media-stage]");
    if (!stage) return;

    stage.querySelectorAll("[data-media-id]").forEach((el) => {
      const matches = parseInt(el.dataset.mediaId, 10) === mediaId;
      el.classList.toggle("is-active", matches);
      el.hidden = !matches;
    });

    document.querySelectorAll("[data-product-media-thumb]").forEach((thumb) => {
      const matches = parseInt(thumb.dataset.mediaId, 10) === mediaId;
      thumb.classList.toggle("is-active", matches);
      thumb.setAttribute("aria-selected", matches ? "true" : "false");
    });
  }

  async refreshSection() {
    const url = new URL(window.location.href);
    url.searchParams.set("section_id", this.sectionId);

    try {
      const response = await fetch(url.toString(), {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!response.ok) return;

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Swap price
      const newPrice = doc.querySelector("[data-product-price]");
      const currentPrice = this.querySelector("[data-product-price]");
      if (newPrice && currentPrice) currentPrice.replaceWith(newPrice);

      // Swap pickup availability
      const newPickup = doc.querySelector("[data-product-pickup]");
      const currentPickup = document.querySelector("[data-product-pickup]");
      if (newPickup && currentPickup) currentPickup.replaceWith(newPickup);

      // Swap installments
      const newInstallments = doc.querySelector("[data-shop-pay-installments]");
      const currentInstallments = document.querySelector(
        "[data-shop-pay-installments]",
      );
      if (newInstallments && currentInstallments) {
        currentInstallments.replaceWith(newInstallments);
      }
    } catch (error) {
      console.error("Failed to refresh section:", error);
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const button = this.form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.classList.add("is-loading");

    try {
      const formData = new FormData(this.form);
      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Add to cart failed");

      const data = await response.json();

      document.dispatchEvent(
        new CustomEvent("cart:updated", {
          detail: { item_count: data.quantity },
        }),
      );

      // Open cart drawer
      document.querySelector("[data-cart-open]")?.click();
    } catch (error) {
      console.error(error);
    } finally {
      button.disabled = false;
      button.classList.remove("is-loading");
    }
  }
}

customElements.define("product-form", ProductForm);

/**
 * Media thumbnails — click to swap the stage.
 */
class ProductMedia extends HTMLElement {
  connectedCallback() {
    this.stage = this.querySelector("[data-product-media-stage]");
    this.thumbs = this.querySelectorAll("[data-product-media-thumb]");

    this.thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () =>
        this.switchTo(thumb.dataset.mediaId),
      );
    });
  }

  switchTo(mediaId) {
    this.stage.querySelectorAll("[data-media-id]").forEach((el) => {
      const matches = el.dataset.mediaId === mediaId;
      el.classList.toggle("is-active", matches);
      el.hidden = !matches;
    });

    this.thumbs.forEach((thumb) => {
      const matches = thumb.dataset.mediaId === mediaId;
      thumb.classList.toggle("is-active", matches);
      thumb.setAttribute("aria-selected", matches ? "true" : "false");
    });
  }
}

customElements.define("product-media", ProductMedia);
