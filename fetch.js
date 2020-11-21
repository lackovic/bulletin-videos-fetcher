require("dotenv").config();
const fetch = require("node-fetch");
const youtubedl = require("youtube-dl");
const fs = require("fs");
const url = process.env.URL;
const boxen = require("boxen");

console.log(
  boxen(`Fetching videos from ${url}`, { padding: 1, borderStyle: "round" })
);

const download = (item, dir) => {
  if (item.videos && item.videos.length > 0) {
    const videoJson = item.videos.filter((v) => (v.quality = "hd"))[1];
    const videoUrl = videoJson.youtubeId ?? videoJson.url;
    const video = youtubedl(videoUrl);
    const fileName = capitalize(item.url.replace(/-/g, " "));
    video.on("info", function (info) {
      console.log(`Downloading ${fileName} (size ${info.size})`);
    });
    video.pipe(fs.createWriteStream(`${dir}/${fileName}.mp4`));
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
  const today = new Date().toISOString().replace(/:/g, ".").slice(0, -14);
  var dir = `./${today}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  fs.writeFile(
    `${dir}/data-content.json`,
    JSON.stringify(dataContent, null, "  "),
    () => {}
  );
  fs.writeFile(`${dir}/page.html`, html, () => {});
  try {
    dataContent.forEach((item) => download(item, dir));
  } catch (error) {
    const now = new Date().toISOString().replace(/:/g, ".").slice(0, -5);
    console.log(`ERROR: ${error.message} - see stacktrace.log file`);
    fs.writeFile(`${now}-stacktrace.log`, error.stack, () => {});
  }
})();
