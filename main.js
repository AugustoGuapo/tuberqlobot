require("dotenv").config();
const express = require('express');
const app = express();
const app2 = express();

//const { discord, Client, GatewayIntentBits } = require("discord.js");

/*const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]
});
*/

const { 
  Client, 
  GatewayIntentBits, 
  Partials 
} = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});
config = require("./config.json");
client.emotes = config.emoji;

client.once('clientReady', () => {
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

// Replace DisTube with custom music engine
const { play, skip, pause, resume, stop, setVolume, leave, getQueue } = require('./musicEngine.js');

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
/*
client.on('voiceStateUpdate', (oldState, newState) => {
  const memberId = oldState.member.id
  const queue = client.distube.getQueue(oldState.member.guild.id)
  var isQueued = false
  if(queue != null){
    for (let index = 0; index < queue.songs.length; index++) {
      const element = queue.songs[index];
      if(element.name === 'Mariah Carey - All I Want for Christmas Is You (Make My Wish Come True Edition)') isQueued = true;
  }
  }

  if(oldState.channel === null && !membersAlreadyPlayed.includes(memberId) && !isQueued) {
    client.distube.play(oldState.member.voice.channel, 'https://www.youtube.com/watch?v=aAkMkVFwAoo&ab_channel=MariahCareyVEVO', {
      member: oldState.member,
      textChannel: oldState.guild.channels.cache.find(channel => channel.name.toLowerCase() === 'general')

    })
    membersAlreadyPlayed.push(memberId)
  }
});
*/
client.on('messageCreate', async message => {
    if(message.author.bot || !message.guild) return;

    const prefix = config.prefix;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);

    if(!message.content.toLocaleLowerCase().startsWith(prefix)) return;
    //if(message.guild.id == "948433193265156126") return message.channel.send('ayura toi secuestrao debuelban las waifus a mi creador D:'); linea para bloquear el servidor de mey

    const comm = args.shift().toLowerCase();
    const isInChannel = message.member.voice.channel
    const musicCommands = ['jugar', 'pausa', 'detener', 'skip', 'volumen', 'adio', 'cola', 'limpiar']
    
    //COMANDOS DE MÚSICA
    if(musicCommands.includes(comm)){ //Verifica que el comando escrito sea de música
      if(isInChannel) { //Verifica que quien pidió el comando esté dentro de un canal de voz
        if(comm === 'jugar') {
          if(args.join(" ") === "") return message.channel.send('no soi tonto eso ta basio');
          if(args.includes("patricia") && args.includes("ramos")) return message.channel.send('k pedo con tus gustos saka d aki');
          if (false) {

          }
          
          else {
            const query = `${args.join(" ")}`;
            play(message, query);
          }
        }
    else if (comm === 'pausa') {
        pause(message);
    }
    else if (comm === 'detener') {
        stop(message);
    }else if(comm === 'skip' || comm === 'next') {
        skip(message);
    }
    else if(comm === 'volumen') {
        const volume = parseInt(args[0])
        if (isNaN(volume) || volume > 100 || volume < 0) return message.channel.send(`${client.emotes.error} | mete un numero k sirba tonto`)
        setVolume(message, volume);
    }

    else if(comm === 'adio') {
      leave(message);
    }
    else if(comm === 'cola') {
      getQueue(message);
    }
    else if(comm === 'limpiar') {
      const queue = getQueue(message.guild.id);
      queue.songs = [];
      queue.currentIndex = -1;
      queue.playing = false;
      if (queue.player) queue.player.stop();
      message.channel.send('Cola limpiada.');
    }
      }
      else return message.channel.send('entra en un canal primero tonto') //Envía un mensaje si se usó un comando de música pero el usuario no está en ningun canal
    }

    if(comm == 'teamo') {
      const randomNumber = Math.floor(Math.random() * 2)
      const outputMessage = randomNumber === 1 ? 'yo ati <3': 'grasias'
      return message.channel.send(outputMessage)
    }

    /* 
    COMANDOS PARA HALLOWEEN
     */
/*
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
*/

    /*
    COMANDOS PARA NAVIDAD
    */

    else if(comm === 'muerdago') {
      const memberId = message.member.id
      var outputMessage = memberId == '250464961418100737' || memberId == '514162096733159424' || memberId == '751711526989332511' || memberId == '754123879244365995' || memberId == '419574059450499072' ? 'muakata😘' : 'fuchila no t bso🤢'
      return message.channel.send(outputMessage)
    }

    else if(comm === 'cuento') {
      const historias = ['breach nabideño\nabia una bes un pendejo k consigio a brich i lo gugo tam mal k no lo bolbio a uzar, y azi tdxs pasaron una felis nabida',
      'bloops santa claus calva\nera se una bes una santa claus calva k le rega lo a un pato un cor tauñas fin']
      const randomNumber = Math.floor(Math.random() * historias.length)
      return message.channel.send('ai les ba una d mis istorias famosas\n' + historias[randomNumber])
    }

    else if (comm === 'gaitas') {
      const gaitas = ["Pa' que Luis - Gaiteros de pillopo",
      "La voy a tocar a pie - VHG", "Mi ranchito - Gran Coquivacoa",
      "Amparito - Maracaibo 15", "Gaita onomatopéyica - Gran Coquivacoa",
      "Son mis deseos - Cardenales del éxito", "Sin rencor - Gran Coquivacoa",
      "Viejo año - Maracaibo 15", "Venga un abrazo - Maracaibo 15", "Afina ese cuatro - Maracaibo 15",
      "El negrito fullero - Cardenales del éxito"]
      const randomNumber = Math.floor(Math.random() * gaitas.length)
      return message.channel.send("mmmmmmm mi rceomendasion como profecional de las gaitas es k eskuches : " + gaitas[randomNumber])
    }

    else if (comm === 'felis') {
      return message.channel.send('FELIS NABIDA ' + message.author.username.toUpperCase())
    }

    else if (comm === 'regalo') {
      return message.member.send('toma tu regalo')
    }
/*
    function esPlaylist(url) {
      const searchResults = resolvePlaylist(url)
      return searchResults 
    }
    async function resolvePlaylist(playlist, options = {}) {
      const { member, source, metadata } = { source: "youtube", ...options };
      if (typeof playlist === "string") {
        const info = await import_ytpl(playlist, { limit: Infinity });
        const songs = info.items.filter((v) => !v.thumbnail.includes("no_thumbnail")).map((v) => new Distube.Song(v, { member, metadata }));
        return new Distube.Playlist(
          {
            source,
            songs,
            member,
            name: info.title,
            url: info.url,
            thumbnail: songs[0].thumbnail
          },
          { metadata }
        );
      }
      //return new Distube.Playlist(playlist, { member, properties: { source }, metadata });
    }

*/
})

client.login(process.env.TOKEN);

app.get('/', (req, res) => {
  res.status(200).send('');
});

app.listen(8080, () => {
  console.log('Servidor escuchando en el puerto 8080');
});

app2.get('/', (req, res) => {
  res.status(200).send('');
});

app2.listen(443, () => {
  console.log('Servidor escuchando en el puerto 443')
});