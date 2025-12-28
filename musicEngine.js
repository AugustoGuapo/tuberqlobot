/**
 * Music Engine Module for Discord Bot
 * Uses youtubei.js for YouTube search and streaming, @discordjs/voice for voice handling.
 * Provides queue management, playback controls, and error handling.
 */

const youtubeDl = require('youtube-dl-exec');
const { Innertube } = require('youtubei.js');
const path = require('path');
const { spawn } = require('child_process');

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType
} = require('@discordjs/voice');

// In-memory storage for queues per guild
const queues = new Map();

// YouTube client
let youtube;

/**
 * Initialize YouTube client
 */
async function initializeYouTube() {
  if (!youtube) {
    try {
      youtube = await Innertube.create();
      console.log('YouTube client initialized');
    } catch (error) {
      console.error('Failed to initialize YouTube client:', error);
      throw error;
    }
  }
  return youtube;
}

/**
 * Get or create a queue for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The queue object
 */
function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, {
      songs: [],
      currentIndex: -1,
      player: null,
      connection: null,
      volume: 0.5,
      playing: false,
      paused: false,
      textChannel: null,
      voiceChannel: null
    });
  }
  return queues.get(guildId);
}

/**
 * Search for a song on YouTube
 * @param {string} query - The search query or YouTube URL
 * @returns {Object|null} Song info or null if not found
 */
async function searchSong(query) {
  try {
    await initializeYouTube();

    // Check if query is a YouTube URL
    const youtubeUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const urlMatch = query.match(youtubeUrlRegex);
    let videoId;
    let videoInfo;

    if (urlMatch) {
      videoId = urlMatch[1];
      console.log('Extracted video ID from URL:', videoId);
      try {
        videoInfo = await youtube.getInfo(videoId);
      } catch (error) {
        console.error('Error fetching video info from URL:', error);
        return null;
      }
    } else {
      // Search for the video
      console.log('Searching YouTube for:', query);
      try {
        const searchResults = await youtube.search(query, { type: 'video' });
        if (!searchResults.videos || searchResults.videos.length === 0) {
          console.log('No search results found');
          return null;
        }
        videoInfo = searchResults.videos[0];
        videoId = videoInfo.id;
        console.log('Found video from search:', videoId);
      } catch (error) {
        console.error('Error searching YouTube:', error);
        return null;
      }
    }

    if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
      console.error('Invalid video ID:', videoId);
      return null;
    }

    const title = videoInfo.basic_info?.title || videoInfo.title?.text || videoInfo.title || 'Unknown Title';
    const duration = videoInfo.basic_info?.duration || videoInfo.duration?.seconds || 0;
    const author = videoInfo.basic_info?.author || videoInfo.author?.name || 'Unknown';
    const thumbnail = videoInfo.basic_info?.thumbnail?.[0]?.url || videoInfo.thumbnails?.[0]?.url || '';

    const song = {
      id: videoId,
      title: title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      duration: duration,
      thumbnail: thumbnail,
      author: author
    };

    console.log('Found song:', song);
    return song;
  } catch (error) {
    console.error('Error in searchSong:', error);
    return null;
  }
}

/**
 * Get audio stream for a video ID
 * @param {string} videoId - The YouTube video ID
 * @returns {Stream} Audio stream
 */
async function getAudioStream(videoId) {
  try {
    if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
      throw new Error(`Invalid video ID: ${videoId}`);
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('Streaming audio from:', url);

    // Get the yt-dlp binary path from youtube-dl-exec constants
    const { constants } = require('youtube-dl-exec');
    const ytdlpPath = constants.YOUTUBE_DL_PATH;
    const os = require('os');

    // Use temp directory for any cached files to avoid cluttering project
    const tempDir = path.join(os.tmpdir(), 'tuberqlobot-cache');

    const ytdlp = spawn(ytdlpPath, [
      url,
      '-f', 'ba',                                    // Best audio format
      '-o', '-',                                     // Output to stdout (streaming)
      '--quiet',                                     // No console output
      '--no-warnings',                               // Suppress warnings
      '--no-check-certificate',                      // HTTPS without cert validation
      '--socket-timeout', '30',                      // 30s socket timeout
      '--cache-dir', tempDir,                        // Cache to system temp dir
      '--no-part',                                   // Don't use .part files
      '--progress-template', 'noop'                  // No progress output
    ]);

    if (!ytdlp.stdout) {
      throw new Error('Failed to create audio stream');
    }

    console.log('yt-dlp streaming started');

    ytdlp.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('decipher')) {  // Ignore known warnings
        console.warn(`yt-dlp: ${msg}`);
      }
    });

    ytdlp.on('error', (err) => {
      console.error('yt-dlp process error:', err.message);
    });

    return ytdlp.stdout;
  } catch (error) {
    console.error('Error getting audio stream:', error);
    throw new Error(`Failed to get audio stream: ${error.message}`);
  }
}

/**
 * Play a song or add to queue
 * @param {Object} message - Discord message object
 * @param {string} query - Search query or YouTube URL
 */
async function play(message, query) {
  const guildId = message.guild.id;
  const queue = getQueue(guildId);
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    return message.channel.send('You need to be in a voice channel to play music!');
  }

  // Search for the song
  const song = await searchSong(query);
  if (!song || !song.id) {
    return message.channel.send('No results found for that query.');
  }

  // Add to queue
  queue.songs.push(song);
  queue.textChannel = message.channel;
  queue.voiceChannel = voiceChannel;

  // If not playing, start playing
  if (!queue.playing) {
    await playNext(guildId);
  } else {
    message.channel.send(`Added to queue: **${song.title}**`);
  }
}

