require('http').createServer((req, res) => res.end('Hola')).listen();

//const { discord, Client, GatewayIntentBits } = require("discord.js");

/*const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]
});
*/

const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "GuildVoiceStates",
        "MessageContent"
    ]
});
config = require("./config.json");
client.emotes = config.emoji;
const prefix = '!';

client.once('ready', () => {
    console.log('el bot qlo ta listo po wn');
    client.application.commands.set([
        {
            name: 'ping',
            description: 'dice pong',
            options: [],
        }
    ])
});

const  Distube  = require('distube');

client.distube = new Distube.default(client, {
    leaveOnStop: false,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false
});

client.on('interactionCreate', (int) =>{
    if(!int.isCommand) return;
    
    const command = int.commandName;

    if(command === 'ping') {
        int.reply('Pong!');
    }
})

client.on('messageCreate', async message => {
    if(message.author.bot || !message.guild) return;

    const prefix = '&';
    const args = message.content.slice(prefix.length).trim().split(/ +/g);

    if(!message.content.toLocaleLowerCase().startsWith(prefix)) return;

    const comm = args.shift().toLowerCase();

    if(comm === 'jugar') {
        client.distube.play(message.member.voice.channel, args.join(" "), {
            member: message.member,
            textChannel: message.channel,
            message
        })
    }
    else if (comm === 'pausa') {
        const queue = client.distube.getQueue(message)
        if (!queue) return message.channel.send(`${client.emotes.error} | rebisa tu cola, esta está basia`)
        if (queue.paused) {
          queue.resume()
          return message.channel.send('ya ta sonando otra be :)')
        }
        queue.pause()
        message.channel.send('tomate tu tiempo :)')
    }
    else if (comm === 'detener') {
        const queue = client.distube.getQueue(message)
        if (!queue) return message.channel.send(`${client.emotes.error} | rebisa tu cola, esta está basia`)
        queue.stop()
        message.channel.send(`seaca bo`)
    }else if(comm === 'skip') {
        const queue = client.distube.getQueue(message)
        if (!queue) return message.channel.send(`${client.emotes.error} | rebisa tu cola, esta está basia`)
        try {
          const song = await queue.skip()
          message.channel.send(`${client.emotes.success} | lasal te aora suena:\n${song.name}`)
        } catch (e) {
          message.channel.send(`${client.emotes.error} | ${e}`)
        }        
    }
})
/*
client.distube.on("playSong", (queue, song) => {
    queue.textChannel.send("ute ta ecuchando: " + song.name)
})*/

const status = queue =>
  `👍`
client.distube
  .on('playSong', (queue, song) =>
    queue.textChannel.send(
      `${client.emotes.play} | ute ta ecuchando \`${song.name}\` - \`${song.formattedDuration}\`\nlapidio: ${
        song.user
      }\n${status(queue)}`
    )
  )
  .on('addSong', (queue, song) =>
    queue.textChannel.send(
      `${client.emotes.success} | ceaña dió ${song.name} - \`${song.formattedDuration}\` a la cola x: ${song.user}`
    )
  )
  .on('addList', (queue, playlist) =>
    queue.textChannel.send(
      `${client.emotes.success} | ceaña dió \`${playlist.name}\` playlist (${
        playlist.songs.length
      } songs) a la cola\n${status(queue)}`
    )
  )
  .on('error', (channel, e) => {
    if (channel) channel.send(`${client.emotes.error} | ubo un error llamen a la polisia: ${e.toString().slice(0, 1974)}`)
    else console.error(e)
  })
  .on('empty', channel => channel.send('nome gusta estar solo adio'))
  .on('searchNoResult', (message, query) =>
    message.channel.send(`${client.emotes.error} | no encontré na \`${query}\`!`)
  )
  .on('finish', queue => queue.textChannel.send('seaca bo'))

client.login(config.token);
