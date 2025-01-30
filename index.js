import { Telegraf } from 'telegraf';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

// Initialize the bot with the bot token
const bot = new Telegraf('7841485136:AAGLEfhniQQTmZDhGhz1gxhhVrxuX3oA5Po'); // Replace with your bot's API key
const ADMIN_ID = '6650430482'; // Replace with your Admin ID
let userIds = [];
let userData = {};
let savedMessage = '';
let isAdminAddingTicket = false; // Flag to track when admin is adding a ticket
let isUserSendingForVerification = false; // Flag to track when user sends a photo for verification
let isUserGettingTicket = false;
let isUserAddingText = false;
let verified = true;
let isUserInCommentState = false; // Flag to track if the user is in 'Comment' state

// Correctly get the directory path
const __dirname = path.resolve();  // This will get the current working directory

// Ensure directory exists
const ticketDir = path.join(__dirname, 'tickets');
if (!fs.existsSync(ticketDir)) {
  fs.mkdirSync(ticketDir, { recursive: true }); // Create the directory if it doesn't exist
}

// Start command
bot.start((ctx) => {
  const userId = ctx.from.id.toString();
  
  // Track users who interact with the bot
  if (!userIds.includes(userId)) {
    userIds.push(userId);
  }

  if (userId === ADMIN_ID) {
    ctx.reply('Welcome Admin! You can manage tickets.', {
      reply_markup: {
        keyboard: [
          ['Add ticket', ' Broadcast'],
          ['Get a ticket', 'Available slot'],
          ['Luckiests on previews round', 'About Owner & Comment'],
          ['Add the luckiest history']
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
          ['Luckiests on previews round', 'About Owner & Comment'],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }
});

// Handle 'Broadcast' command
bot.hears('Broadcast', (ctx) => {
  const userId = ctx.from.id.toString();

  // Check if the user is the admin
  if (userId !== ADMIN_ID) {
    ctx.reply("Only the admin can broadcast messages.");
    return;
  }

  // Ask the admin to send the message to broadcast
  ctx.reply('Please send the message you want to broadcast to all users.');

  // Listen for the next text message (which should be the broadcast message)
  bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;

    // Check if there are any users to send the message to
    if (userIds.length === 0) {
      ctx.reply("No users have interacted with the bot yet.");
      return;
    }

    // Send the broadcast message to all users
    for (const id of userIds) {
      try {
        await bot.telegram.sendMessage(id, messageText);
      } catch (error) {
        console.error(`Failed to send message to user ${id}:, error`);
      }
    }

    ctx.reply('Message sent to all users!');
  });
});

// Handle other commands (just example functionality)
bot.hears('Available slot', (ctx) => ctx.reply(savedMessage || 'No added available tickets yet.'));
bot.hears('Luckiests on previews round', (ctx) => ctx.reply('You chose Luckiests on previews round'));
bot.hears('Add the luckiest history', (ctx) => ctx.reply('You chose Add the luckiest history'));

bot.hears('About Owner & Comment', async (ctx) => {
  const userId = ctx.from.id.toString();
  await ctx.telegram.sendPhoto(userId, { source: './owner image.jpg' }, {
    caption: 'Tekalign Dabena – Founder of UPix Lottery | Electromechanical Engineering Student',
  });
  await ctx.reply(`Hello, I’m Tekalign Dabena, a second-year Electromechanical Engineering student at Addis Ababa Science and Technology University, and the proud founder of UPix Lottery.

At UPix Lottery, I blend my passion for engineering with my entrepreneurial spirit to create an innovative and trustworthy lottery platform. 
I take full responsibility for everything that happens within the company, ensuring a seamless and exciting experience for our users.

Who I Am:
Name: Tekalign Dabena

University: Addis Ababa Science and Technology University
Course: Electromechanical Engineering (Second Year)
Role: Founder & CEO, UPix Lottery
As an Electromechanical Engineering student, I thrive on solving real-world problems. My journey with UPix Lottery allows me to apply my technical skills in creating a user-friendly, secure, and transparent lottery experience.

UPix Lottery:
UPix Lottery is redefining the lottery experience with cutting-edge technology. 
As the founder, I am hands-on in all aspects of the business, from software development to customer engagement. My goal is to ensure fairness, transparency, and excitement for every participant.

Let’s Connect:
Email: brighttraining63@gmail.com
LinkedIn: https://www.linkedin.com/in/tekalign-dabena-2bb784324?utm_source=share&utm_`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Comment', callback_data: 'submit_comment' }]
      ]
    }
  });
});

