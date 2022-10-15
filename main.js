require('http').createServer((req, res) => res.end('Hola')).listen();

const { Discord, Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

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

client.on('interactionCreate', (int) =>{
    if(!int.isCommand) return;
    
    const command = int.commandName;

    if(command === 'ping') {
        int.reply('Pong!');
    }
})

client.login('MTAzMDcwNzg5ODI1MjI3MTY1Nw.GrrRPD.zJcgEHjVqK_yXEggxeBV9FKf3J7NBZpGEJDT6w');
