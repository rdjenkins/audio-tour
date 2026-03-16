import playerStyles from "./style.css?inline";

class AudioTourPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        // State
        this.tourData = null;
        this.currentIndex = 0;

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
<svg viewBox="0 0 402.917 402.917" width="24" height="24" fill="#FFFFFF">
    <path d="m 386.004,20.848 v 361.213 c 0,7.447 -3.972,14.333 -10.427,18.063 -6.46,3.724 -14.398,3.724 -20.853,0 L 138.281,219.515 c -6.452,-3.719 -10.436,-10.604 -10.436,-18.058 0,-7.451 3.978,-14.34 10.436,-18.061 L 354.725,2.79 C 357.952,0.928 361.551,0 365.151,0 c 3.605,0 7.199,0.934 10.427,2.79 6.455,3.718 10.426,10.607 10.426,18.058 z M 94.066,0.201 H 25.261 c -4.613,0 -8.349,3.735 -8.349,8.34 v 385.808 c 0,4.604 3.735,8.34 8.349,8.34 h 68.805 c 4.607,0 8.34,-3.735 8.34,-8.34 V 8.547 c 0,-4.604 -3.733,-8.346 -8.34,-8.346 z"/>
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

    connectedCallback() {
        if ('serviceWorker' in navigator) {
            // We use a relative path without the dot to ensure it hits the current folder
            navigator.serviceWorker.register('sw.js', { scope: './' })
                .then(registration => {
                    console.log('Service Worker registered!');

                    // This force-updates the worker if the file changed
                    registration.update();
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }

        this.render();

        // Handle URL parameters for tour selection
        const urlParams = new URLSearchParams(window.location.search);
        const tourId = urlParams.get('tour') || 'st-nuns';
        this.initTour(`./tours/${tourId}.json`);
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
                    console.error("Error playing audio:", error);
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
            console.log("audio buffering");
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
            console.error("Error loading tour:", error);
            this.shadowRoot.getElementById("desc").innerText = "Sorry. No tour available.";
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
                    downloadBtn.disabled = true;
                } else if (status.found > 0) {
                    // Partially downloaded (e.g. 40%)
                    this.updateDownloadUI(status.percent);
                } else {
                    // Nothing downloaded yet
                    downloadBtn.innerHTML = `${this.downloadIcon} Download for Offline Use`;
                }
            });

            downloadBtn.onclick = () => this.preloadTourAssets();

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

        if (stop.audio) {
            controls.style.display = "flex";
            progressBar.style.display = "block";
            voice.src = stop.audio;
            voice.load(); // Force load the track
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

    async getCacheStatus() {
        if (!('caches' in window)) {
            return { percent: 0, isComplete: false, error: 'Insecure Context' };
        }
        const required = this.getRequiredUrls();
        if (required.length === 0) return { percent: 0, isComplete: false };

        const cache = await caches.open('celtic-tour-v1');
        let foundCount = 0;

        for (const url of required) {
            const match = await cache.match(url);
            if (match) foundCount++;
        }

        return {
            percent: Math.round((foundCount / required.length) * 100),
            isComplete: foundCount === required.length,
            total: required.length,
            found: foundCount
        };
    }

    async preloadTourAssets() {
        const btn = this.shadowRoot.getElementById("download-btn");
        const urls = this.getRequiredUrls();
        const cache = await caches.open('celtic-tour-v1');

        btn.disabled = true;
        let completed = 0;

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response was not ok');

                await cache.put(url, response);
                completed++;

                // Update the progress bar visually
                const progress = Math.round((completed / urls.length) * 100);
                this.updateDownloadUI(progress);
            } catch (err) {
                console.error(`Failed to cache: ${url}`, err);
            }
        }
    }

    updateDownloadUI(percent) {
        const btn = this.shadowRoot.getElementById("download-btn");
        // You can update the button background to act as a progress bar!
        btn.style.background = `linear-gradient(to right, #2e7d32 ${percent}%, #333 ${percent}%)`;
        btn.innerHTML = percent < 100 ? `Downloading ${percent}%` : "✓ Offline Ready";
    }

}

customElements.define("audio-tour-player", AudioTourPlayer);