// Admin adding a ticket
bot.hears('Add ticket', (ctx) => {
  if (ctx.from.id.toString() === ADMIN_ID) {
    ctx.reply('Please send the ticket message you want to add.');
    isAdminAddingTicket = true; // Set flag when admin is adding a ticket
  }
});

// User getting a ticket
bot.hears('Get a ticket', (ctx) => {
  if (!savedMessage) {
    ctx.reply('Ooops! No available slot right now. Try again later.');
    return;
  }
  ctx.reply('Please send me your first name');
  isUserGettingTicket = true;
});

// Handle text input for various tasks
bot.on('text', async (ctx) => {
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
      ctx.reply('Got your name! Now, please send me your ID. eg. ETS 0001/15');
      return;
    }

    if (!userData[userId].id) {
      userData[userId].id = messageText;
      ctx.reply(`Your name is ${userData[userId].name} and your ID is ${userData[userId].id}`);
      ctx.reply(savedMessage);
      isUserGettingTicket = false;
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

 // Handle user comment input
if (isUserInCommentState) {
  const userId = ctx.from.id;
  const messageText = ctx.message.text;
  console.log(userId);
  
  // Check if user data exists before forwarding comment
  if (!userData[userId]) {
    console.error(`User data not found for user ${userId}`);
    
    // Notify the user if their data is not complete
    await ctx.reply('Sorry, your user data is missing or incomplete. Please complete the ticket process first.');
    
    // Reset the comment state flag
    isUserInCommentState = false;
    return;
  }

  try {
    // Forward the message to the admin
    await bot.telegram.sendMessage(
      ADMIN_ID,
      `New comment from user ${userData[userId].name} ${userData[userId].id} (${userId}):\n\n${messageText}`
    );

    // Inform the user that their message has been sent to the admin
    await ctx.reply('Your comment has been sent to the admin. Please wait for a response.');

    // Reset the comment state flag
    isUserInCommentState = false;
  } catch (error) {
    console.error('Error forwarding message:', error);
    await ctx.reply('Sorry, there was an error sending your comment to the admin.');
  }
}

});

// Generate ticket image using a photo background
async function generateTicketImage(user, userId) {
  const canvas = createCanvas(900, 1500);
  const ctx = canvas.getContext('2d');

  const backgroundImage = await loadImage(path.join(__dirname, 'background.png'));
  ctx.drawImage(backgroundImage, 0, 0, 900, 1500);

  ctx.fillStyle = 'black';
  ctx.font = '45px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(user.name, 345, 985);

  ctx.fillStyle = 'black';
  ctx.font = '45px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(user.id, 345, 1040);

  ctx.fillStyle = 'green';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(user.additionalText, 450, 1140);

  ctx.fillStyle = 'red';
  ctx.font = 'bold 25px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('\u274C not verified', 500, 1270);

  const imageBuffer = canvas.toBuffer('image/png');
  const imageFilePath = path.join(ticketDir, 'ticket.png');

  await fs.promises.writeFile(imageFilePath, imageBuffer);

  return imageFilePath;
}

