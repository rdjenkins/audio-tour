import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const htmlPath = path.resolve('index.html');
const distHtmlPath = path.resolve(distDir, 'index.html');

// 1. Read the original index.html
let html = fs.readFileSync(htmlPath, 'utf8');

// 2. Change the script source from the src/player.js to the bundled library file
// We match the script tag and replace it
html = html.replace(
    'src="./src/player.js"',
    'src="./audio-tour-player.js"'
);

// 3. Write it to the dist folder
fs.writeFileSync(distHtmlPath, html);

console.log('✅ Production index.html generated in /dist');