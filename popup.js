const $ = (id) => document.getElementById(id);

let host = null;

async function render() {
  const settings = await getSettings();

  $("default-toggle").checked = settings.enabledByDefault;
  $("brightness").value = settings.brightness;
  $("contrast").value = settings.contrast;
  $("brightness-out").textContent = `${settings.brightness}%`;
  $("contrast-out").textContent = `${settings.contrast}%`;

  if (host) {
    $("site-toggle").checked = isEnabledFor(settings, host);
    $("reset").disabled = !(host in settings.sites);
  } else {
    $("reset").disabled = true;
  }
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  host = hostFromUrl(tab?.url || "");

  $("host").textContent = host || "Unsupported page";
  $("controls").hidden = !host;
  $("unsupported").hidden = !!host;

  $("site-toggle").addEventListener("change", (e) => setSiteEnabled(host, e.target.checked));

  $("default-toggle").addEventListener("change", (e) =>
    chrome.storage.sync.set({ enabledByDefault: e.target.checked })
  );

  for (const key of ["brightness", "contrast"]) {
    $(key).addEventListener("input", (e) => {
      $(`${key}-out`).textContent = `${e.target.value}%`;
      chrome.storage.sync.set({ [key]: Number(e.target.value) });
    });
  }

  $("reset").addEventListener("click", async () => {
    const { sites } = await getSettings();
    delete sites[host];
    await chrome.storage.sync.set({ sites });
  });

  chrome.storage.onChanged.addListener(render);
  render();
}

init();
