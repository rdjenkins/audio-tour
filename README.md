# About

We needed to deliver offline-capable audio tours for 100+ venues in rural Cornwall so just built our own library. It could be useful for your project as it handles the audio controls, and extras such as caching and touch gestures so you can focus on the content.

[![npm version](https://img.shields.io/npm/v/audio-tour-player)](https://www.npmjs.com/package/audio-tour-player)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is the audio tour software we are developing for <https://celticquietplaces.com/> (see examples below).

## Features

Native Web Components – Works in React, Vue, Svelte, or a plain HTML file.

JSON-Driven Content – Tours defined in a single .json file. Support for local media or remote URLs.

Storage interface – Supports the Cache API using a Service Worker. Your users can download tours and then explore with zero signal. The built-in default is for browsers so works great for websites but NOT for within apps such those using capacitor. For capacitor (like us) you need to inject a new storage function (see example below).

Lightweight – Tiny bundle footprint.

Whole page experience - full page portrait images (on mobiles) with audio controls.

Native-Feel Interactions – Includes smooth touch gestures, swipe navigation, and high-performance SVG animations for a premium app feel. Check out the spinning headphones.

NPM Package: Available as a lightweight npm module. See examples [audio-tour-player-example](https://github.com/rdjenkins/audio-tour-player-example), [audio-tour-player-capacitor-example](https://github.com/rdjenkins/audio-tour-player-capacitor-example)

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

Use the custom element to display the tour. Pass your specific tour URL.

```
<audio-tour-player src="./tours/my-tour.json"></audio-tour-player>
```

You can optionally define other features:

offline-capable - true (default) / false

cache-name - any string

```
<audio-tour-player 
    src="./tours/my-tour.json"
    offline-capable="true"
    cache-name="cqp1"
    >
</audio-tour-player>
```

The default cache name is "audio-tour-player-cache-v1".

The default storage interface is for a browser environment and will use a service worker (see Offline support below) and the Cache API for offline storage.

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

To enable offline caching, ensure the service worker `sw.js` is in the root of your project (or in your public/ folder depending on your build tool). You can copy the `sw.js` file from node_modules/audio-tour-player/sw.js

The default offline support with a service worker only functions within a client's browser. They visit the audio tour and click the 'Download for offline use' button and then the files are available (as long as the service worker keeps running). Service workers may stop running if not used.

#### Injecting a new storage

For capacitor you won't need to worry about the service worker as it won't work. However, you need to inject new functionality for storage after initiating the player. We use our own functions based on @capacitor/filesytem

See [audio-tour-player-capacitor-example](https://github.com/rdjenkins/audio-tour-player-capacitor-example) for a working example.

e.g.

```
import 'audio-tour-player'
import { capacitorStorageDelegate, capacitorUrlRewriter } from './capacitor-bridge.js';


// Wait for the DOM to be ready and initiate the player
document.addEventListener('DOMContentLoaded', () => {
  const player = document.querySelector('audio-tour-player');

  if (player.attributes.src) {
    console.log('Audio Player present and src attribute is set.');
  }

  // Inject the Capacitor logic
  player.storage = capacitorStorageDelegate;
  player.urlRewriter = capacitorUrlRewriter;
});
```

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

## License

This project is licensed under the MIT License.

That means you are free to use, copy, modify, merge, publish, and even sell this software in both personal and commercial projects. All we ask is that you keep the original copyright notice.

## Acknowledgements

Inspired by the full page background image and simple HTML5 audio of <https://github.com/NP102456/audio-tour>
