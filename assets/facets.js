/**
 * Breath — Facets
 *
 * Progressive enhancement for faceted filtering.
 *
 * Without JS: the form submits normally to the collection URL.
 * With JS: intercepts changes, fetches the new grid via the
 * Section Rendering API, and swaps it in without a full reload.
 *
 * Uses history.pushState so back/forward works.
 */

class FacetForm extends HTMLElement {
  connectedCallback() {
    this.form = this;
    this.gridTarget = this.dataset.gridTarget || "[data-product-grid]";
    this.loading = this.querySelector("[data-facets-loading]");
    this.controller = null;

    // Intercept change events on all inputs/selects
    this.addEventListener("change", this.handleChange.bind(this));
    // Intercept clicks on filter pills and clear buttons
    this.addEventListener("click", this.handleClick.bind(this));

    // Restore grid on back/forward navigation
    window.addEventListener("popstate", this.handlePopState.bind(this));
  }

  handleChange(event) {
    const target = event.target;
    if (!target.name) return;
    // Ignore the sort select — handled separately
    if (target.dataset.sortSelect !== undefined) return;

    this.updateGrid();
  }

  handleClick(event) {
    const link = event.target.closest("a");
    if (!link) return;

    // Filter pill remove, clear all
    const url = new URL(link.href, window.location.origin);
    if (url.pathname === window.location.pathname) {
      event.preventDefault();
      this.updateGrid(url);
    }
  }

  handlePopState() {
    this.refreshGrid(window.location.href);
  }

  buildUrl() {
    const url = new URL(
      this.action || window.location.href,
      window.location.origin,
    );
    const formData = new FormData(this.form);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (value !== "" && value != null) {
        params.append(key, value);
      }
    }

    // Preserve existing params not managed by the form (e.g., sort_by)
    const currentUrl = new URL(window.location.href);
    for (const [key, value] of currentUrl.searchParams.entries()) {
      if (key === "sort_by" && !params.has("sort_by")) {
        params.set(key, value);
      }
    }

    url.search = params.toString();
    return url;
  }

  async updateGrid(explicitUrl) {
    const url = explicitUrl || this.buildUrl();
    await this.refreshGrid(url.toString(), true);
  }

  async refreshGrid(urlString, pushState = false) {
    // Cancel any in-flight request
    this.controller?.abort();
    this.controller = new AbortController();

    this.showLoading(true);

    try {
      const url = new URL(urlString, window.location.origin);
      url.searchParams.set("section_id", this.getSectionId());

      const response = await fetch(url.toString(), {
        signal: this.controller.signal,
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      this.replaceSection(doc, "[data-facets]", ".facets");
      this.replaceSection(doc, this.gridTarget, this.gridTarget);
      this.replaceSection(doc, "[data-facets-count]", "[data-facets-count]");

      if (pushState) {
        history.pushState({ facets: true }, "", urlString);
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Facet update failed:", error);
      // Fallback to full navigation
      window.location.href = urlString;
    } finally {
      this.showLoading(false);
    }
  }

  replaceSection(doc, selector) {
    const newEl = doc.querySelector(selector);
    const currentEl = document.querySelector(selector);
    if (newEl && currentEl) {
      currentEl.replaceWith(newEl);
    }
  }

  getSectionId() {
    // Try to read section id from the enclosing section wrapper
    const sectionEl = this.closest("[data-section-id]");
    return sectionEl?.dataset.sectionId || "main-collection";
  }

  showLoading(state) {
    if (!this.loading) return;
    this.loading.hidden = !state;
  }
}

customElements.define("facet-form", FacetForm);

/**
 * Sort dropdown — separate small controller.
 * On change, updates URL and refreshes the grid (or does a full nav).
 */
class SortDropdown extends HTMLElement {
  connectedCallback() {
    this.select = this.querySelector("[data-sort-select]");
    this.select?.addEventListener("change", this.handleChange.bind(this));
  }

  handleChange() {
    const url = new URL(window.location.href);
    url.searchParams.set("sort_by", this.select.value);
    url.searchParams.delete("page");
    window.location.href = url.toString();
  }
}

customElements.define("sort-dropdown", SortDropdown);
