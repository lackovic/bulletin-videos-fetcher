require("dotenv").config();
const path = require("path");
const fetch = require("node-fetch");
const youtubedl = require("youtube-dl");
const fs = require("fs");
const boxen = require("boxen");

const url = process.env.URL;
const baseDir = process.env.DOWNLOAD_DIRECTORY.replace(/\//g, path.sep).replace(
  /\\/g,
  path.sep
);
const today = new Date().toISOString().replace(/:/g, ".").slice(0, -14);
const videosDir = `${baseDir}${path.sep}${today}${path.sep}`;
const debugDir = `${videosDir}debug${path.sep}`;

console.log(
  boxen(`Fetching videos from ${url}`, { padding: 1, borderStyle: "round" })
);

const download = (item) => {
  if (item.videos && item.videos.length > 0) {
    const videoJson = item.videos.filter((v) => (v.quality = "hd"))[1];
    const videoUrl = videoJson.youtubeId ?? videoJson.url;
    const video = youtubedl(videoUrl);
    const fileName = capitalize(item.url.replace(/-/g, " "));
    video.on("info", function (info) {
      console.log(`Downloading ${fileName} (size ${info.size})`);
    });
    video.pipe(fs.createWriteStream(`${videosDir}${fileName}.mp4`));
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

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}

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
