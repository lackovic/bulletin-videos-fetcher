require("dotenv").config();
const fetch = require("node-fetch");
const youtubedl = require("youtube-dl");
const fs = require("fs");
const url = process.env.URL;
const boxen = require("boxen");

console.log(
  boxen(`Fetching videos from ${url}`, { padding: 1, borderStyle: "round" })
);

const download = (item) => {
  const videoJson = item.videos.filter((v) => (v.quality = "hd"))[1];
  const videoUrl = videoJson.youtubeId ?? videoJson.url;
  const video = youtubedl(videoUrl);
  video.on("info", function (info) {
    console.log(`Downloading ${info._filename} (size ${info.size})`);
  });
  video.pipe(fs.createWriteStream(`${item.id}.mp4`));
};

(async () => {
  const response = await fetch(url);
  const html = await response.text();
  const dataContent = JSON.parse(
    html.match(/data-content="(.*)"/)[1].replace(/&quot;/g, '"')
  );
  dataContent.forEach((item) => download(item));
})();
