import { Telegraf } from 'telegraf';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

// Initialize the bot with the bot token
const bot = new Telegraf('7841485136:AAGLEfhniQQTmZDhGhz1gxhhVrxuX3oA5Po'); // Replace with your bot's API key
const ADMIN_ID = '6650430482'; // Replace with the Admin ID as a string

let userData = {};
let savedMessage = '';
let isAdminAddingTicket = false;
let isUserGettingTicket = false;
let isUserAddingText = false;

// Get the directory path
const __dirname = path.resolve();

// Ensure ticket directory exists
const ticketDir = path.join(__dirname, 'tickets');
if (!fs.existsSync(ticketDir)) {
  fs.mkdirSync(ticketDir, { recursive: true });
}

// Start command
bot.start((ctx) => {
  const userId = ctx.from.id.toString();

  if (userId === ADMIN_ID) {
    ctx.reply('Welcome Admin! You can manage tickets.', {
      reply_markup: {
        keyboard: [
          ['Add ticket', 'View all tickets'],
          ['Get a ticket', 'Available slot'],
          ['The lucky ones', 'About Owner'],
          ['See your ticket', 'Comment'],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  } else {
    ctx.reply('Welcome to UPix LOTTERY. Please get a ticket:', {
      reply_markup: {
        keyboard: [
          ['Get a ticket', 'Available slot'],
          ['The lucky ones', 'About Owner'],
          ['See your ticket', 'Comment'],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }
});

// Handle menu options
bot.hears('View all tickets', (ctx) => ctx.reply(savedMessage));
bot.hears('Available slot', (ctx) => ctx.reply(savedMessage));
bot.hears('The lucky ones', (ctx) => ctx.reply('You chose The lucky ones'));
bot.hears('About Owner', (ctx) => ctx.reply('You chose About Owner'));
bot.hears('See your ticket', (ctx) => ctx.reply('You chose See your ticket'));
bot.hears('Comment', (ctx) => ctx.reply(savedMessage || 'No message has been saved yet.'));

// Admin adding a ticket
bot.hears('Add ticket', (ctx) => {
  if (ctx.from.id.toString() === ADMIN_ID) {
    ctx.reply('Please send the ticket message you want to add.');
    isAdminAddingTicket = true;
  }
});

// User getting a ticket
bot.hears('Get a ticket', (ctx) => {
  if (!savedMessage) {
    ctx.reply('Ooops! No available slot right now. Try again later.');
    return;
  }
  ctx.reply('Please send me your name');
  isUserGettingTicket = true;
});

// Handle text input
bot.on('text', (ctx) => {
  const userId = ctx.from.id.toString();
  const messageText = ctx.message.text;

  if (isAdminAddingTicket && userId === ADMIN_ID) {
    savedMessage = messageText;
    ctx.reply('Ticket message saved!');
    isAdminAddingTicket = false;
    return;
  }

  if (isUserGettingTicket) {
    if (!userData[userId]) {
      userData[userId] = { name: messageText };
      ctx.reply('Got your name! Now, please send me your ID.');
      return;
    }

    if (!userData[userId].id) {
      userData[userId].id = messageText;
      ctx.reply(`Your name is ${userData[userId].name} and your ID is ${userData[userId].id}`);
      ctx.reply(savedMessage);
      isUserGettingTicket = false;

      ctx.reply('Please choose your lucky number');
      isUserAddingText = true;
      return;
    }
  }

  if (isUserAddingText) {
    userData[userId].additionalText = messageText;

    ctx.reply(
      `Your name is ${userData[userId].name}, your ID number is ${userData[userId].id}, and your ticket number is: ${userData[userId].additionalText}`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: 'Get the ticket', callback_data: 'Get_the_ticket' }]],
        },
      }
    );

    isUserAddingText = false;
    return;
  }
});

// Generate Ticket Image with Background
async function generateTicketImage(user) {
  const canvas = createCanvas(600, 400);
  const ctx = canvas.getContext('2d');

  try {
    // Load background image
    const backgroundPath = path.join(__dirname, 'background.png'); // Ensure 'background.png' exists
    const background = await loadImage(backgroundPath);
    ctx.drawImage(background, 0, 0, 600, 400);

    // Add UPix Lottery text at the top
    ctx.fillStyle = 'blue';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('UPix LOTTERY', 300, 50);

    // Add user details
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Name: ${user.name}`, 20, 150);
    ctx.fillText(`ID: ${user.id}`, 20, 180);
    ctx.fillText(`Lucky Number: ${user.additionalText}`, 20, 210);

    // Load and add logo
    const logoPath = path.join(__dirname, 'logo.png'); // Ensure 'logo.png' exists
    const logo = await loadImage(logoPath);
    ctx.drawImage(logo, 450, 50, 100, 100); // Position logo in the top-right corner

    // Save ticket image
    const imageFilePath = path.join(ticketDir, `${user.id}_ticket.png`);
    const imageBuffer = canvas.toBuffer('image/png');
    await fs.promises.writeFile(imageFilePath, imageBuffer);

    return imageFilePath;
  } catch (error) {
    console.error('Error generating ticket image:', error);
    return null;
  }
}

// Handle inline button press for generating ticket
bot.on('callback_query', async (ctx) => {
  try {
    const userId = ctx.from.id.toString();

    if (ctx.callbackQuery.data === 'Get_the_ticket') {
      if (!userData[userId]) {
        ctx.reply('Error: User data not found.');
        return;
      }

      const imageFilePath = await generateTicketImage(userData[userId]);
      if (imageFilePath) {
        ctx.replyWithPhoto({ source: imageFilePath });
      } else {
        ctx.reply('An error occurred while generating the ticket.');
      }
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    ctx.reply('An error occurred while generating the ticket.');
  }
});

// Reset webhook and start bot
bot.telegram.deleteWebhook().then(() => {
  console.log('Webhook removed, bot can now use polling');
  bot.launch().then(() => console.log('Bot started using polling!'));
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
