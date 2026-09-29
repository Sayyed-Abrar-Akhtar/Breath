/**
 * Breath — Main JS entry.
 */

import "./site-index.js";
import "./disclosure.js";
import "./reveal.js";
import "./quantity-input.js";
import "./facets.js";
import "./cart-drawer.js";
import "./search-overlay.js";

/* Cart count live update */
document.addEventListener("cart:updated", (event) => {
  const countEl = document.querySelector("[data-cart-count]");
  if (countEl && event.detail?.item_count !== undefined) {
    countEl.textContent = event.detail.item_count;
    countEl.classList.toggle(
      "header__cart-count--empty",
      event.detail.item_count === 0,
    );
  }
});
