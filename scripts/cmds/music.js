const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "music",
    author: "Cliff",
    countDown: 5,
    role: 0,
    category: "AUDIO",
    shortDescription: {
      en: "Play a song from Spotify"
    }
  },

  onStart: async function ({ api, event, args }) {
    const search = args.join(" ");

    try {
      if (!search) {
        const messageInfo = await new Promise(resolve => {
          api.sendMessage('Please provide the name of the song you want to search.', event.threadID, (err, info) => {
            resolve(info);
          });
        });

        setTimeout(() => {
          api.unsendMessage(messageInfo.messageID);
        }, 10000);

        return;
      }

      const findingMessage = await new Promise(resolve => {
        api.sendMessage(`Searching for "${search}"`, event.threadID, (err, info) => {
          resolve(info);
        });
      });

      const apiUrl = `https://dlvc.vercel.app/yt-audio?search=${encodeURIComponent(search)}`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.downloadUrl) {
        const { downloadUrl, title, time, views, Artist, album, thumbnail, channelName } = response.data;

        const cacheDir = path.join(__dirname, 'cache');
        const fileName = `${title}.mp3`;
        const filePath = path.join(cacheDir, fileName);

        fs.ensureDirSync(cacheDir);

        const musicResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });

        fs.writeFileSync(filePath, musicResponse.data);

        await new Promise(resolve => {
          api.sendMessage({
            body: `Here is your music 👍\n\nTitle: ${title}\nViews: ${views}\nArtist: ${Artist}`,
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => {
            fs.unlinkSync(filePath);
            resolve();
          }, event.messageID);
        });

        api.unsendMessage(findingMessage.messageID);
      } else {
        const noResultMessage = await new Promise(resolve => {
          api.sendMessage('No songs found for the given title.', event.threadID, (err, info) => {
            resolve(info);
          });
        });

        setTimeout(() => {
          api.unsendMessage(noResultMessage.messageID);
        }, 10000);

        return;
      }
    } catch (error) {
      const errorMessage = await new Promise(resolve => {
        api.sendMessage('An error occurred while searching for the song.', event.threadID, (err, info) => {
          resolve(info);
        });
      });

      setTimeout(() => {
        api.unsendMessage(errorMessage.messageID);
      }, 10000);

      return;
    }
  }
};