import playerStyles from "./style.css?inline";

const CONSOLE_PREFIX = "audio-tour-player: "

class AudioTourPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        // State
        this.tourData = null;
        this.currentIndex = 0;
        this.cacheName = this.getAttribute('cache-name') || 'audio-tour-player-cache-v1';
        console.log(CONSOLE_PREFIX + "Using cache name:", this.cacheName);
        this.environment = this.getAttribute('environment') || 'browser';
        this.showOffline = (this.getAttribute('offline-capable') === 'false') ? false : true; // assume we want to show the download for offline button
        console.log(CONSOLE_PREFIX + "Offline capable:", this.showOffline);
        this.isOfflineReady = false;
        // storage interface
        this.storage = this.getBrowserStorage(); // Default to browser
        this.urlRewriter = (url) => url; // Default: do nothing

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
                    console.error(CONSOLE_PREFIX + "Service Worker failed:", error);
                    throw error;
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
                return {
                    percent: Math.round((foundCount / urls.length) * 100),
                    isComplete: foundCount === urls.length,
                    found: foundCount
                };
            },
            preload: async (urls, cacheName, onProgress) => {
                const cache = await caches.open(cacheName);
                let completed = 0;
                for (const url of urls) {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Network fail');
                    await cache.put(url, response);
                    completed++;
                    onProgress(Math.round((completed / urls.length) * 100));
                }
            },
            clear: async (cacheName) => {
                return await window.caches.delete(cacheName);
            }
        };
    }

    connectedCallback() {

        this.render();

        this.enableOffline();

        const tourPath = this.getAttribute('src') || './tours/st-nuns.json'; // provide something for developers
        console.log(CONSOLE_PREFIX + "tourpath = ", tourPath)
        this.initTour(tourPath);
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
                if (diff > 0) this.changeStop(1);
                else this.changeStop(-1);
            }

            isSwiping = false; // Reset the flag
        }, { passive: true });

        /* End of swipe logic */

    }

    async initTour(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) throw new Error("Tour not found");

            const data = await response.json();
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

    renderStop(index) {
        if (!this.tourData) return;

        const s = this.shadowRoot;
        const stop = this.tourData[index];
        this.currentIndex = index;

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

        // If we are on the Home/Menu page (index 0), build the buttons
        if (index === 0) {

            if (this.showOffline === true) { // show the download button and enable access cache functions
                const downloadBtn = document.createElement("button");
                downloadBtn.id = "download-btn";
                downloadBtn.className = "menu-stop-btn download-main";
                downloadBtn.innerHTML = `${this.downloadIcon} Checking status...`;
                menuContainer.appendChild(downloadBtn);
    
                this.getCacheStatus().then(status => {
                    if (status.error === 'Insecure Context') {
                        downloadBtn.innerHTML = "Offline Not Supported (Insecure)";
                        downloadBtn.disabled = true;
                        downloadBtn.style.opacity = "0.5";
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
                        downloadBtn.innerHTML = `${this.downloadIcon} Download for Offline Use`;
                    }
                });

                downloadBtn.onclick = () => {
                    if (this.isOfflineReady) {
                        // If it's already downloaded, the click means "Manage/Delete"
                        this.clearOfflineData();
                    } else {
                        // If it's not downloaded, the click starts the download
                        this.preloadTourAssets();
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
            container.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${stop.image})`;
            container.style.backgroundSize = "cover";
            container.style.backgroundPosition = "center";
        } else {
            container.style.backgroundImage = "none";
        }

        const controls = s.getElementById("audio-controls");
        const progressBar = s.getElementById("progressBar");
        const voice = s.getElementById("voice");

        const isSupportedAudio = /\.(mp3|ogg|wav)$/i.test(stop.audio);

        if (isSupportedAudio) {
            console.log(CONSOLE_PREFIX + "Supported audio found: ", stop.audio)
            controls.style.display = "flex";
            progressBar.style.display = "block";
            voice.src = this.urlRewriter(stop.audio);
            try {
                voice.load(); // Force load the track
            } catch (error) {
                console.error(CONSOLE_PREFIX + "Error loading audio", error)
            }
        } else {
            controls.style.display = "none";
            progressBar.style.display = "none";
            voice.pause();
        }

        this.renderNav(index);
    }

    resetAudioUI() {
        const s = this.shadowRoot;
        const progressBar = s.getElementById("progressBar");

        progressBar.value = 0;
        progressBar.style.background = `linear-gradient(to right, #ff9800 0%, rgba(255, 255, 255, 0.3) 0%)`;

        s.getElementById("listenBtn").innerHTML = this.playIcon;
        s.getElementById("headphones").classList.remove("playing");
    }

    renderNav(index) {
        const navBar = this.shadowRoot.getElementById("nav-bar");
        const isFirst = index === 0;
        const isLast = index === this.tourData.length - 1;

        navBar.innerHTML = `
            ${isFirst ? `<a class="nav next" id="nextBtn">Start</a>` :
                `<a class="nav previous" id="prevBtn">Back</a> <a class="nav menu" id="menuBtn">Menu</a>`}
            ${!isLast && !isFirst ? `<a class="nav next" id="nextBtn">Next</a>` : ''}
        `;

        // Event listeners for the navigation
        if (navBar.querySelector("#prevBtn")) navBar.querySelector("#prevBtn").onclick = () => this.changeStop(-1);
        if (navBar.querySelector("#menuBtn")) navBar.querySelector("#menuBtn").onclick = () => this.changeStop(0);
        if (navBar.querySelector("#nextBtn")) navBar.querySelector("#nextBtn").onclick = () => this.changeStop(1);
    }

    changeStop(direction) {
        const s = this.shadowRoot;
        s.getElementById("progressBar").value = 0;
        s.getElementById("listenBtn").innerHTML = this.playIcon;
        s.getElementById("headphones").classList.remove("playing");
        this.resetAudioUI();

        if (direction === 0) {
            this.renderStop(0);
            return;
        }
        const newIndex = this.currentIndex + direction;
        if (newIndex < 0 || newIndex >= this.tourData.length) return; // Out of bounds check
        this.renderStop(newIndex);
    }

    getRequiredUrls() {
        if (!this.tourData) return [];
        const urls = new Set();
        urls.add('./');
        urls.add('sw.js');
        this.tourData.forEach(stop => {
            if (stop.audio) urls.add(stop.audio);
            if (stop.image) urls.add(stop.image);
        });
        return Array.from(urls);
    }

    /** Storage utilities
     * getCacheStatus(), preloadTourAssets(), clearOfflineData()
     * Notes:
     * this.storage defaults to getBrowserStorage() that uses Cache API and a Storage Worker
     * For other environments (such as capacitor) inject a different storage function
     *  - provide for getStatus, preload, and clear
     * See README for an example (TBD)
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
                await this.storage.clear(this.cacheName);
                this.isOfflineReady = false;
                this.renderStop(0);
                console.log(CONSOLE_PREFIX + "Offline data cleared.");
            } catch (error) {
                console.error(CONSOLE_PREFIX + "Failed to clear cache:", error);
            }
        }
    }

    updateDownloadUI(percent) {
        const btn = this.shadowRoot.getElementById("download-btn");
        if (!btn) return;

        btn.style.background = `linear-gradient(to right, #2e7d32 ${percent}%, #333 ${percent}%)`;
        if (percent < 100) {
            btn.innerHTML = `Downloaded ${percent}%`;
        } else {
            btn.innerHTML = `✓ Offline Ready`;
            btn.disabled = false;
            btn.style.cursor = "pointer";
        }
    }

}

customElements.define("audio-tour-player", AudioTourPlayer);