const path = require("path");
const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "video",
    author: "",
    countdown: 5,
    role: 0,
    category: "media",
    shortDescription: {
      en: "Search video from YouTube",
    },
  },
  onStart: async function ({ api, args, event }) {
    try {
      const searchQuery = args.join(" ");
      if (!searchQuery) {
        const messageInfo = await new Promise((resolve) => {
          api.sendMessage("Usage: video <search text>", event.threadID, (err, info) => {
            resolve(info);
          });
        });
        setTimeout(() => {
          api.unsendMessage(messageInfo.messageID);
        }, 10000);
        return;
      }

      const searchingMessage = await new Promise((resolve) => {
        api.sendMessage(`⏱️ | Searching for '${searchQuery}', please wait...`, event.threadID, (err, info) => {
          resolve(info);
        });
      });

      const videoSearchUrl = `https://betadash-search-download.vercel.app/yt?search=${encodeURIComponent(searchQuery)}`;
      const videoResponse = await axios.get(videoSearchUrl);
      const videoData = videoResponse.data[0];

      const { url: videoUrl, title, time, views, thumbnail, channelName } = videoData;

      const downloadUrl = `https://yt-video-production.up.railway.app/ytdl?url=${videoUrl}`;
      const vidResponse = await axios.get(downloadUrl);
      const videoFile = vidResponse.data.video;

      const videoPath = path.join(__dirname, "cache", "videov2.mp4");
      const videoContent = await axios.get(videoFile, { responseType: "arraybuffer" });
      fs.writeFileSync(videoPath, Buffer.from(videoContent.data));

      api.unsendMessage(searchingMessage.messageID);

      await api.sendMessage(
        {
          body: `Here's your video, enjoy! 🥰\n\n𝗧𝗶𝘁𝗹𝗲: ${title}\n𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${time}\n𝗩𝗶𝗲𝘄𝘀: ${views}`,
          attachment: fs.createReadStream(videoPath),
        },
        event.threadID,
        event.messageID
      );

      fs.unlinkSync(videoPath);
    } catch (error) {
      const errorMessage = await new Promise((resolve) => {
        api.sendMessage(error.message, event.threadID, (err, info) => {
          resolve(info);
        });
      });
      setTimeout(() => {
        api.unsendMessage(errorMessage.messageID);
      }, 10000);
    }
  },
};