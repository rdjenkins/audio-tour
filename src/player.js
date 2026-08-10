import playerStyles from "./style.css?inline";
import { version as VERSION } from "../package.json";

const CONSOLE_PREFIX = "audio-tour-player (v" + VERSION + "): "

class AudioTourPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        // State
        this.tourData = null;
        this.currentIndex = 0;
        this.detailIndex = null; // Tracks if we are inside a nested stop
        this.galleryIndex = 0;   // Tracks the current photo index in the overlay gallery
        this.galleryData = [];   // Stores the currently loaded flattened gallery array
        this.tourPath = this.getAttribute('src') || './tours/st-nuns.json'; // provide something for developers
        this.cacheName = this.getAttribute('cache-name') || 'audio-tour-player-cache-v1';
        console.info(CONSOLE_PREFIX + "Using cache name:", this.cacheName);
        this.environment = this.getAttribute('environment') || 'browser';
        this.showOffline = (this.getAttribute('offline-capable') === 'false') ? false : true; // assume we want to show the download for offline button
        console.info(CONSOLE_PREFIX + "Offline capable:", this.showOffline);
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
    <svg fill="currentColor" width="32px" height="32px" viewBox="0 0 30 30"><defs id="defs2"><clipPath id="clipBack"><rect x="1" y="7" width="15" height="14" rx="2" ry="2" id="rect1"/></clipPath><clipPath id="clipFront"><rect x="9" y="8" width="19" height="19" rx="2.5" ry="2.5" id="rect2"/></clipPath></defs>
        <g transform="rotate(-12 9 14)" id="g5"><g clip-path="url(#clipBack)" id="g4"><rect x="1" y="7" width="15" height="14" fill="#BFE3F5" id="rect3"/><circle cx="12" cy="10.5" r="1.8" fill="#FFE9A8" id="circle3"/><polygon points="1,21 6,13 9,17 12,12 16,21" fill="#B8E0C4" id="polygon3" style="fill:#4cad69;fill-opacity:1;stroke:#000000;stroke-opacity:1"/><rect x="1" y="19" width="15" height="2" fill="#D9BBA0" id="rect4" style="fill:#bd885a;fill-opacity:1"/></g><rect x="1" y="7" width="15" height="14" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1" id="rect5"/></g>
        <g transform="rotate(8 19 17)" id="g8"><g clip-path="url(#clipFront)" id="g7"><rect x="9" y="8" width="19" height="19" fill="#BFE3F5" id="rect6"/><circle cx="15.78848" cy="12.483624" r="2.4000001" fill="#FFE9A8" id="circle6" style="fill:#fff30d;fill-opacity:1;stroke:#000000;stroke-opacity:1;stroke-width:0.375;stroke-dasharray:none"/><polygon points="9,27 15,16 19,21 23,14 28,27" fill="#B8E0C4" id="polygon6" style="fill:#71c089;fill-opacity:1;stroke:#000000;stroke-opacity:1"/><rect x="9" y="24.5" width="19" height="2.5" fill="#D9BBA0" id="rect7" style="fill:#b67b48;fill-opacity:1"/></g><rect x="9" y="8" width="19" height="19" rx="2.5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1" id="rect8"/></g>
    </svg>`;
    }

    async enableOffline(swPath = 'sw.js') {

        // Standard environment of a browser accessing a website
        // where service workers will probably work
        if (this.environment === 'browser') {
            console.info(CONSOLE_PREFIX + "Environment: browser");
            console.info(CONSOLE_PREFIX + "Checking for Service Worker support...");
            if ('serviceWorker' in navigator) {
                console.info(CONSOLE_PREFIX + "Service Worker supported. Registering...");
                try {
                    const params = new URLSearchParams({ cacheName: this.cacheName });
                    const registration = await navigator.serviceWorker.register(`${swPath}?${params}`, {
                        scope: './'
                    });
                    console.info(CONSOLE_PREFIX + "Service Worker offline mode enabled.");
                    registration.update();
                    return registration;
                } catch (error) {
                    console.info(CONSOLE_PREFIX + "Service Worker registration failed:", error);
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
            console.info(CONSOLE_PREFIX + "Environment: capacitor - Waiting for storage provider.");
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
                        console.info(CONSOLE_PREFIX + "Already in cache:", url);
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
                            console.info(CONSOLE_PREFIX + `cacheIt: ${url} not in cache, fetching and storing...`);
                            fetch(url).then(response => {
                                if (!response.ok) throw new Error("Resource not found");
                                console.info(CONSOLE_PREFIX + `cacheIt: storing ${url} to ${cacheName}`)
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
                console.info(CONSOLE_PREFIX + "stored: ", url)
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
            console.info(CONSOLE_PREFIX + "Initializing with path:", this.tourPath);
            this.initTour(this.tourPath);
        } else {
            console.info(CONSOLE_PREFIX + "Waiting for src attribute...");
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

            <!-- Photo Gallery Overlay Frame Layer -->
            <div id="gallery-overlay" class="gallery-overlay">
                <button id="gallery-close" class="gallery-close" title="Close Gallery">&times;</button>
                <button id="gallery-prev" class="gallery-nav prev" title="Previous Image">${this.leftArrow}</button>
                <div id="gallery-viewport" class="gallery-viewport">
                    <img id="gallery-img" class="gallery-img" src="" alt="Gallery Image">
                </div>
                <button id="gallery-next" class="gallery-nav next" title="Next Image">${this.rightArrow}</button>
                <div id="gallery-caption" class="gallery-caption"></div>
            </div>
        </div>
        `;

        this.setupEventListeners();
        this.setupGalleryEventListeners();
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
            console.info(CONSOLE_PREFIX + "audio buffering");
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

    /**
     * Set up operational interaction, zooming and panning event environments for the overlay gallery layer.
     */
    setupGalleryEventListeners() {
        const s = this.shadowRoot;
        const overlay = s.getElementById("gallery-overlay");
        const closeBtn = s.getElementById("gallery-close");
        const prevBtn = s.getElementById("gallery-prev");
        const nextBtn = s.getElementById("gallery-next");
        const img = s.getElementById("gallery-img");
        const viewport = s.getElementById("gallery-viewport");

        closeBtn.onclick = (e) => {
            e.stopPropagation();
            overlay.classList.remove("active");
        };

        prevBtn.onclick = (e) => {
            e.stopPropagation();
            this.navigateGallery(-1);
        };
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            this.navigateGallery(1);
        };

        // Variable tracking for scaling structures and panning mechanics
        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialTouchDist = 0;
        let lastTap = 0;

        const updateTransform = () => {
            if (scale <= 1) {
                scale = 1;
                translateX = 0;
                translateY = 0;
            }
            img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        };

        // Expose a reset hook accessible when transitioning pictures
        this.resetGalleryZoom = () => {
            scale = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
        };

        // Multi-touch gestures processing context
        viewport.addEventListener("touchstart", (e) => {
            e.stopPropagation(); // Block background tour swipe triggers
            if (e.touches.length === 1) {
                isDragging = true;
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;

                // Double tap handler
                const now = Date.now();
                if (now - lastTap < 300) {
                    if (scale > 1) {
                        scale = 1;
                        translateX = 0;
                        translateY = 0;
                    } else {
                        scale = 2.5;
                    }
                    updateTransform();
                    e.preventDefault();
                }
                lastTap = now;
            } else if (e.touches.length === 2) {
                isDragging = false;
                initialTouchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: false });

        viewport.addEventListener("touchmove", (e) => {
            e.stopPropagation();
            if (isDragging && scale > 1) {
                translateX = e.touches[0].clientX - startX;
                translateY = e.touches[0].clientY - startY;
                updateTransform();
                e.preventDefault();
            } else if (e.touches.length === 2) {
                const currentDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const factor = currentDist / (initialTouchDist || 1);
                scale = Math.max(1, Math.min(5, scale * factor));
                initialTouchDist = currentDist;
                updateTransform();
                e.preventDefault();
            }
        }, { passive: false });

        viewport.addEventListener("touchend", (e) => {
            e.stopPropagation();
            isDragging = false;
        });

        // Mouse compatibility configurations for verification environments
        viewport.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
        });

        viewport.addEventListener("mousemove", (e) => {
            if (isDragging && scale > 1) {
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                updateTransform();
            }
        });

        window.addEventListener("mouseup", () => {
            isDragging = false;
        });

        viewport.addEventListener("dblclick", () => {
            if (scale > 1) {
                scale = 1;
                translateX = 0;
                translateY = 0;
            } else {
                scale = 2.5;
            }
            updateTransform();
        });
    }

    async initTour(jsonPath) {
        console.log(CONSOLE_PREFIX + "Loading Tour from:", jsonPath);
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
            let params = new URLSearchParams(document.location.search);
            let stop = params.get("stop");
            let detail = params.get("detail");
            if (stop) {
                let stopIndex = parseInt(stop);
                if (!isNaN(stopIndex) && stopIndex >= 0 && stopIndex < this.tourData.length) {
                    this.renderStop(stopIndex, detail ? parseInt(detail) : null);
                    return;
                }
            }
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
        let params;
        let newUrl;

        // if we are viewing a detail at this stop
        if (detailIndex !== null && this.tourData[index] && this.tourData[index].stops && this.tourData[index].stops[detailIndex]) {
            stop = this.tourData[index].stops[detailIndex];
            this.detailIndex = detailIndex;

            params = new URLSearchParams(window.location.search);
            if (index > 0) {
                params.set('stop', index);
            } else {
                params.delete('stop');
            }
            params.set('detail', detailIndex);

            newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
            window.history.pushState(
                { index, detailIndex },
                stop.title,
                newUrl
            );
        } else { // just a main stop no detail
            stop = this.tourData[index];
            this.currentIndex = index;
            this.detailIndex = null;

            params = new URLSearchParams(window.location.search);
            if (index > 0) {
                params.set('stop', index);
            } else {
                params.delete('stop');
            }
            params.delete('detail');

            newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
            window.history.pushState(
                { index, detailIndex },
                stop.title,
                newUrl
            );
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
                }.bind(this), 8000); // longer first time before collapsing 
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
            galleryBtn.innerHTML = `${this.galleryIcon}`;
            galleryBtn.onclick = () => {
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
            console.info(CONSOLE_PREFIX + "Supported audio found: ", stop.audio)
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
            if (stop.gallery) {
                stop.gallery.flat().forEach(item => {
                    if (item.image) urls.add(item.image);
                });
            }
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
                console.info(CONSOLE_PREFIX + "Offline data cleared.");
            } catch (error) {
                console.error(CONSOLE_PREFIX + "Failed to clear cache:", error);
            }
        }
    }

    /**
     * Parse flat or nested array inputs, initialize overlay visibility, and step into rendering the items.
     */
    renderGallery(gallery) {
        if (!gallery) return;
        this.galleryData = gallery.flat();
        this.galleryIndex = 0;

        const overlay = this.shadowRoot.getElementById("gallery-overlay");
        if (overlay) {
            overlay.classList.add("active");
            this.updateGalleryItem();
        }
    }

    /**
     * Render data for the targeted picture index and update pagination layout states.
     */
    async updateGalleryItem() {
        if (!this.galleryData || this.galleryData.length === 0) return;

        const s = this.shadowRoot;
        const img = s.getElementById("gallery-img");
        const caption = s.getElementById("gallery-caption");
        const prevBtn = s.getElementById("gallery-prev");
        const nextBtn = s.getElementById("gallery-next");

        const item = this.galleryData[this.galleryIndex];

        if (this.resetGalleryZoom) this.resetGalleryZoom();

        caption.innerText = item.caption || "";

        if (item.image) {
            const finalImgUrl = await this.urlRewriter(item.image);
            img.src = finalImgUrl;
        }

        prevBtn.style.visibility = this.galleryIndex === 0 ? "hidden" : "visible";
        nextBtn.style.visibility = this.galleryIndex === this.galleryData.length - 1 ? "hidden" : "visible";
    }

    /**
     * Steps active photo indices backwards or forwards.
     */
    navigateGallery(direction) {
        const nextIdx = this.galleryIndex + direction;
        if (nextIdx >= 0 && nextIdx < this.galleryData.length) {
            this.galleryIndex = nextIdx;
            this.updateGalleryItem();
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
                console.info(CONSOLE_PREFIX + "Loading from Cache API:", path);
                return await cachedResponse.json();
            }
        }

        // 3. Fallback to standard fetch (which the Service Worker will intercept)
        console.info(CONSOLE_PREFIX + "loadJsonResource() Loading via fetch:", path);
        const response = await fetch(path);
        if (!response.ok) throw new Error("Resource not found");
        console.info(CONSOLE_PREFIX + `storing ${path} to ${this.cacheName}`)
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
                console.info(CONSOLE_PREFIX + "Source updated to:", newValue);
                this.initTour(newValue);
            }
        }
    }

}

customElements.define("audio-tour-player", AudioTourPlayer);