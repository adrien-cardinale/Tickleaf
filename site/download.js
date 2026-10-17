;(() => {
  const RELEASES = "https://github.com/adrien-cardinale/Tickleaf/releases/latest"
  const API = "https://api.github.com/repos/adrien-cardinale/Tickleaf/releases/latest"
  const ASSET_PATTERNS = {
    exe: /\.exe$/i,
    msi: /\.msi$/i,
    dmg: /\.dmg$/i,
    deb: /\.deb$/i,
    rpm: /\.rpm$/i,
    appimage: /\.appimage$/i,
    apk: /\.apk$/i,
  }
  const line = document.getElementById("release")
  const megabytes = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`

  function detectOs() {
    const nav = navigator
    const platform = `${nav.userAgentData?.platform || nav.platform || ""} ${nav.userAgent}`
    if (/android/i.test(platform)) return "android"
    if (/iphone|ipad|ipod/i.test(platform) || (/mac/i.test(platform) && nav.maxTouchPoints > 1)) return "web"
    if (/windows|win32|win64/i.test(platform)) return "windows"
    if (/mac/i.test(platform)) return "macos"
    if (/linux|x11|cros/i.test(platform)) return "linux"
    return null
  }

  function markPlatform() {
    const os = detectOs()
    const card = os && document.querySelector(`[data-os="${os}"]`)
    if (!card) return
    card.classList.add("mine")
    card.querySelector("h3").insertAdjacentHTML("beforeend", ' <span class="badge">Your platform</span>')
    card.querySelector(".dl .btn")?.classList.add("primary")
  }

  function fill(release) {
    const page = release.html_url || RELEASES
    const assets = release.assets || []
    for (const button of document.querySelectorAll("[data-asset]")) {
      const asset = assets.find((candidate) => ASSET_PATTERNS[button.dataset.asset].test(candidate.name))
      button.href = asset ? asset.browser_download_url : page
      button.querySelector(".size").textContent = asset ? megabytes(asset.size) : ""
    }
    const link = document.createElement("a")
    link.href = page
    link.textContent = release.tag_name
    const date = release.published_at
      ? ` · ${new Date(release.published_at).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}`
      : ""
    line.replaceChildren("Latest release: ", link, date)
  }

  function fail() {
    const link = document.createElement("a")
    link.href = RELEASES
    link.textContent = "See all releases on GitHub"
    line.replaceChildren(link)
  }

  async function load() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const response = await fetch(API, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(String(response.status))
      const release = await response.json()
      if (!release.tag_name) throw new Error("no release")
      fill(release)
    } catch {
      fail()
    } finally {
      clearTimeout(timer)
    }
  }

  markPlatform()
  load()
})()
