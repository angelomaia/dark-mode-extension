// Shared settings helpers (used by popup and background).
// Storage shape:
//   enabledByDefault: boolean   — applies to sites without an override (default: false)
//   sites: { [hostname]: boolean } — per-site overrides
//   brightness, contrast: numbers (percent)

const DEFAULTS = {
  enabledByDefault: false,
  sites: {},
  brightness: 100,
  contrast: 90,
};

async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return { ...DEFAULTS, ...stored };
}

function isEnabledFor(settings, host) {
  if (host && Object.prototype.hasOwnProperty.call(settings.sites, host)) {
    return settings.sites[host];
  }
  return settings.enabledByDefault;
}

async function setSiteEnabled(host, enabled) {
  const settings = await getSettings();
  const sites = { ...settings.sites };
  // Drop the override when it matches the global default, keeping storage small.
  if (enabled === settings.enabledByDefault) {
    delete sites[host];
  } else {
    sites[host] = enabled;
  }
  await chrome.storage.sync.set({ sites });
}

function hostFromUrl(url) {
  try {
    const u = new URL(url);
    return /^https?:$|^file:$/.test(u.protocol) ? u.hostname || "local-file" : null;
  } catch {
    return null;
  }
}
