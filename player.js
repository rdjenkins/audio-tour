import "./style.css";

class AudioTourPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        // State
        this.tourData = null;
        this.currentIndex = 0;

        // SVG icons
        this.playIcon = `<img src="/play.svg" height="24" width="24">`;
        this.pauseIcon = `<img src="/pause.svg" height="24" width="24">`;
        this.restartIcon = `<img src="/restart.svg" height="24" width="24">`;
    }

    connectedCallback() {
        this.render();

        // Handle URL parameters for tour selection
        const urlParams = new URLSearchParams(window.location.search);
        const tourId = urlParams.get('tour') || 'st-nuns';
        this.initTour(`./tours/${tourId}.json`);
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            @import "./style.css";
        </style>
        <div class="overlay" id="main-container">
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
                    <span id="headphones">🎧</span>
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

        listenBtn.addEventListener("click", () => {
            if (voice.paused) {
                voice.play();
                listenBtn.innerHTML = this.pauseIcon;
                headphones.classList.add("playing");
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
                progressBar.value = (voice.currentTime / voice.duration) * 100;
            }
        });

        progressBar.addEventListener("input", () => {
            const seekTime = (progressBar.value / 100) * voice.duration;
            voice.currentTime = seekTime;
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
            this.shadowRoot.getElementById("desc").innerText = "Failed to load tour data.";
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

    // Always clear the menu container at the start of every stop
    menuContainer.innerHTML = "";

    // If we are on the Home/Menu page (index 0), build the buttons
    if (index === 0) {
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

    // 2. Update Text Content
    s.getElementById("title").innerText = stop.title;
    s.getElementById("desc").innerText = stop.desc;

    // 3. Update Background Image
    const container = s.getElementById("main-container");
    if (stop.image) {
        container.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${stop.image})`;
        container.style.backgroundSize = "cover";
        container.style.backgroundPosition = "center";
    } else {
        container.style.backgroundImage = "none";
    }

    // 4. Handle Audio Controls Visibility
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

    // 5. Update Navigation Buttons
    this.renderNav(index);
}

// Helper method to keep the code clean (you can add this to your class)
resetAudioUI() {
    const s = this.shadowRoot;
    s.getElementById("progressBar").value = 0;
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

        // Scoped event listeners for the navigation
        if (navBar.querySelector("#prevBtn")) navBar.querySelector("#prevBtn").onclick = () => this.changeStop(-1);
        if (navBar.querySelector("#menuBtn")) navBar.querySelector("#menuBtn").onclick = () => this.changeStop(0);
        if (navBar.querySelector("#nextBtn")) navBar.querySelector("#nextBtn").onclick = () => this.changeStop(1);
    }

    changeStop(direction) {
        const s = this.shadowRoot;
        // Your specific reset logic
        s.getElementById("progressBar").value = 0;
        s.getElementById("listenBtn").innerHTML = this.playIcon;
        s.getElementById("headphones").classList.remove("playing");

        if (direction === 0) {
            this.renderStop(0);
            return;
        }
        this.renderStop(this.currentIndex + direction);
    }
}

customElements.define("audio-tour-player", AudioTourPlayer);