// Handle inline button press
bot.on('callback_query', async (ctx) => {
  try {
    const userId = ctx.from.id.toString();

    if (ctx.callbackQuery.data === 'Get_the_ticket') {
      if (!userData[userId]) {
        ctx.reply('Error: User data not found. Please try again.');
        return;
      }

      const imageFilePath = await generateTicketImage(userData[userId], userId);
      const imageBuffer = await fs.promises.readFile(imageFilePath);

      await ctx.telegram.sendPhoto(ctx.chat.id, { source: imageBuffer }, {
        caption: 'Your ticket is not verified.\nTo verify, please send ticket money to Telebirr account 0984403840.\nThen come back and send me screenshot.\nGOOD LUCK',
      });
    }

    if (ctx.callbackQuery.data === 'Verify') {
      const adminId = ctx.from.id.toString();
      verified = false;

      if (adminId !== ADMIN_ID) {
        ctx.reply('You are not authorized to verify tickets.');
        return;
      }

      const targetUserId = ctx.callbackQuery.from.id.toString();

      if (!userData[targetUserId]) {
        ctx.reply('Error: User data not found for verification.');
        return;
      }

      userData[targetUserId].verified = true; // Set verified flag

      const imageFilePath = await generateVerifiedTicketImage(userData[targetUserId], targetUserId);
      const imageBuffer = await fs.promises.readFile(imageFilePath);

      await ctx.telegram.sendPhoto(targetUserId, { source: imageBuffer }, {
        caption: `User's ticket has been verified. Name is ${userData[userId].name}, ID number is ${userData[userId].id}, and ticket number is: ${userData[userId].additionalText}`,
      });
    }

    if (ctx.callbackQuery.data === 'Get_Verified_ticket') {
      const userId = ctx.from.id.toString();

      if (!userData[userId]) {
        ctx.reply('Error: User data not found for verification.');
        return;
      }

      const user = userData[userId];
      if (verified === true) {
        ctx.reply('Sorry, your ticket is on the way. Please come back and check later.');
        return;
      }

      const imageFilePath = await generateVerifiedTicketImage(user, userId);
      const imageBuffer = await fs.promises.readFile(imageFilePath);

      await ctx.telegram.sendPhoto(userId, { source: imageBuffer }, {
        caption: 'Your ticket is now verified! Please do not lose your ticket.\nThank you for your participation!\nGOOD LUCK',
      });
    }

    if (ctx.callbackQuery.data === 'submit_comment') {
      await ctx.reply('Please type your comment, and I will forward it to the admin.');
      isUserInCommentState = true;
    }

    // Acknowledge the callback query
    await ctx.answerCbQuery();
  } catch (error) {
    console.error('Error handling callback:', error);
    ctx.reply('An error occurred while processing your request.');
  }
});

// Function to generate the verified ticket image
async function generateVerifiedTicketImage(user, userId) {
  const canvas = createCanvas(900, 1500);
  const ctx = canvas.getContext('2d');

  const backgroundImage = await loadImage(path.join(__dirname, 'background.png'));
  ctx.drawImage(backgroundImage, 0, 0, 900, 1500);

  ctx.fillStyle = 'black';
  ctx.font = '45px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(user.name, 345, 985);

  ctx.fillStyle = 'black';
  ctx.font = '45px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(user.id, 345, 1040);

  ctx.fillStyle = 'green';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(user.additionalText, 450, 1140);

  ctx.fillStyle = 'green';
  ctx.font = 'bold 25px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('✅ Verified', 500, 1270);

  const imageBuffer = canvas.toBuffer('image/png');
  const imageFilePath = path.join(ticketDir, `${userId}_ticket_verified.png`);

  await fs.promises.writeFile(imageFilePath, imageBuffer);

  return imageFilePath;
}



// Admin adding a ticket
bot.hears('Add ticket', (ctx) => {
  if (ctx.from.id.toString() === ADMIN_ID) {
    ctx.reply('Please send the ticket message you want to add.');
    isAdminAddingTicket = true; // Set flag when admin is adding a ticket
  }
});

// Handle photo input
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  // Check if the message is from the admin or a user
  if (ctx.from.id.toString() === ADMIN_ID) {
    // If the admin is adding a ticket or doing something else, don't treat it as a verification photo
    if (isAdminAddingTicket) {
      ctx.reply("Admin, you've sent a photo while adding a ticket. Please send the ticket message instead.");
      isAdminAddingTicket = false; // Reset the flag after handling the admin photo
      return;
    }
    // Admin's photo should not be sent for verification
    ctx.reply("Admins shouldn't send photos for verification. Please use proper admin functions.");
    return;
  }

  // If the user is sending a photo for verification, proceed with the verification process
  if (userData[userId]) {
    try {
      const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Get the largest photo size
      const fileId = photo.file_id;

      // Forward the user's photo to the admin for verification
      await ctx.telegram.sendPhoto(ADMIN_ID, fileId, {
        caption: `User has sent this photo. Name: ${userData[userId].name}, ID: ${userData[userId].id}, Ticket: ${userData[userId].additionalText}`,
        reply_markup: {
          inline_keyboard: [[{ text: 'Verify', callback_data: 'Verify' }]],
        },
      });

      ctx.reply('Photo received and forwarded to the admin for verification. Please wait for a response.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Get Verified ticket', callback_data: 'Get_Verified_ticket' }]],
        },
      });
    } catch (error) {
      console.error('Error forwarding photo to admin:', error);
      ctx.reply('There was an issue sending your photo to the admin.');
    }
  } else {
    // If user data is not complete (e.g., they haven't registered yet), inform the user
    ctx.reply("You must complete your ticket registration before sending a photo for verification.");
  }
});


// Start the bot
bot.launch().catch(err => console.error('Error launching bot:', err));
