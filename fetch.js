import * as dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import fetch from 'node-fetch';
import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import boxen from 'boxen';

const getBaseDir = () => {
  const dir = process.env.BASE_DIR.replace(/\//g, path.sep).replace(
    /\\/g,
    path.sep
  );
  return fs.existsSync(dir) ? dir : ".";
};

const url = process.env.URL;
const baseDir = getBaseDir();
const today = new Date().toISOString().replace(/:/g, ".").slice(0, -14);
const videosDir = `${baseDir}${path.sep}${today}${path.sep}`;
const debugDir = `${videosDir}debug${path.sep}`;

console.log(
  boxen(`Fetching videos\nfrom = ${url}\nto = ${videosDir}`, {
    padding: 1,
    borderStyle: "round",
  })
);

const download = (item) => {
  if (item.videos && item.videos.length > 0) {
    const videoJson = item.videos.filter((v) => (v.quality = "hd"))[1];
    const videoUrl = videoJson.youtubeId ?? videoJson.url;
    const fileName = capitalize(item.url.replace(/-/g, " "));
    youtubedl(videoUrl, {
      output: `${videosDir}${fileName}.mp4`,
      referer: videoUrl
    }).then(output => console.log(output));
  } else {
    console.log(`No videos found for "${item.title}" - see item.log file`);
    const now = new Date().toISOString().replace(/:/g, ".").slice(0, -5);
    fs.writeFile(
      `${now}-item.json`,
      JSON.stringify(item, null, "  "),
      () => {}
    );
  }
};

const capitalize = (s) => {
  return s[0].toUpperCase() + s.slice(1);
};

(async () => {
  const response = await fetch(url);
  const html = await response.text();
  const dataContent = JSON.parse(
    html.match(/data-content="(.*)"/)[1].replace(/&quot;/g, '"')
  );
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir);
    fs.mkdirSync(debugDir);
  } else if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir);
  }
  fs.writeFile(
    `${debugDir}data-content.json`,
    JSON.stringify(dataContent, null, "  "),
    () => {}
  );
  fs.writeFile(`${debugDir}page.html`, html, () => {});
  try {
    dataContent.forEach((item) => download(item));
  } catch (error) {
    const now = new Date().toISOString().replace(/:/g, ".").slice(0, -5);
    console.log(`ERROR: ${error.message} - see stacktrace.log file`);
    fs.writeFile(`${now}-stacktrace.log`, error.stack, () => {});
  }
})();
