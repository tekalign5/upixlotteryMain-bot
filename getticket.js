import { Telegraf } from 'telegraf';
import fs from 'fs';

// Initialize the bot with the bot token
const bot = new Telegraf('YOUR_BOT_TOKEN');  // Replace with your bot's token
const ADMIN_ID = 'YOUR_ADMIN_ID';  // Replace with the admin's ID

let userIds = [];  // List to store user IDs who have interacted with the bot
let isAdminBroadcasting = false; // Flag to check if admin is in broadcast mode

// Start command
bot.start((ctx) => {
  const userId = ctx.from.id.toString();
  
  // Track users who interact with the bot
  if (!userIds.includes(userId)) {
    userIds.push(userId);
  }

  // Show admin-specific buttons if the user is the admin
  if (userId === ADMIN_ID) {
    ctx.reply('Welcome Admin! You can broadcast messages to all users.', {
      reply_markup: {
        keyboard: [
          ['Broadcast Message'],  // Admin button for broadcasting
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  } else {
    ctx.reply('Welcome! Interact with the bot to get started.');
  }
});

// Admin broadcasting message
bot.hears('Broadcast Message', (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) {
    return ctx.reply("Only the admin can broadcast messages.");
  }
  
  ctx.reply('Please send the message you want to broadcast. You can send text, media, or a combination of both.');
  isAdminBroadcasting = true;  // Set the flag to indicate the admin is broadcasting
});

// Handle admin's message (text or media)
bot.on('text', async (ctx) => {
  const userId = ctx.from.id.toString();

  if (isAdminBroadcasting && userId === ADMIN_ID) {
    const messageText = ctx.message.text;

    // Broadcast the text message to all users
    if (userIds.length > 0) {
      for (const id of userIds) {
        try {
          await bot.telegram.sendMessage(id, messageText);
        } catch (error) {
          console.error(`Failed to send message to user ${id}:`, error);
        }
      }
      ctx.reply('Your text message has been broadcasted to all users!');
    } else {
      ctx.reply('No users to broadcast the message to.');
    }

    isAdminBroadcasting = false;  // Reset the flag
  }
});

// Handle media (image, video, etc.) from the admin
bot.on(['photo', 'video', 'audio'], async (ctx) => {
  const userId = ctx.from.id.toString();

  if (isAdminBroadcasting && userId === ADMIN_ID) {
    const message = ctx.message;
    
    // Send media to all users
    if (message.photo) {
      const fileId = message.photo[message.photo.length - 1].file_id;
      for (const id of userIds) {
        try {
          await bot.telegram.sendPhoto(id, fileId, { caption: 'Broadcasted image' });
        } catch (error) {
          console.error(`Failed to send image to user ${id}:`, error);
        }
      }
    }

    if (message.video) {
      const fileId = message.video.file_id;
      for (const id of userIds) {
        try {
          await bot.telegram.sendVideo(id, fileId, { caption: 'Broadcasted video' });
        } catch (error) {
          console.error(`Failed to send video to user ${id}:`, error);
        }
      }
    }

    if (message.audio) {
      const fileId = message.audio.file_id;
      for (const id of userIds) {
        try {
          await bot.telegram.sendAudio(id, fileId, { caption: 'Broadcasted audio' });
        } catch (error) {
          console.error(`Failed to send audio to user ${id}:`, error);
        }
      }
    }

    ctx.reply('Your media has been broadcasted to all users!');
    isAdminBroadcasting = false;  // Reset the flag
  }
});

// Admin can also broadcast mixed content (text + media)
bot.on('text', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  if (isAdminBroadcasting && userId === ADMIN_ID) {
    const messageText = ctx.message.text;

    // If the admin has sent both text and media, combine the broadcast
    if (messageText) {
      if (userIds.length > 0) {
        for (const id of userIds) {
          try {
            await bot.telegram.sendMessage(id, messageText);
          } catch (error) {
            console.error(`Failed to send text message to user ${id}:`, error);
          }
        }
      }
      ctx.reply('Your message has been broadcasted!');
    }
  }
});

// Start the bot
bot.launch().catch(err => console.error('Error launching bot:', err));
