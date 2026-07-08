import playerStyles from "./style.css?inline";

const CONSOLE_PREFIX = "audio-tour-player: "

class AudioTourPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        // State
        this.tourData = null;
        this.currentIndex = 0;
        this.detailIndex = null; // Tracks if we are inside a nested stop
        this.tourPath = this.getAttribute('src') || './tours/st-nuns.json'; // provide something for developers
        this.cacheName = this.getAttribute('cache-name') || 'audio-tour-player-cache-v1';
        console.log(CONSOLE_PREFIX + "Using cache name:", this.cacheName);
        this.environment = this.getAttribute('environment') || 'browser';
        this.showOffline = (this.getAttribute('offline-capable') === 'false') ? false : true; // assume we want to show the download for offline button
        console.log(CONSOLE_PREFIX + "Offline capable:", this.showOffline);
        this.isOfflineReady = false;
        
        // storage interface
        this.storage = this.getBrowserStorage(); // Default to browser
        this.percentCached = 0; // shortcut to remember the percentage
        this.urlRewriter = async (url) => {
            if (this.storage.cacheIt) { // if another storage interface is injected it may or may not have a cacheIt function
                // Be greedy and try to aysnchronously fetch and cache this media content
                this.storage.cacheIt(url, this.cacheName);
            } else {
                console.warn(CONSOLE_PREFIX + "No cacheIt function in storage interface; skipping caching for:", url);
            }
            // Default (browser): just return the URL (Capacitor apps using this library will over-ride this function)
            return url;
        } 
        this.downloadBtnText = ''; // for storing the download button text for collapsing

        // SVG icons
        this.playIcon = `
<svg viewBox="0 0 402.917 402.917" width="24" height="24" fill="#FFFFFF">
    <path d="m 102.42908,20.02572 v 361.213 c 0,7.447 3.972,14.333 10.427,18.063 6.46,3.724 14.398,3.724 20.853,0 l 216.443,-180.609 c 6.452,-3.719 10.436,-10.604 10.436,-18.058 0,-7.451 -3.978,-14.34 -10.436,-18.061 L 133.70808,1.9677204 c -3.227,-1.86199999 -6.826,-2.79 -10.426,-2.79 -3.605,0 -7.199,0.93400001 -10.427,2.79 -6.455,3.718 -10.426,10.6069986 -10.426,18.0579996 z"/>
</svg>`;
        this.pauseIcon = `
<svg viewBox="0 0 402.917 402.917" width="24" height="24" fill="#FFFFFF">
    <path d="M85 0 h90 v402.917 h-90 z M227.917 0 h90 v402.917 h-90 z"/>
</svg>`;
        this.restartIcon = `
<svg viewBox="0 0 24 24" width="24" height="24" fill="#FFFFFF">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
</svg>`;
        this.headphonesIcon = `
    <svg viewBox="0 0 330 330" width="24" height="24" fill="#000000" style="display: block;">
        <path d="M300,175.799v-21.557c0-74.44-60.561-135-135-135s-135,60.56-135,135v21.557
            c-18.204,13.697-30,35.476-30,59.959c0,41.355,33.644,75,75,75c8.284,0,15-6.716,15-15v-120c0-8.284-6.716-15-15-15
            c-5.136,0-10.152,0.521-15,1.51v-8.025c0-57.897,47.103-105,105-105s105,47.103,105,105v8.025c-4.848-0.989-9.864-1.51-15-1.51
            c-8.284,0-15,6.716-15,15v120c0,8.284,6.716,15,15,15c41.355,0,75-33.645,75-75C330,211.274,318.204,189.496,300,175.799z"/>
    </svg>`;
        this.leftArrow = `
    <svg viewBox="0 0 565.88 565.88" width="24" height="24" fill="currentColor">
        <path d="m228.08 517.36c5.976 5.977 10.819 3.97 10.819-4.482v-65.569c0-8.449 6.852-15.301 15.301-15.301h296.38c8.449 0 15.301-6.851 15.301-15.3v-267.53c0-8.448-6.852-15.3-15.301-15.3h-296.38c-8.449 0-15.301-6.852-15.301-15.3v-65.573c0-8.448-4.844-10.456-10.819-4.482l-223.6 223.6c-5.977 5.977-5.977 15.664 0 21.638z"/>
    </svg>`;

        this.rightArrow = `
    <svg viewBox="0 0 565.88 565.88" width="24" height="24" fill="currentColor" style="transform: rotate(180deg);">
        <path d="m228.08 517.36c5.976 5.977 10.819 3.97 10.819-4.482v-65.569c0-8.449 6.852-15.301 15.301-15.301h296.38c8.449 0 15.301-6.851 15.301-15.3v-267.53c0-8.448-6.852-15.3-15.301-15.3h-296.38c-8.449 0-15.301-6.852-15.301-15.3v-65.573c0-8.448-4.844-10.456-10.819-4.482l-223.6 223.6c-5.977 5.977-5.977 15.664 0 21.638z"/>
    </svg>`;
        this.downloadIcon = `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>`;
        this.galleryIcon = `
    <svg fill="currentColor" width="24px" height="24px" viewBox="0 0 30 30">
        <path d="M10.5 5c-.073 0-.14.015-.207.045L.83 9.35c-.737.335-1.033 1.227-.687 1.945L6.355 24.18c.347.718 1.24 1.07 1.967.664l3.422-1.907c.588-.298.044-1.18-.486-.873L7.834 23.97c-.196.11-.467.01-.58-.224l-.414-.857 1.885-.943c.605-.304.078-1.16-.45-.894l-1.87.935L1.044 10.86c-.113-.233-.023-.498.2-.6l9.464-4.305c.485-.222.287-.955-.207-.955zm4.777-1c-.19 0-.377.035-.552.104-.35.137-.648.407-.81.775L8.122 18.15c-.32.737.02 1.61.757 1.93l13.277 5.797c.737.32 1.61-.02 1.93-.757l5.795-13.277c.32-.737-.023-1.61-.76-1.93L15.847 4.12c-.184-.08-.378-.12-.57-.12zm-.015.994c.06.002.122.016.183.043l13.278 5.795c.244.107.345.37.238.613l-4.82 11.047-14.13-6.166 4.822-11.05c.08-.182.248-.286.43-.282zM9.61 17.242l14.13 6.168-.572 1.313c-.107.244-.37.347-.613.24L9.277 19.168c-.244-.107-.347-.37-.24-.615zM7.5 16c-.22-.002-.408.133-.475.342l-1 3c-.194.583.733.967.95.316l1-3c.112-.323-.133-.656-.475-.658zm9-3c-.075 0-.156.02-.223.053l-4 2c-.596.267-.093 1.19.446.894l3.605-1.802 1.756 2.632c.14.21.413.282.64.17l3.604-1.802 1.756 2.632c.352.547 1.19-.033.832-.554l-2-3c-.14-.21-.413-.282-.64-.17l-3.604 1.802-1.756-2.632c-.094-.142-.246-.226-.416-.223zm.5-5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 1c.563 0 1 .437 1 1s-.437 1-1 1-1-.437-1-1 .437-1 1-1zM6 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 1c.563 0 1 .437 1 1s-.437 1-1 1-1-.437-1-1 .437-1 1-1z"/>
    </svg>`;
        this.galleryIcon2 = `
    <svg fill="currentColor" width="32px" height="32px" viewBox="0 0 30 30"><defs id="defs2"><clipPath id="clipBack"><rect x="1" y="7" width="15" height="14" rx="2" ry="2" id="rect1"/></clipPath><clipPath id="clipFront"><rect x="9" y="8" width="19" height="19" rx="2.5" ry="2.5" id="rect2"/></clipPath></defs>
        <g transform="rotate(-12 9 14)" id="g5"><g clip-path="url(#clipBack)" id="g4"><rect x="1" y="7" width="15" height="14" fill="#BFE3F5" id="rect3"/><circle cx="12" cy="10.5" r="1.8" fill="#FFE9A8" id="circle3"/><polygon points="1,21 6,13 9,17 12,12 16,21" fill="#B8E0C4" id="polygon3" style="fill:#4cad69;fill-opacity:1;stroke:#000000;stroke-opacity:1"/><rect x="1" y="19" width="15" height="2" fill="#D9BBA0" id="rect4" style="fill:#bd885a;fill-opacity:1"/></g><rect x="1" y="7" width="15" height="14" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1" id="rect5"/></g>
        <g transform="rotate(8 19 17)" id="g8"><g clip-path="url(#clipFront)" id="g7"><rect x="9" y="8" width="19" height="19" fill="#BFE3F5" id="rect6"/><circle cx="15.78848" cy="12.483624" r="2.4000001" fill="#FFE9A8" id="circle6" style="fill:#fff30d;fill-opacity:1;stroke:#000000;stroke-opacity:1;stroke-width:0.375;stroke-dasharray:none"/><polygon points="9,27 15,16 19,21 23,14 28,27" fill="#B8E0C4" id="polygon6" style="fill:#71c089;fill-opacity:1;stroke:#000000;stroke-opacity:1"/><rect x="9" y="24.5" width="19" height="2.5" fill="#D9BBA0" id="rect7" style="fill:#b67b48;fill-opacity:1"/></g><rect x="9" y="8" width="19" height="19" rx="2.5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1" id="rect8"/></g>
    </svg>`;
    }

    async enableOffline(swPath = 'sw.js') {

        // Standard environment of a browser accessing a website
        // where service workers will probably work
        if (this.environment === 'browser') {
            console.log(CONSOLE_PREFIX + "Environment: browser");
            console.log(CONSOLE_PREFIX + "Checking for Service Worker support...");
            if ('serviceWorker' in navigator) {
                console.log(CONSOLE_PREFIX + "Service Worker supported. Registering...");
                try {
                    const params = new URLSearchParams({ cacheName: this.cacheName });
                    const registration = await navigator.serviceWorker.register(`${swPath}?${params}`, {
                        scope: './'
                    });
                    console.log(CONSOLE_PREFIX + "Service Worker offline mode enabled.");
                    registration.update();
                    return registration;
                } catch (error) {
                    console.log(CONSOLE_PREFIX + "Service Worker registration failed:", error);
                    const swResponse = await fetch(swPath);
                    if (!swResponse.ok) {
                        console.warn(CONSOLE_PREFIX + `Service Worker '${swPath}' not found`);
                        return Promise.reject("Service Worker path not found");
                    }
                }
            } else {
                console.warn(CONSOLE_PREFIX + "Browser does not support Service Workers.");
                return Promise.reject("Not supported");
            }
        }

        // we could use a way of testing if we are running in a capacitor app or not
        // but for the meantime we'll assume that those using it in a capacitor app
        // will set the attribute environment="capacitor"
        if (this.environment === 'capacitor') {
            console.log(CONSOLE_PREFIX + "Environment: capacitor - Waiting for storage provider.");
            // We don't register a SW here; we assume the capacitor app 
            // will provide a custom this.storage implementation.
        }
    }

    /** * Storage interface
     * Default Browser implementation 
     */
    getBrowserStorage() {
        return {
            getStatus: async (urls, cacheName) => {
                if (!('caches' in window)) return { percent: 0, isComplete: false, error: 'Insecure Context' };
                const cache = await caches.open(cacheName);
                let foundCount = 0;
                for (const url of urls) {
                    if (await cache.match(url)) foundCount++;
                }
                this.percentCached = Math.round((foundCount / urls.length) * 100);
                return {
                    percent: this.percentCached,
                    isComplete: foundCount === urls.length,
                    found: foundCount
                };
            },
            preload: async (urls, cacheName, onProgress) => {
                const cache = await caches.open(cacheName);
                let completed = 0;
                for (const url of urls) {
                    var found = await cache.match(url);
                    if (!found) {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error('Network fail');
                        await cache.put(url, response);
                    } else {
                        console.log(CONSOLE_PREFIX + "Already in cache:", url);
                    }
                    completed++;
                    var percent = Math.round((completed / urls.length) * 100);
                    if (percent > this.percentCached) {
                        onProgress(Math.round((completed / urls.length) * 100));
                    }
                }
            },
            cacheIt: async (url, cacheName = this.cacheName) => {
                // the service worker should do this but they are sometimes unreliable
                // we'll be greedy and snaffle the media right now if we can
                caches.open(cacheName).then(cache => {
                    cache.match(url).then(found => {
                        if (!found) {
                            console.log(CONSOLE_PREFIX + `cacheIt: ${url} not in cache, fetching and storing...`);
                            fetch(url).then(response => {
                                if (!response.ok) throw new Error("Resource not found");
                                console.log(CONSOLE_PREFIX + `cacheIt: storing ${url} to ${cacheName}`)
                                this.storage.store(url, cacheName, response);
                            }).catch(err => {
                                console.error(CONSOLE_PREFIX + "Failed to fetch resource for caching:", err);
                            });
                        }
                    });
                });
            },
            store: async (url, cacheName, response) => {
                const cache = await caches.open(cacheName);
                await cache.put(url, response);
                console.log(CONSOLE_PREFIX + "stored: ", url)
            },
            clear: async (cacheName, urls) => {
                const cache = await caches.open(cacheName);
                if (urls === null) {
                    return await window.caches.delete(cacheName);
                } else {
                    for (const url of urls) {
                        await cache.delete(url);
                    }
                    return true;
                }
            }
        };
    }

    connectedCallback() {
        this.render();
        this.enableOffline();

        if (this.tourPath) {
            console.log(CONSOLE_PREFIX + "Initializing with path:", this.tourPath);
            this.initTour(this.tourPath);
        } else {
            console.log(CONSOLE_PREFIX + "Waiting for src attribute...");
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            ${playerStyles}
        </style>
        <div class="overlay" id="main-container">
            <div id="hint-prev" class="swipe-hint hint-left">${this.leftArrow}</div>
            <div id="hint-next" class="swipe-hint hint-right">${this.rightArrow}</div>

            <div id="nav-bar"></div>

            <h1 id="title"></h1>

            <div class="text" id="desc"></div>

            <div id="menu-container"></div>

            <div class="buttons">
                <input type="range" id="progressBar" value="0" max="100" step="0.1">
                <div class="audio-controls" id="audio-controls">
                    <button class="restart" id="restartBtn" title="Restart">
                        ${this.restartIcon}
                    </button>
                    <span id="headphones">${this.headphonesIcon}</span>
                    <button class="listen" id="listenBtn" title="Play/Pause">
                        ${this.playIcon}
                    </button>
                </div>
            </div>
            
            <audio id="voice" preload="auto"></audio>
        </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const s = this.shadowRoot;
        const voice = s.getElementById("voice");
        const listenBtn = s.getElementById("listenBtn");
        const restartBtn = s.getElementById("restartBtn");
        const progressBar = s.getElementById("progressBar");
        const headphones = s.getElementById("headphones");
        const container = s.getElementById("main-container");
        const hintPrev = s.getElementById("hint-prev");
        const hintNext = s.getElementById("hint-next");

        listenBtn.addEventListener("click", () => {
            if (voice.paused) {
                try {
                    voice.play();
                    listenBtn.innerHTML = this.pauseIcon;
                    headphones.classList.add("playing");
                } catch (error) {
                    console.error(CONSOLE_PREFIX + "Error playing audio:", error);
                    listenBtn.innerHTML = this.playIcon;
                    headphones.classList.remove("playing");
                }
            } else {
                voice.pause();
                listenBtn.innerHTML = this.playIcon;
                headphones.classList.remove("playing");
            }
        });

        restartBtn.addEventListener("click", () => {
            if (voice.currentTime === 0) { return }
            voice.currentTime = 0;
            voice.play();
            listenBtn.innerHTML = this.pauseIcon;
            headphones.classList.add("playing");
        });

        voice.addEventListener("timeupdate", () => {
            if (voice.duration) {
                const percentage = (voice.currentTime / voice.duration) * 100;
                progressBar.value = percentage;
                progressBar.style.background = `linear-gradient(to right, #ff9800 ${percentage}%, rgba(255, 255, 255, 0.3) ${percentage}%)`;
            }
        });

        progressBar.addEventListener("input", () => {
            const percentage = progressBar.value;
            const seekTime = (percentage / 100) * voice.duration;
            voice.currentTime = seekTime;

            progressBar.style.background = `linear-gradient(to right, #ff9800 ${percentage}%, rgba(255, 255, 255, 0.3) ${percentage}%)`;
        });

        ['touchstart', 'touchmove', 'touchend'].forEach(eventType => {
            progressBar.addEventListener(eventType, (e) => e.stopPropagation(), { passive: true });
        });


        // Reset UI automatically
        const resetUI = () => {
            listenBtn.innerHTML = this.playIcon;
            headphones.classList.remove("playing");
        };

        voice.onended = () => {
            resetUI();
            progressBar.value = 0;
        };

        voice.onpause = resetUI;

        // Show loading state when audio is fetching data
        voice.addEventListener("waiting", () => {
            console.log(CONSOLE_PREFIX + "audio buffering");
            headphones.classList.add("buffering");
        });

        // Ensure it stops when it should
        const stopBuffer = () => headphones.classList.remove("buffering");

        voice.addEventListener("playing", stopBuffer);
        voice.addEventListener("canplay", stopBuffer);
        voice.addEventListener("pause", stopBuffer);
        voice.addEventListener("error", stopBuffer);

        /* Swipe logic for devices with touch input */

        let touchStartX = 0;
        let isSwiping = false; // Flag to track if the swipe started on the container

        container.addEventListener("touchstart", (e) => {
            // Only start a swipe if the touch is directly on the container or non-interactive elements
            // This prevents "overflow" touches from the slider
            isSwiping = true;
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        container.addEventListener("touchmove", (e) => {
            if (!isSwiping) return; // Ignore if the touch started elsewhere

            const currentX = e.changedTouches[0].screenX;
            const diff = touchStartX - currentX;

            if (diff > 30) {
                hintNext.classList.add("hint-visible");
                hintPrev.classList.remove("hint-visible");
            } else if (diff < -30) {
                hintPrev.classList.add("hint-visible");
                hintNext.classList.remove("hint-visible");
            } else {
                hintNext.classList.remove("hint-visible");
                hintPrev.classList.remove("hint-visible");
            }
        }, { passive: true });

        container.addEventListener("touchend", (e) => {
            if (!isSwiping) return; // Prevent "ghost" actions

            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            hintNext.classList.remove("hint-visible");
            hintPrev.classList.remove("hint-visible");

            if (Math.abs(diff) > 70) {
                if (this.detailIndex !== null) {
                    // Inside a nested stop, only allow swipe right (negative diff) to go back
                    if (diff < 0) this.changeStop('parent');
                } else {
                    if (diff > 0) this.changeStop(1);
                    else this.changeStop(-1);
                }
            }

            isSwiping = false; // Reset the flag
        }, { passive: true });
        /* End of swipe logic */
    }

    async initTour(jsonPath) {
        this.tourData = null;
        this.currentIndex = 0;
        this.detailIndex = null;
        this.resetAudioUI();
        const voice = this.shadowRoot.getElementById("voice");
        if (voice) voice.pause();

        try {
            // Use a delegate-friendly way to get the data
            const data = await this.loadJsonResource(jsonPath);
            this.tourData = data.stops;
            this.renderStop(0);
        } catch (error) {
            console.error(CONSOLE_PREFIX + "Error loading tour:", error);
            const wrappedPath = jsonPath.replace(/\//g, '/<wbr>');
            this.shadowRoot.getElementById("desc").innerHTML = "Sorry. No tour available at '" + wrappedPath + "'. " +
                "Check that your &lt;audio-tour-player&gt; tag has a src attribute pointing to a valid tour JSON file, " +
                "and that the file is properly formatted.";
            this.shadowRoot.querySelector(".buttons").style.display = "none";
        }
    }

    renderStop(index, detailIndex = null) {
        if (!this.tourData) return;

        const s = this.shadowRoot;
        
        let stop;
        if (detailIndex !== null) {
            stop = this.tourData[index].stops[detailIndex];
            this.detailIndex = detailIndex;
        } else {
            stop = this.tourData[index];
            this.currentIndex = index;
            this.detailIndex = null;
        }

        // 1. Handle the Menu Area (the dynamic buttons)
        // First, find or create the menu container so we can clear it
        let menuContainer = s.getElementById("menu-container");

        // If it doesn't exist yet (first run), create it
        if (!menuContainer) {
            menuContainer = document.createElement("div");
            menuContainer.id = "menu-container";
            // Insert it after the description text
            s.getElementById("main-container").insertBefore(menuContainer, s.querySelector(".buttons"));
        }

        // clear the menu container at the start of every stop
        menuContainer.innerHTML = "";

        // If we are on the Home/Menu page (index 0)
        if (index === 0 && detailIndex === null) {

            if (this.showOffline === true) { // show the download button and enable access cache functions
                const downloadBtn = document.createElement("button");
                downloadBtn.id = "download-btn";
                downloadBtn.className = "menu-stop-btn download-main";
                setTimeout(function() {
                    this.downloadBtnText = (this.downloadBtnText === '') ? downloadBtn.innerHTML : this.downloadBtnText; // store text
                    downloadBtn.innerHTML = `⌞ ⌝`;
                    downloadBtn.classList.add("collapsed");
                }, 8000); // longer first time before collapsing 
                downloadBtn.innerHTML = `${this.downloadIcon} Checking status...`;
                menuContainer.appendChild(downloadBtn);
    
                this.getCacheStatus().then(status => {
                    if (status.error === 'Insecure Context') {
                        var notSupportedMessage = "Offline Not Supported";
                        this.downloadBtnText = notSupportedMessage;
                        downloadBtn.innerHTML = notSupportedMessage;
                        downloadBtn.disabled = true;
                        downloadBtn.style.opacity = "0.2";
                        return;
                    }
                    if (status.isComplete) {
                        // Already fully downloaded
                        this.updateDownloadUI(100);
                        this.isOfflineReady = true;
                    } else if (status.found > 0) {
                        // Partially downloaded (e.g. 40%)
                        this.updateDownloadUI(status.percent);
                    } else {
                        // Nothing downloaded yet
                        var nothingMessage = `${this.downloadIcon} Download for Offline Use`;
                        this.downloadBtnText = nothingMessage;
                        downloadBtn.innerHTML = nothingMessage;
                    }
                });

                var hoverCapable = false;
                downloadBtn.addEventListener("mouseover", () => {
                    if (window.matchMedia("(hover: hover)").matches) {
                        hoverCapable = true;
                        downloadBtn.innerHTML = this.downloadBtnText;
                        downloadBtn.classList.add("expanded");
                        setTimeout(function() {
                            downloadBtn.innerHTML = `⌞ ⌝`;
                            downloadBtn.classList.remove("expanded");
                        }, 3000);
                    }
                });
                downloadBtn.onclick = () => {
                    if (downloadBtn.classList.contains("collapsed") && !downloadBtn.classList.contains("expanded") && !hoverCapable) {
                        downloadBtn.innerHTML = this.downloadBtnText;
                        downloadBtn.classList.add("expanded");
                        setTimeout(function() {
                            downloadBtn.innerHTML = `⌞ ⌝`;
                            downloadBtn.classList.remove("expanded");
                        }, 3000);
                    } else {
                        if (this.isOfflineReady) {
                            // If it's already downloaded, the click means "Manage/Delete"
                            this.clearOfflineData();
                        } else {
                            // If it's not downloaded, the click starts the download
                            this.preloadTourAssets();
                        }
                    }
                }
           }

            const stops = this.tourData.slice(1).map((stopData, idx) => ({
                title: stopData.title,
                targetIndex: idx + 1
            }));

            stops.forEach(({ title, targetIndex }) => {
                const btn = document.createElement("button");
                btn.className = "menu-stop-btn";
                btn.textContent = title;
                // Use changeStop(0) logic via a direct render call for absolute navigation
                btn.onclick = () => {
                    this.resetAudioUI(); // Reset UI state before moving
                    this.renderStop(targetIndex);
                };
                menuContainer.appendChild(btn);
            });
        } 
        // If the current stop has nested 'stops'
        else if (stop.stops && stop.stops.length > 0) {
            stop.stops.forEach((childStop, dIdx) => {
                const btn = document.createElement("button");
                btn.className = "menu-stop-btn";
                btn.textContent = childStop.title;
                btn.onclick = () => {
                    this.resetAudioUI();
                    this.renderStop(index, dIdx); // pass current main index and the child's index
                };
                menuContainer.appendChild(btn);
            });
        }

        if (stop.gallery && stop.gallery.length > 0) {
            const galleryBtn = document.createElement("button");
            galleryBtn.className = "menu-stop-btn gallery-btn";
            galleryBtn.innerHTML = `${this.galleryIcon2}`;
            galleryBtn.onclick = () => {
                //this.resetAudioUI();
                this.renderGallery(stop.gallery);
            };
            menuContainer.appendChild(galleryBtn);
        }

        /* Fancy text fading in ... */
        const titleEl = s.getElementById("title");
        const descEl = s.getElementById("desc");

        // Remove the class
        titleEl.classList.remove("fade-in");
        descEl.classList.remove("fade-in");

        // Update the text
        titleEl.innerText = stop.title;
        descEl.innerText = stop.desc;

        // re-add the class trick
        void titleEl.offsetWidth;

        titleEl.classList.add("fade-in");
        descEl.classList.add("fade-in");
        /* end of text fading */

        // Update Background Image
        const container = s.getElementById("main-container");
        if (stop.image) {
            this.urlRewriter(stop.image).then(finalImageUrl => {
                container.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${finalImageUrl})`;
                container.style.backgroundSize = "cover";
                container.style.backgroundPosition = "center";
            });
        } else {
            container.style.backgroundImage = "none";
        }

        const controls = s.getElementById("audio-controls");
        const progressBar = s.getElementById("progressBar");
        const voice = s.getElementById("voice");

        const isSupportedAudio = /\.(mp3|ogg|wav|m4a)$/i.test(stop.audio);

        if (isSupportedAudio) {
            console.log(CONSOLE_PREFIX + "Supported audio found: ", stop.audio)
            controls.style.display = "flex";
            progressBar.style.display = "block";
            this.urlRewriter(stop.audio).then(finalAudioUrl => {
                voice.src = finalAudioUrl;
                voice.load();
            });
        } else {
            controls.style.display = "none";
            progressBar.style.display = "none";
            voice.pause();
        }

        this.renderNav(index, detailIndex);
    }

    resetAudioUI() {
        const s = this.shadowRoot;
        const progressBar = s.getElementById("progressBar");

        if (progressBar) {
            progressBar.value = 0;
            progressBar.style.background = `linear-gradient(to right, #ff9800 0%, rgba(255, 255, 255, 0.3) 0%)`;
        }
        const listenBtn = s.getElementById("listenBtn");
        const headphones = s.getElementById("headphones");
        if (listenBtn) listenBtn.innerHTML = this.playIcon;
        if (headphones) headphones.classList.remove("playing");
    }

    renderNav(index, detailIndex = null) {
        const navBar = this.shadowRoot.getElementById("nav-bar");
        
        if (detailIndex !== null) {
            // Navigation for inside a nested stop
            navBar.innerHTML = `<a class="nav previous" id="prevBtn">Back</a> <a class="nav menu" id="menuBtn">Menu</a>`;
            navBar.querySelector("#prevBtn").onclick = () => this.changeStop('parent');
            navBar.querySelector("#menuBtn").onclick = () => this.changeStop('home');
        } else {
            // Standard Navigation
            const isFirst = index === 0;
            const isLast = index === this.tourData.length - 1;

            navBar.innerHTML = `
                ${isFirst ? `<a class="nav next" id="nextBtn">Start</a>` :
                    `<a class="nav previous" id="prevBtn">Back</a> <a class="nav menu" id="menuBtn">Menu</a>`}
                ${!isLast && !isFirst ? `<a class="nav next" id="nextBtn">Next</a>` : ''}
            `;

        // Event listeners for the navigation
            if (navBar.querySelector("#prevBtn")) navBar.querySelector("#prevBtn").onclick = () => this.changeStop(-1);
            if (navBar.querySelector("#menuBtn")) navBar.querySelector("#menuBtn").onclick = () => this.changeStop('home');
            if (navBar.querySelector("#nextBtn")) navBar.querySelector("#nextBtn").onclick = () => this.changeStop(1);
        }
    }

    changeStop(direction) {
        const s = this.shadowRoot;
        this.resetAudioUI();

        if (direction === 'home') {
            this.renderStop(0);
            return;
        }
        
        if (direction === 'parent') {
            this.renderStop(this.currentIndex);
            return;
        }

        const newIndex = this.currentIndex + direction;
        if (newIndex < 0 || newIndex >= this.tourData.length) return; 
        this.renderStop(newIndex);
    }

    getRequiredUrls() {
        if (!this.tourData) return [];
        const urls = new Set();
        urls.add('./');
        urls.add('sw.js');
        urls.add(this.tourPath);
        
        // Recursive helper to grab media from all stops, including nested ones
        const addMedia = (stop) => {
            if (stop.audio) urls.add(stop.audio);
            if (stop.image) urls.add(stop.image);
            if (stop.stops) {
                stop.stops.forEach(child => addMedia(child));
            }
        };

        this.tourData.forEach(stop => addMedia(stop));
        return Array.from(urls);
    }

    /** Storage utilities
     * getCacheStatus(), preloadTourAssets(), clearOfflineData()
     * Notes:
     * this.storage defaults to getBrowserStorage() that uses Cache API and a Storage Worker
     * For other environments (such as capacitor) inject a different storage function
     *  - provide for getStatus, preload, and clear
     * See README for an example
    */

    async getCacheStatus() {
        const required = this.getRequiredUrls();
        if (required.length === 0) return { percent: 0, isComplete: false };
        return await this.storage.getStatus(required, this.cacheName);
    }

    async preloadTourAssets() {
        const btn = this.shadowRoot.getElementById("download-btn");
        const urls = this.getRequiredUrls();
        btn.disabled = true;

        try {
            await this.storage.preload(urls, this.cacheName, (percent) => {
                this.updateDownloadUI(percent);
            });
            this.isOfflineReady = true;
        } catch (err) {
            console.error(CONSOLE_PREFIX + "Preload failed", err);
        } finally {
            btn.disabled = false;
        }
    }

    async clearOfflineData() {
        const confirmed = window.confirm("Would you like to remove the offline files to save space?");
        if (confirmed) {
            try {
                await this.storage.clear(this.cacheName, this.getRequiredUrls());
                this.isOfflineReady = false;
                this.renderStop(0);
                console.log(CONSOLE_PREFIX + "Offline data cleared.");
            } catch (error) {
                console.error(CONSOLE_PREFIX + "Failed to clear cache:", error);
            }
        }
    }

    /**
     * Universal loader that handles Browser vs Capacitor
     */
    async loadJsonResource(path) {
        // 1. Check if a custom loader was provided (for Capacitor Filesystem)
        if (this.customLoader) {
            return await this.customLoader(path);
        }

        // 2. Browser logic: Try to hit the Cache API directly first 
        // as a fallback if the Service Worker isn't fully ready/active.
        if ('caches' in window) {
            const cache = await caches.open(this.cacheName);
            const cachedResponse = await cache.match(path);
            if (cachedResponse) {
                console.log(CONSOLE_PREFIX + "Loading from Cache API:", path);
                return await cachedResponse.json();
            }
        }

        // 3. Fallback to standard fetch (which the Service Worker will intercept)
        console.log(CONSOLE_PREFIX + "loadJsonResource() Loading via fetch:", path);
        const response = await fetch(path);
        if (!response.ok) throw new Error("Resource not found");
        console.log(CONSOLE_PREFIX + `storing ${path} to ${this.cacheName}`)
        this.storage.store(path, this.cacheName, response.clone());
        return await response.json();
    }

    updateDownloadUI(percent) {
        const btn = this.shadowRoot.getElementById("download-btn");
        if (!btn) return;

        btn.style.background = `linear-gradient(to right, #2e7d32 ${percent}%, #333 ${percent}%)`;
        if (percent < 100) {
            var percentMessage = `Downloaded ${percent}%`;
            if (btn.classList.contains("collapsed") && !btn.classList.contains("expanded")) {
                this.downloadBtnText = percentMessage;
            } else {
                this.downloadBtnText = percentMessage;
                btn.innerHTML = percentMessage;
            }
        } else {
            var readyMessage = `✓ Offline Ready`;
            if (btn.classList.contains("collapsed") && !btn.classList.contains("expanded")) {
                this.downloadBtnText = readyMessage;
            } else {
                this.downloadBtnText = readyMessage;
                btn.innerHTML = readyMessage;
            }
            btn.disabled = false;
            btn.style.cursor = "pointer";
        }
    }

    static get observedAttributes() {
        return ['src'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
    // If the src changed and it's not null/empty
        if (name === 'src' && newValue && oldValue !== newValue) {
            this.tourPath = newValue;
            
        // Only trigger init if the component is actually in the DOM
            if (this.isConnected) {
                console.log(CONSOLE_PREFIX + "Source updated to:", newValue);
                this.initTour(newValue);
            }
        }
    }

}

customElements.define("audio-tour-player", AudioTourPlayer);