/**
 * Play the next song in the queue
 * @param {string} guildId - The guild ID
 */
async function playNext(guildId) {
  const queue = getQueue(guildId);

  if (queue.songs.length === 0) {
    queue.playing = false;
    if (queue.connection) {
      queue.connection.destroy();
      queue.connection = null;
    }
    return;
  }

  queue.currentIndex++;
  if (queue.currentIndex >= queue.songs.length) {
    queue.currentIndex = -1;
    queue.playing = false;
    return;
  }

  const song = queue.songs[queue.currentIndex];

  if (!song || !song.id) {
    console.log('Skipping invalid song:', song);
    playNext(guildId);
    return;
  }

  try {
    console.log('Playing song:', song.title);

    // Join voice channel if not connected
    if (!queue.connection) {
      queue.connection = joinVoiceChannel({
        channelId: queue.voiceChannel.id,
        guildId: guildId,
        adapterCreator: queue.voiceChannel.guild.voiceAdapterCreator,
      });

      queue.connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(queue.connection, VoiceConnectionStatus.Signalling, 5000),
            entersState(queue.connection, VoiceConnectionStatus.Connecting, 5000),
          ]);
        } catch {
          if (queue.connection) queue.connection.destroy();
        }
      });
    }

    // Create audio player if not exists
    if (!queue.player) {
      queue.player = createAudioPlayer();
      queue.connection.subscribe(queue.player);

      queue.player.on(AudioPlayerStatus.Idle, () => {
        playNext(guildId);
      });

      queue.player.on('error', (error) => {
        console.error('Audio player error:', error);
        queue.textChannel.send('An error occurred while playing the song.');
        playNext(guildId);
      });
    }

    // Get audio stream
    const stream = await getAudioStream(song.id);
    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true
    });
    resource.volume.setVolume(queue.volume);

    queue.player.play(resource);
    queue.playing = true;
    queue.paused = false;

    queue.textChannel.send(`Now playing: **${song.title}**`);
  } catch (error) {
    console.error('Error playing song:', error);
    queue.textChannel.send(`Failed to play the song: ${error.message}`);
    playNext(guildId);
  }
}

/**
 * Skip the current song
 * @param {Object} message - Discord message object
 */
function skip(message) {
  const guildId = message.guild.id;
  const queue = getQueue(guildId);

  if (!queue.playing) {
    return message.channel.send('No song is currently playing.');
  }

  if (queue.player) {
    queue.player.stop();
  }
  message.channel.send('Skipped the current song.');
}

/**
 * Pause the current song
 * @param {Object} message - Discord message object
 */
function pause(message) {
  const guildId = message.guild.id;
  const queue = getQueue(guildId);

  if (!queue.playing || queue.paused) {
    return message.channel.send('No song is currently playing or already paused.');
  }

  if (queue.player) {
    queue.player.pause();
    queue.paused = true;
  }
  message.channel.send('Paused the music.');
}

/**
 * Resume the current song
 * @param {Object} message - Discord message object
 */
function resume(message) {
  const guildId = message.guild.id;
  const queue = getQueue(guildId);

  if (!queue.paused) {
    return message.channel.send('The music is not paused.');
  }

  if (queue.player) {
    queue.player.unpause();
    queue.paused = false;
  }
  message.channel.send('Resumed the music.');
}

/**
 * Stop the music and clear the queue
 * @param {Object} message - Discord message object
 */
function stop(message) {
  const guildId = message.guild.id;
  const queue = getQueue(guildId);

  if (!queue.playing) {
    return message.channel.send('No music is playing.');
  }

  queue.songs = [];
  queue.currentIndex = -1;
  queue.playing = false;
  queue.paused = false;

  if (queue.player) {
    queue.player.stop();
  }
  if (queue.connection) {
    queue.connection.destroy();
    queue.connection = null;
  }
  message.channel.send('Stopped the music and cleared the queue.');
}

/**
 * Set the volume
 * @param {Object} message - Discord message object
 * @param {number} volume - Volume level (0-100)
 */
function setVolume(message, volume) {
  const guildId = message.guild.id;
  const queue = getQueue(guildId);

  if (isNaN(volume) || volume < 0 || volume > 100) {
    return message.channel.send('Please provide a volume between 0 and 100.');
  }

  queue.volume = volume / 100;
  if (queue.player && queue.player.state.resource) {
    queue.player.state.resource.volume.setVolume(queue.volume);
  }
  message.channel.send(`Volume set to ${volume}%.`);
}

/**
 * Leave the voice channel
 * @param {Object} message - Discord message object
 */
function leave(message) {
  const guildId = message.guild.id;
  const queue = getQueue(guildId);

  if (queue.connection) {
    queue.connection.destroy();
    queue.connection = null;
  }
  queue.player = null;
  queue.playing = false;
  queue.paused = false;
  message.channel.send('Left the voice channel.');
}

/**
 * Get the current queue
 * @param {Object} message - Discord message object
 */
function getQueueInfo(message) {
  const guildId = message.guild.id;
  const queue = getQueue(guildId);

  if (queue.songs.length === 0) {
    return message.channel.send('The queue is empty.');
  }

  let queueMessage = 'Current Queue:\n';
  queue.songs.forEach((song, index) => {
    const status = index === queue.currentIndex ? ' (Now Playing)' : '';
    queueMessage += `${index + 1}. ${song.title}${status}\n`;
  });
  message.channel.send(queueMessage);
}

module.exports = {
  play,
  skip,
  pause,
  resume,
  stop,
  setVolume,
  leave,
  getQueue: getQueueInfo
};