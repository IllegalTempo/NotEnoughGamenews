const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const apiKey = process.env.API_KEY;

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });
const fs = require('fs');
const puppeteer = require('puppeteer');
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    RequestIGN()

});

client.on('messageCreate', message => {
    if (message.content === '!hello') 
    {
    }
});


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


    const games = await page.evaluate(() => {
        return Array.from(
            document.querySelectorAll("#main-content > div > div.card-grid-wrapper > div > figure > a")
        ).slice(0,100).map((game) => {
            const itm = game.querySelector('div.jsx-529896550.object-thumbnail > div > img');
            const dateitm = game.querySelector("div.stack.jsx-3647836811.jsx-1675204771.title-bar > div > div");
            return {
                name: itm.getAttribute('alt'),
                image: itm.getAttribute('src'),
                date: dateitm.innerText,
            }
            
        });
        
    });
      console.log(games);
    await browser.close();



}
client.login(apiKey);