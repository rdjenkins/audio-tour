# About

Building a reliable, offline-ready audio player for the web is time consuming. This library handles the edge cases (caching, range requests, touch gestures) so you can focus on the content.

This is the audio tour software for <https://celticquietplaces.com/>. It is being designed as a library so that it can be used in our other projects such as Grampound Digital Twin.

## Features

​Zero-Config UI: A robust, mobile-first audio experience right out of the box.

​Framework Agnostic: Built with pure Web Components. Use it with React, Vue, Svelte, or just a plain HTML file.

​JSON-Driven Storytelling: Define your entire tour in a simple .json file. Link to local files or remote URLs - the player handles the rest.

​Bulletproof Offline Mode: One-tap preloading using the Cache API and Service Workers. Your users can keep exploring even in "dead zones" or deep in the countryside.

​Native Feel: Includes smooth touch gestures (swipe to navigate) and high-performance SVG animations.

## Roadmap

NPM Package: Soon to be available as a lightweight, zero-dependency npm module.

## Getting started

### Installation

For now, simply include the script in your project. (NPM support coming soon!)

```
<script type="module" src="./audio-tour-player.js"></script>
```

### Add the Player to your HTML

Place the custom element wherever you want the tour to appear. You can pass a specific tour via URL parameters (e.g., ?tour=st-nuns) or configure the default in the script.

```
<audio-tour-player></audio-tour-player>
```

### Create your tour.json

The heart of your tour is a simple JSON file. Place this in a /tours folder. Each "stop" supports a title, description, background image, and an audio track.

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

### Enable Offline Capabilities (Optional)

To enable the "Download for Offline Use" feature, ensure the sw.js file is in your root directory. The player will automatically attempt to register the Service Worker and provide the download UI to your users.

## Acknowledgements

Inspired by the full page background image and simple HTML5 audio of <https://github.com/NP102456/audio-tour>
