import 'dotenv/config';
import { Client, GatewayIntentBits, Events, REST, ButtonBuilder, ActionRowBuilder, PermissionFlagsBits} from 'discord.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
const client = new Client({intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent]});
function GetJsonSave()
{
    return JSON.parse(fs.readFileSync('PreviousData.json'));
}
function SaveJsonSave(data)
{
    fs.writeFileSync('PreviousData.json', JSON.stringify(data));
}
var GamesData = GetJsonSave().AllGames;
var DeltaGamesData;

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    InitializeCommands();
    RequestIGN();
});

setInterval(RequestIGN, 1000 * 60 * 60); // Check every 24 hours

async function InitializeCommands() {
    await client.application.commands.create({
        name: 'test',
        description: 'Test V3!'
      });
      await client.application.commands.create({
        name: 'subscribe',
        description: 'Admin Only Command - Subscribe this channel to Game News',
      });
    console.log("Commands Initialized!");
}
client.on('interactionCreate', async (message) => {
    if(!message.isCommand()) return;
    switch(message.commandName) {
        case 'subscribe':
            if(message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                message.reply("This channel has been subscribed to Game News!");
                console.log(`Channel ${message.channel.id} has been subscribed to Game News!`);
                var channels = GetJsonSave();
                channels.SubscribedChannels.push(message.channel.id);
                SaveJsonSave(channels);
            } else {
                message.reply("You do not have permission to use this command!");
            }
            break;
        case 'test':    
            TestIGN(message);
            break;
        default:
            break;
    }
});
function ReplyGameNews(message) {
    SendGameNewsToChannel(message.channel);
}
function SendGameNewsAll()
{
    console.log("Updating Game News to all channels...");
    const channels = GetJsonSave().SubscribedChannels;
    channels.forEach((channel) => {
        const channelObj = client.channels.cache.get(channel);
        if(channelObj) {
            SendGameNewsToChannel(channelObj);
        } else {
            console.log(`Channel ${channel} not found!`);
        }
    });
}
function SendGameNewsToChannel(channel)
{
    SendGameNews(DeltaGamesData, channel);
}
function SendGameNews(games,channel)
{
    console.log(`Sending Game News to ${channel.id}`);
    channel.send("**New Games Announced!**")
    games.forEach((game) => {
        let msg = `**${game.name}** \n Release Date: ${game.date}`;
        console.log(`link: ${game.link}`);
        const button = new ButtonBuilder()
            .setLabel('View More')
            .setStyle('Link')
            .setURL(game.link);
        channel.send({
            content : msg,
            files: [game.image],
            components: [new ActionRowBuilder().addComponents(button)],
        });

    });
}
var newhash;
var previoushash;

async function ComposePage(page,previoushash)
{
    return await page.evaluate((previoushash) => {
        newhash = document.querySelector("html").getAttribute("data-build-id")
        if(newhash !== previoushash) {
            console.log("Detected Changes!");

            return Array.from(
                document.querySelectorAll("#main-content > div > div.card-grid-wrapper > div > figure > a")
            ).map((game) => {
                const itm = game.querySelector('div.jsx-529896550.object-thumbnail > div > img');
                const dateitm = game.querySelector("div.stack.jsx-3647836811.jsx-1675204771.title-bar > div > div");
                let gamename = itm.getAttribute('alt');
                let gamelink = `https://www.ign.com${game.getAttribute('href')}`;
                return {
                    name: gamename,
                    image: itm.getAttribute('src'),
                    link: gamelink,
                    date: dateitm.innerText,
                }
                
            });
        } else {
            return 0;
        }
    },previoushash);
    
}
async function RequestIGN()
{
    console.log("Requesting IGN...")
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.ign.com/upcoming/games', {
        waitUntil: 'networkidle2',
      });
    
      // 2. Wait for the privacy/cookie banner’s "Reject" button to appear
      //    (you must replace the selector below with the actual one on the IGN banner)
      const btn1 = '#onetrust-pc-btn-handler';
      await page.waitForSelector(btn1, { timeout: 5000 });
      await page.click(btn1);
      console.log("Clicked More Options Button");
      const btn2 = 'button.ot-pc-refuse-all-handler';
      await page.waitForSelector(btn2, { timeout: 5000 });
      await page.click(btn2);
      console.log("Clicked Reject Button");

      
      previoushash = GetJsonSave().LastUpdateID;

    const games = await ComposePage(page,previoushash)
    newhash = await page.evaluate((previoushash) => {
        return document.querySelector("html").getAttribute("data-build-id").toString()
    });
    var save = GetJsonSave();
    await browser.close();
    console.log("Completed Request");
    if(games !== 0)
    {
        DeltaGamesData = games.filter(item => !GamesData.includes(item.name));
        SendGameNewsAll();

        GamesData = games;
        save.AllGames = GamesData.map(game => game.name)

    }

    save.LastUpdateID = newhash;

    SaveJsonSave(save);

}
async function TestIGN(message)
{
    console.log("Requesting IGN...")
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.ign.com/upcoming/games', {
        waitUntil: 'networkidle2',
      });
    
      // 2. Wait for the privacy/cookie banner’s "Reject" button to appear
      //    (you must replace the selector below with the actual one on the IGN banner)
      const btn1 = '#onetrust-pc-btn-handler';
      await page.waitForSelector(btn1, { timeout: 5000 });
      await page.click(btn1);
      console.log("Clicked More Options Button");
      const btn2 = 'button.ot-pc-refuse-all-handler';
      await page.waitForSelector(btn2, { timeout: 5000 });
      await page.click(btn2);
      console.log("Clicked Reject Button");

      previoushash = fs.readFileSync('hash.txt', 'utf8');

    const games = await ComposePage(page,previoushash)
    await browser.close();
    console.log("Completed Request");
    SendGameNews(games,message.channel);

}
client.login(process.env.API_KEY);