# About

![npm version](https://img.shields.io/npm/v/audio-tour-player)

Building a reliable, offline-ready audio player for the web is time consuming. This library handles the edge cases (caching, range requests, touch gestures) so you can focus on the content.

This is the audio tour software for <https://celticquietplaces.com/>. It is being designed as a library so that it can be used in our other projects such as Grampound Digital Twin.

## Features

🧩 Framework Agnostic – Built with native Web Components. Seamlessly drop it into React, Vue, Svelte, or a plain HTML file without changing a line of code.

🔌 JSON-Driven Content – Define your entire tour in a single .json file. Support for local assets or remote media URLs makes deployment a breeze.

🔋 Bulletproof Offline Mode – First-class support for the Cache API and Service Workers. Your users can download tours and explore with zero signal.

🚀 Ultra Lightweight – Zero dependencies. Fast load times and a tiny bundle footprint mean your site stays snappy.

🖐️ Native-Feel Interactions – Includes smooth touch gestures, swipe navigation, and high-performance SVG animations for a premium app feel.

## Roadmap

NPM Package: Soon to be available as a lightweight, zero-dependency npm module.

## Getting started

### Installation

#### Via npm

Ideal for modern web projects using Vite, Webpack, or any JavaScript framework.

```
npm install audio-tour-player
```

Then, simply import it into your main JavaScript or TypeScript file:

```
import 'audio-tour-player';
```

### Add the Player to your HTML

Place the custom element wherever you want the tour to appear. You can pass a specific tour URL.

```
<audio-tour-player src="./tours/my-tour.json"></audio-tour-player>

<script type="module">
  // 2. (Optional) Enable offline support if using the provided sw.js
  const player = document.querySelector('audio-tour-player');
  player.enableOffline();
</script>
```

### Create your my-tour.json

The heart of your tour is a simple JSON file. It could be stored locally. If it is on a remote server or different domain then remember to set CORS on your server. Each "stop" supports a title, description, background image, and an audio track.

```
{
  "stops": [
    {
      "title": "Welcome to the Tour",
      "desc": "This is the main menu. From here you can download the tour for offline use or select a specific stop.",
      "image": "assets/intro-bg.jpg",
      "audio": null
    },
    {
      "title": "The Ancient Well",
      "desc": "You are standing before a site of significant local history...",
      "image": "assets/stop1.jpg",
      "audio": "assets/audio/stop1.mp3"
    }
  ]
}
```

### Offline Support

To enable offline caching, ensure `sw.js` is in your public root and call:

```
javascript
const player = document.querySelector('audio-tour-player');
player.enableOffline();
```

(see Add the player to your HTML section above)

### Suggested folder structure

```
project-root/
├── index.html
├── sw.js                # Copy this from node_modules/audio-tour-player/sw.js
├── audio-tour-player.js
├── tours/
│   └── my-tour.json
├── images/
└── audio/
```

## Local Development

If you want to modify the player or run the built-in demo:

Clone the repo: `git clone https://github.com/rdjenkins/audio-tour.git`

Install dependencies: `npm install`

Prepare the demo files: `npm run prepare-demo`

copy the contents of the dist/ folder to you server ... OR

Start the preview server: `npm run preview`

## License

This project is licensed under the MIT License.

That means you are free to use, copy, modify, merge, publish, and even sell this software in both personal and commercial projects. All we ask is that you keep the original copyright notice.

## Acknowledgements

Inspired by the full page background image and simple HTML5 audio of <https://github.com/NP102456/audio-tour>
