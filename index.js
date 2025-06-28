const express = require("express");
const puppeteer = require("puppeteer");
require("dotenv").config();

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/monetize (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];
  try {
    const monetized = await monetizeLinkvertise(url);
    bot.sendMessage(chatId, monetized);
  } catch (e) {
    bot.sendMessage(chatId, "❌ Failed to monetize: " + e.message);
  }
});

bot.onText(/\/bypass (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];
  try {
    const bypassed = await bypassLink(url);
    bot.sendMessage(chatId, bypassed);
  } catch (e) {
    bot.sendMessage(chatId, "❌ Failed to bypass: " + e.message);
  }
});

async function monetizeLinkvertise(originalUrl) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto("https://publisher.linkvertise.com/login", { waitUntil: "networkidle2" });

  await page.type('input[type="email"]', USERNAME);
  await page.type('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  await page.goto("https://publisher.linkvertise.com/links", { waitUntil: "networkidle2" });
  await page.click("button:has-text('Create Link')");
  await page.waitForSelector("input[name='url']");
  await page.type("input[name='url']", originalUrl);
  await page.click("button:has-text('Submit')");
  await page.waitForSelector(".link-success");

  const link = await page.$eval(".link-success", el => el.textContent);
  await browser.close();
  return link;
}

async function bypassLink(url) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto("https://bypass.city/bypass?bypass=" + encodeURIComponent(url));
  await page.waitForSelector("#output", { timeout: 15000 });
  const result = await page.$eval("#output", el => el.textContent);
  await browser.close();
  return result;
}

app.listen(3000, () => {
  console.log("Server started on port 3000");
});