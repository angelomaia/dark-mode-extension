importScripts("settings.js");

async function updateBadge(tabId, url) {
  const host = hostFromUrl(url || "");
  const on = host ? isEnabledFor(await getSettings(), host) : false;
  await chrome.action.setBadgeText({ tabId, text: on ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: "#3b3b52" });
}

async function updateActiveBadges() {
  const tabs = await chrome.tabs.query({ active: true });
  await Promise.all(tabs.map((t) => updateBadge(t.id, t.url)));
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  updateBadge(tabId, tab.url);
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.url || info.status === "loading") updateBadge(tabId, tab.url);
});

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "sync") updateActiveBadges();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-site") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const host = hostFromUrl(tab?.url || "");
  if (!host) return;
  const settings = await getSettings();
  await setSiteEnabled(host, !isEnabledFor(settings, host));
});
