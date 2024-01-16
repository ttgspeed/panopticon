require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const _ = require('lodash');

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a)=>{
        return GatewayIntentBits[a]
    }),
});

const token = process.env.BOT_TOKEN;

const monitoredChannels = ['1122706227240116294', '1019440695775342684', '1048123185352159242'];
const logChannelId = '954560567132164106';
let limitBypass = false;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    console.log(message.content);
    if(message.channel.id == logChannelId){
        if(message.content == '.bypass'){
            (async () => {
                console.log(`<@${message.author.id}> enabled limit bypass for 5 minutes.`);
                const logChannel = await client.channels.cache.get(logChannelId);
                logChannel.send({content: `<@${message.author.id}> enabled limit bypass for 5 minutes.`});

                limitBypass = true;
                setTimeout(() => {
                    limitBypass = false;
                }, 5*60*1000);
            })();
        }
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    // Validate new channel state is valid (ie: not a disconnect)
    if (newState.channel && newState.channel.id) {
        const channel = newState.channel;

        // Check if the channel has more than {channel.userLimit} members
        if (_.includes(monitoredChannels, channel.id) && channel.members.size > channel.userLimit) {
            if(limitBypass){
                (async () => {
                    console.log(`<@${newState.member.user.tag}> joined <#${channel.id}> while limit bypass was active.`);
                    const logChannel = await client.channels.cache.get(logChannelId);
                    logChannel.send({content: `<@${newState.member.user.id}> joined <#${channel.id}> while limit bypass was active.`});
                })()
            } else {
                //setChannel(null) = disconnect
                newState.member.voice.setChannel(null)
                .then(async () => {
                    console.log(`Disconnected ${newState.member.user.tag} from ${channel.name} due to member limit`);
                    const logChannel = await client.channels.cache.get(logChannelId);
                    logChannel.send({content: `Disconnected <@${newState.member.user.id}> from <#${channel.id}> due to member limit. If you *NEED* to access the channel, type \`.bypass\`.`});
                })
                .catch(console.error);
            }
        }
    }
});

client.login(token);
