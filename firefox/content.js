// Apply settings early to prevent flash
browser.storage.local.get(["threadsOnly", "darkMode"]).then((result) => {
  if (result.darkMode !== false) {
    document.documentElement.classList.add("tftv-dark");
  }
  if (result.threadsOnly) {
    document.documentElement.classList.add("tftv-threads-only");
    // Redirect home page to /threads
    if (location.pathname === "/") {
      window.location.replace("/threads");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Inject custom nerdstar gifs
  const nerdstarCSS = document.createElement("style");
  nerdstarCSS.textContent = `
    .tftv-dark .star-0 { background-image: url("${browser.runtime.getURL("nerdstars/nerdstar-4.gif")}") !important; }
    .tftv-dark .star-1 { background-image: url("${browser.runtime.getURL("nerdstars/nerdstar-3.gif")}") !important; }
    .tftv-dark .star-2 { background-image: url("${browser.runtime.getURL("nerdstars/nerdstar-2.gif")}") !important; }
    .tftv-dark .star-3 { background-image: url("${browser.runtime.getURL("nerdstars/nerdstar-1.gif")}") !important; }
  `;
  document.head.appendChild(nerdstarCSS);

  browser.storage.local.get(["threadsOnly", "darkMode"]).then((result) => {
    const darkActive = result.darkMode !== false;
    const threadsActive = !!result.threadsOnly;

    if (darkActive) document.body.classList.add("tftv-dark");
    if (threadsActive) document.body.classList.add("tftv-threads-only");

    // Insert control panel into both locations:
    // 1. Right sidebar (above Live Streams) - visible in normal mode
    // 2. Header nav - visible in threads-only mode
    const rightSidebar = document.getElementById("sidebar-right");
    const nav = document.querySelector(".header-nav");

    // Build a control panel
    function createPanel(location) {
      const panel = document.createElement("div");
      panel.className = "tftv-controls tftv-controls-" + location;

      if (location === "sidebar") {
        panel.classList.add("module");
        const header = document.createElement("div");
        header.className = "module-header tftv-controls-header";
        header.textContent = "TFTV Dark";
        panel.appendChild(header);
      }

      const btnContainer = document.createElement("div");
      btnContainer.className = "tftv-controls-buttons";

      const darkBtn = document.createElement("button");
      darkBtn.className = "tftv-ctrl-btn tftv-dark-btn" + (darkActive ? " tftv-active" : "");
      darkBtn.textContent = darkActive ? "Light Mode" : "Dark Mode";
      btnContainer.appendChild(darkBtn);

      const threadsBtn = document.createElement("button");
      threadsBtn.className = "tftv-ctrl-btn tftv-threads-btn" + (threadsActive ? " tftv-active" : "");
      threadsBtn.textContent = threadsActive ? "Show All" : "Threads Only";
      btnContainer.appendChild(threadsBtn);

      panel.appendChild(btnContainer);
      return panel;
    }

    // Place sidebar panel
    if (rightSidebar) {
      rightSidebar.insertBefore(createPanel("sidebar"), rightSidebar.firstChild);
    }

    // Place nav panel (always visible, used in threads-only mode)
    if (nav) {
      const navPanel = createPanel("nav");
      nav.appendChild(navPanel);
    }

    // Sync all buttons of the same type
    function updateAllButtons(selector, active, activeText, inactiveText) {
      document.querySelectorAll(selector).forEach((btn) => {
        btn.classList.toggle("tftv-active", active);
        btn.textContent = active ? activeText : inactiveText;
      });
    }

    // Dark mode handler
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".tftv-dark-btn");
      if (!btn) return;
      const willBeActive = !document.body.classList.contains("tftv-dark");
      document.body.classList.toggle("tftv-dark", willBeActive);
      document.documentElement.classList.toggle("tftv-dark", willBeActive);
      updateAllButtons(".tftv-dark-btn", willBeActive, "Light Mode", "Dark Mode");
      browser.storage.local.set({ darkMode: willBeActive });
    });

    // Threads only handler
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".tftv-threads-btn");
      if (!btn) return;
      const willBeActive = !document.body.classList.contains("tftv-threads-only");
      document.body.classList.toggle("tftv-threads-only", willBeActive);
      document.documentElement.classList.toggle("tftv-threads-only", willBeActive);
      updateAllButtons(".tftv-threads-btn", willBeActive, "Show All", "Threads Only");
      browser.storage.local.set({ threadsOnly: willBeActive });

      if (willBeActive && location.pathname === "/") {
        window.location.href = "/threads";
      }
    });
    // Auto-redirect empty thread pages to real last page
    if (location.search.includes("page=")) {
      const posts = document.querySelectorAll(".post");
      if (posts.length === 0) {
        const pageLinks = document.querySelectorAll(".btn.mod-page");
        let lastLink = null;
        let maxPage = 0;
        pageLinks.forEach((link) => {
          const num = parseInt(link.textContent.trim(), 10);
          if (num > maxPage) {
            maxPage = num;
            lastLink = link;
          }
        });
        if (lastLink && lastLink.href) {
          window.location.replace(lastLink.href);
          return;
        }
      }
    }

    // Add "last page" buttons to threads with more than 5 pages
    document.querySelectorAll(".thread-inner").forEach((thread) => {
      const visiblePages = thread.querySelectorAll(".thread-pages");
      if (visiblePages.length < 5) return;

      const hiddenPages = thread.querySelectorAll(".thread-pages-hidden");
      const lastPage = hiddenPages.length > 0
        ? hiddenPages[hiddenPages.length - 1]
        : visiblePages[visiblePages.length - 1];

      const lastLink = document.createElement("a");
      lastLink.href = lastPage.href;
      lastLink.className = "tftv-last-page";
      lastLink.textContent = "Last Page";
      lastLink.title = "Page " + lastPage.textContent.trim();

      // Insert on the "Posts:" line inside .blockr.pages
      const pagesBlock = thread.querySelector(".blockr.pages");
      if (pagesBlock) {
        const postCount = pagesBlock.querySelector(".post-count");
        if (postCount) {
          postCount.parentNode.insertBefore(lastLink, postCount.nextSibling);
        }
      }
    });
  });
});
