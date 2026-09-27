/**
 * Breath — Quantity Input
 *
 * Web component for +/- quantity controls.
 * Degrades to a plain number input when JS is disabled.
 */

class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector("input");
    this.decrement = this.querySelector('[name="decrement"]');
    this.increment = this.querySelector('[name="increment"]');

    this.decrement?.addEventListener("click", () => this.step(-1));
    this.increment?.addEventListener("click", () => this.step(1));
    this.input?.addEventListener("change", () => this.validate());

    this.validate();
  }

  step(direction) {
    const current = parseInt(this.input.value, 10) || 0;
    const min = parseInt(this.input.min, 10) || 1;
    const max = parseInt(this.input.max, 10) || Infinity;
    const next = Math.min(Math.max(current + direction, min), max);
    this.input.value = next;
    this.dispatchEvent(
      new CustomEvent("quantity:change", {
        bubbles: true,
        detail: { value: next },
      }),
    );
  }

  validate() {
    const value = parseInt(this.input.value, 10) || 0;
    const min = parseInt(this.input.min, 10) || 1;
    const max = parseInt(this.input.max, 10) || Infinity;

    this.decrement.disabled = value <= min;
    this.increment.disabled = value >= max;
  }
}

customElements.define("quantity-input", QuantityInput);
