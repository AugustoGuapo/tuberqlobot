require("dotenv").config();

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

const { SpotifyPlugin } = require('@distube/spotify')
const prefix = '!';

client.once('ready', () => {
    console.log('el bot qlo ta listo po wn');
    client.application.commands.set([
        {
            name: 'ping',
            description: 'dice pong',
            options: [],
        },
        {
            name: 'ayua',
            description: 'Información general sobre todos los comandos',
            options: []
        }
    ])
});

const  Distube  = require('distube');

client.distube = new Distube.default(client, {
    leaveOnStop: false,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    plugins: [
      new SpotifyPlugin({
        emitEventsAfterFetching: true
      })
    ]
});

client.on('interactionCreate', (int) =>{
    if(!int.isCommand) return;
    
    const command = int.commandName;

    if(command === 'ping') {
        int.reply('Pong!');
    }
    else if(command === 'ayua') {
        int.reply(config.ayuda);
    }
})

client.on('messageCreate', async message => {
    if(message.author.bot || !message.guild) return;

    const prefix = config.prefix;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);

    if(!message.content.toLocaleLowerCase().startsWith(prefix)) return;

    const comm = args.shift().toLowerCase();
    //if(!message.member.voice.channel) return message.channel.send('entra en un canal primero tonto')
    if(comm === 'jugar') {
        if (!message.member.voice.channel) return message.channel.send('entra en un canal primero tonto');
        if(args.join(" ") === "") return message.channel.send('no soi tonto eso ta basio');
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
    else if(comm === 'volumen') {
        const queue = client.distube.getQueue(message)
        if (!queue) return message.channel.send(`${client.emotes.error} | cin cola no puedo cambiar el bolumne`)
        const volume = parseInt(args[0])
        if (isNaN(volume) || volume > 100 || volume < 0) return message.channel.send(`${client.emotes.error} | mete un numero k sirba tonto`)
        queue.setVolume(volume)
        message.channel.send(`${client.emotes.success} | listo tu bolumne aora e: \`${volume}\``)
    }

    else if(comm === 'adio') {
      
      if (!message.member.voice.channel) return message.channel.send('entra en un canal primero tonto')
      const voiceChannel = client.distube.voices.get(message)
      if(!voiceChannel) return message.channel.send('weje no estoi en ningun canal :p')
      
      message.channel.send('ok m boi >:( ').then(() => {
        client.distube.voices.leave(message)
      }).catch(error => console.log(error));
    }

    else if(comm == 'teamo') {
      const randomNumber = Math.floor(Math.random() * 2)
      const outputMessage = randomNumber === 1 ? 'yo ati <3': 'grasias'
      return message.channel.send(outputMessage)
    }

    /* 
    COMANDOS PARA HALLOWEEN
     */

    else if (comm === 'dulseotruco') {
      const memberId = message.member.id
      var outputMessage = memberId == '250464961418100737' || memberId == '289579426365177856' ? 'dulse x wapo':'truco x feo'
      outputMessage = memberId == '514162096733159424' ? 'dulse x wapa': outputMessage
      return message.channel.send(outputMessage)
    }

    else if (comm === 'historia') {
      return message.channel.send('eta era la istoria de un muchacho k migro de benesuela a islamdia i una noche sedur mio y los banpiros lo agarraron y lo deportaron 👻👻👻')
    }

    else if (comm === 'boo') {
      return message.channel.send('👻boo👻')
    }
    else if (comm === 'peliculas') {
      const peliculas = ['casper', 'el extraño mundo de jack', 'halloweentown', 'monster house', 'los cazafantasmas', 'el joven manos de tijera', 'el viaje de chihiro', 'matilda', 'kiki entregas a domicilio', 'el cadaver de la novia', 'coraline', 'coco', 'spooky buddies', 'frankenweenie', 'hotel transylvania', 'pocoyo halloween', 'la patrulla fantasma', 'malefica']
      const randomNumber = Math.floor(Math.random() * peliculas.length)
      return message.channel.send('mmmmmmm mi recomendasion como profecional de las peliculas es k beas: ' + peliculas[randomNumber])
    }

})

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
  .on('empty', (channel, queue) => queue.textChannel.send('nome gusta estar solo adio'))
  .on('searchNoResult', (message, query) =>
    message.channel.send(`${client.emotes.error} | no encontré na \`${query}\`!`)
  )
  .on('finish', queue => queue.textChannel.send('seaca bo'))

client.login(process.env.TOKEN);
