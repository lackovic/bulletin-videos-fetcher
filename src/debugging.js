const Browser = require("zombie");

const browser = new Browser();

const getVideos = () => {
  browser.assert.success();
  const videos = browser.querySelectorAll("video");
  console.log(`videos.length = ${videos.length}`);
};

browser.on("done", () => console.log("page has done"));
browser.on("loaded", () => console.log("page has loaded"));
browser.on("loading", () => console.log("page is loading"));
browser.on("evaluated", () => console.log("page is evaluated"));
browser.on("error", (error) => console.log("ERROR=", error));
browser.on("idle", () => getVideos());

browser.visit("https://it.euronews.com/bulletin", () => {
  console.log("page is visited");
  browser.on("done", () => console.log("page has visitedone"));
});

setTimeout(() => {}, 120000);

// "#jsMainMediaVideo > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video"
