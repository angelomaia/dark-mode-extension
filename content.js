(() => {
  const STYLE_ID = "simple-dark-mode-style";
  const DEFAULTS = { enabledByDefault: false, sites: {}, brightness: 100, contrast: 90 };
  const host = location.protocol === "file:" ? "local-file" : location.hostname;

  // Media is re-inverted so photos/videos keep their real colors.
  const MEDIA = [
    "img",
    "picture",
    "video",
    "canvas",
    "iframe",
    "embed",
    "object",
    "svg image",
    '[style*="background-image"]',
  ].join(",");

  function buildCss({ brightness, contrast }) {
    return `
      html {
        filter: invert(1) hue-rotate(180deg) brightness(${brightness}%) contrast(${contrast}%) !important;
        background-color: #fff;
        color-scheme: light !important;
      }
      :is(${MEDIA}) {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      /* Don't double-invert media nested inside already re-inverted media */
      :is(${MEDIA}) :is(${MEDIA}) {
        filter: none !important;
      }
      /* Fullscreen video/content: show it untouched */
      html:has(:fullscreen) { filter: none !important; }
      html:has(:fullscreen) :is(${MEDIA}) { filter: none !important; }
    `;
  }

  function apply(settings) {
    const enabled = Object.prototype.hasOwnProperty.call(settings.sites, host)
      ? settings.sites[host]
      : settings.enabledByDefault;

    let style = document.getElementById(STYLE_ID);
    if (!enabled) {
      style?.remove();
      return;
    }
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
    }
    style.textContent = buildCss(settings);
    // documentElement exists at document_start; keep the style last so it wins.
    (document.head || document.documentElement).appendChild(style);
  }

  async function refresh() {
    const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
    apply(settings);
  }

  refresh();
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === "sync") refresh();
  });
  // Re-append once the head exists so page styles can't override ours by order.
  document.addEventListener("DOMContentLoaded", refresh, { once: true });
})();
