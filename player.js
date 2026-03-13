// make up some quick and easy MP3s with
// https://www.textavoice.com/

const pauseIcon = `<img src="./pause.svg" height="24" width="24">`
const playIcon = `<img src="./play.svg" height="24" width="24">`
//const pauseIcon = "⏸";
//const playIcon = "▶";

const voice = document.getElementById("voice");
const listenBtn = document.getElementById("listenBtn");

function toggleAudio() {
    if (voice.paused) {
        voice.play();
        listenBtn.innerHTML = pauseIcon;
        headphones.classList.add("playing"); // Start pulsing
    } else {
        voice.pause();
        listenBtn.innerHTML = playIcon;
        headphones.classList.remove("playing"); // Stop pulsing
    }
}

function restartAudio() {
    voice.currentTime = 0; // Reset time to the beginning
    voice.play();
    listenBtn.innerHTML = pauseIcon;
    headphones.classList.add("playing"); // Ensure it's pulsing
}

// Reset button text automatically when audio ends
voice.onended = function () {
    listenBtn.innerHTML = playIcon;
    headphones.classList.remove("playing"); // Stop when finished
};

// For mobile OS pauses
voice.onpause = function () {
    listenBtn.innerHTML = playIcon;
    headphones.classList.remove("playing");
};

const progressBar = document.getElementById("progressBar");

// 1. Update slider as audio plays
voice.addEventListener("timeupdate", () => {
    if (!voice.duration) return; // Prevent errors if metadata isn't loaded
    progressBar.value = (voice.currentTime / voice.duration) * 100;
});

// 2. Seek audio when user moves the slider
progressBar.addEventListener("input", () => {
    const seekTime = (progressBar.value / 100) * voice.duration;
    voice.currentTime = seekTime;
});

// 3. Optional: Reset slider when audio finishes
voice.addEventListener("ended", () => {
    progressBar.value = 0;
});