/**
 * Breath — Main JS entry.
 */

import "./site-index.js";
import "./disclosure.js";
import "./reveal.js";
import "./quantity-input.js";
import "./facets.js";

/* Cart count live update via Section Rendering API */
document.addEventListener("cart:updated", (event) => {
  const countEl = document.querySelector("[data-cart-count]");
  if (countEl && event.detail?.item_count !== undefined) {
    countEl.textContent = event.detail.item_count;
  }
});
