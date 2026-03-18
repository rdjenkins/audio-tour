# About

We needed to deliver offline-capable audio tours for 100+ venues in rural Cornwall so just built our own library. It could be useful for your project as it handles the audio controls, and extras such as caching and touch gestures so you can focus on the content.

![npm version](https://img.shields.io/npm/v/audio-tour-player) <https://www.npmjs.com/package/audio-tour-player>

This is the audio tour software for <https://celticquietplaces.com/>.

## Features

Framework Agnostic – Built with native Web Components. Seamlessly drop it into React, Vue, Svelte, or a plain HTML file without changing a line of code.

JSON-Driven Content – Define your entire tour in a single .json file. Support for local assets or remote media URLs makes deployment a breeze.

Bulletproof Offline Mode – First-class support for the Cache API and Service Workers. Your users can download tours and explore with zero signal.

Ultra Lightweight – Fast load times and a tiny bundle footprint.

Whole page experience - full page portrait images (on mobiles) with audio controls.

Native-Feel Interactions – Includes smooth touch gestures, swipe navigation, and high-performance SVG animations for a premium app feel. Check out the spinning headphones.

## Roadmap

NPM Package: Now available as a lightweight npm module.

## Getting started

### Installation

#### Via npm

Ideal for modern web projects using Vite, Webpack, or any JavaScript framework.

```
npm install audio-tour-player
```

Then, import it into your main JavaScript or TypeScript file:

```
import 'audio-tour-player';
```

### Add the Player to your HTML

Use the custom element to display the tour. You can pass a specific tour URL.

```
<audio-tour-player src="./tours/my-tour.json"></audio-tour-player>

<script type="module">
  // (Optional) Enable offline support if using the provided sw.js
  const player = document.querySelector('audio-tour-player');
  player.enableOffline();
</script>
```

### Create your my-tour.json

The tour is controlled by a simple JSON file. If youbare going to work cross-origin (storing media and you json file on different domain) then remember to set CORS on that server. Each "stop" supports a title, description, background image, and an audio track.

```
{
  "stops": [
    {
      "title": "Welcome to the Tour",
      "desc": "This is the main menu. From here you can download the tour for offline use or select a specific stop.",
      "image": "assets/intro-bg.jpg"
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

To enable offline caching, ensure the service worker `sw.js` is in the root of your project and call:

```
javascript
const player = document.querySelector('audio-tour-player');
player.enableOffline();
```

(see 'Add the player to your HTML' section above)

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

## Vite / React / Svelt build frameworks

Using a bundler? Import the package in your main JS entry point instead.

e.g. main.js

```
import 'audio-tour-player';

const initPlayer = () => {
  const player = document.querySelector('audio-tour-player');
  
  if (player) {
    player.enableOffline();
    console.log("Tour player ready and offline mode enabled.");
  }
};

if (customElements.get('audio-tour-player')) {
  initPlayer();
} else {
  customElements.whenDefined('audio-tour-player').then(initPlayer);
}
```


## License

This project is licensed under the MIT License.

That means you are free to use, copy, modify, merge, publish, and even sell this software in both personal and commercial projects. All we ask is that you keep the original copyright notice.

## Acknowledgements

Inspired by the full page background image and simple HTML5 audio of <https://github.com/NP102456/audio-tour>
