import { Telegraf } from 'telegraf';
//import { Composer } from 'micro-bot';

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

// Initialize the bot with the bot token
const bot = new Telegraf('7586226201:AAFqPzVQjVvQY3f4s-RPWINhYvb1yRt_vI4'); // Replace with your bot's API key
//const bot = new Composer()

const ADMIN_ID = '6650430482'; // Replace with your Admin ID
let userIds = [];
let userData = {};
let savedMessage = '';
// Define a variable to store the "luckiest history" message
let luckiestHistoryMessage = '';
let isAdminAddingTicket = false; // Flag to track when admin is adding a ticket
let isAddForwarded = false;
let isUserSendingForVerification = false; // Flag to track when user sends a photo for verification
let isUserGettingTicket = false;
let isUserAddingText = false;
let verified = true;
let isUserInCommentState = false; // Flag to track if the user is in 'Comment' state
let isAdminBroadcasting = false; // Flag to check if admin is in broadcast mode


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
  };

  if (userId === ADMIN_ID) {
    ctx.reply('Welcome Admin! You can manage tickets.', {
      reply_markup: {
        keyboard: [
          ['Add ticket', ' Broadcast'],
          ['Get a ticket🎫', 'Available tickets'],
          ['Luckiests on previews round💰', 'About Owner & Comment'],
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
          ['Get a ticket🎫'],
          ['Available tickets'],
          ['Luckiests on previews round💰'], 
          ['About Owner & Comment'],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }
});

// Handle 'Broadcast' command
bot.hears('Broadcast', (ctx) => {
  ctx.reply('Please send the message you want to broadcast. You can send text, media, or a combination of both.');
  isAdminBroadcasting = true;  // Set the flag to indicate the admin is broadcasting
});


// Handle other commands (just example functionality)
bot.hears('Available tickets', (ctx) => ctx.reply(savedMessage || 'No added available tickets yet.'));


bot.hears('Luckiests on previews round💰', (ctx) => {
  // Send the saved "luckiest history" message to the user or admin
  if (luckiestHistoryMessage) {
    ctx.reply(`The luckiest history is: \n${luckiestHistoryMessage}`);
  } else {
    ctx.reply('No luckiest history message has been added yet.');
  }
});
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
    ctx.reply('Please send the ticket numbers you want to list. Note that it must be only text');
    isAdminAddingTicket = true; // Set flag when admin is adding a ticket
    isAddForwarded =false;
  }
});

// User getting a ticket
bot.hears('Get a ticket🎫', (ctx) => {
  if (!savedMessage) {
    ctx.reply('Ooops! No Available tickets right now. Try again later.');
    return;
  }
  ctx.reply('Hey there! 👋 Can you share your first name with me?');
  isUserGettingTicket = true;
  
});

// Handle the 'Add the luckiest history' button click
bot.hears('Add the luckiest history', (ctx) => {
  if (ctx.from.id.toString() === ADMIN_ID) {
    ctx.reply('Please forward the luckiest history message to this bot.');
    isAdminAddingTicket = false;  // Reset the ticket addition flag
    isAddForwarded = true;   // Flag for adding the history message
  }
});

// Handle text input for various tasks
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


  if (isAddForwarded && ctx.from.id.toString() === ADMIN_ID) {
    // Save the forwarded message as the luckiest history message
    luckiestHistoryMessage = ctx.message.text || 'No message content available';
    ctx.reply('The luckiest history message has been saved!');
    isAddForwarded = false; // Reset the flag after saving the message
  }


  if (isAdminAddingTicket && userId === ADMIN_ID) {
    const messageText = ctx.message.text;
    savedMessage = messageText;
    ctx.reply('Ticket number list saved!');
    isAdminAddingTicket = false;
    return;
  }

  if (isUserGettingTicket) {
  
    if (!userData[userId]) {
      const messageText = ctx.message.text;
      userData[userId] = { name: messageText };
      ctx.reply('😎Got your name! Now, please send me your phone. eg.0901010100');
      return;
    }

    if (!userData[userId].id) {
      const messageText = ctx.message.text;
      userData[userId].id = messageText;
      ctx.reply(`Your name is ${userData[userId].name} and your phone is ${userData[userId].id}`);
      ctx.reply(savedMessage);
      isUserGettingTicket = false;
      isUserAddingText = true;
      return;
    }
  }

  if (isUserAddingText) {
    const messageText = ctx.message.text;
    userData[userId].additionalText = messageText;

    ctx.reply(
      `Your name is ${userData[userId].name}, your phone number is ${userData[userId].id}, and your ticket number is: ${userData[userId].additionalText}`,
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
  let backupData = { ...userData[userId] }; // Create a backup before deletion
  userData[userId] = backupData;
 
  const messageText = ctx.message.text;
  console.log(userId);
  
  // Check if user data exists before forwarding comment
  if (!userData[userId]) {
    console.error(`User data not found for user ${userId}`);
    
    // Notify the user if their data is not complete
    await ctx.reply(`Sorry, you have't play UPix lottery before, To give a comment atleast you have play (Get ticket) once`);
    
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
  delete userData[userId];
}
  
});


// Handle media (image, video, etc.) from the admin
bot.on(['photo', 'video', 'audio'], async (ctx) => {
 
if(!isAdminBroadcasting){
  const userId = ctx.from.id.toString();
  // Check if the message is from the admin or a user
  if (ctx.from.id.toString() === ADMIN_ID && isUserSendingForVerification) {
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

      ctx.reply('Screenshot received and forwarded to the admin for verification. Please wait for a response.', {
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

}
if(isAdminBroadcasting){
  
 
  const userId = ctx.from.id.toString();
  if (userIds.length > 0) {
  if (isAdminBroadcasting && userId === ADMIN_ID) {
    const message = ctx.message;
    const messageText = ctx.message.caption
    const caption = `${messageText}`; // Default caption for all media

    // Broadcast image with caption
    if (message.photo) {
      const fileId = message.photo[message.photo.length - 1].file_id;
      for (const id of userIds) {
        try {
          await bot.telegram.sendPhoto(id, fileId, { caption: caption });
        } catch (error) {
          console.error(`Failed to send image to user ${id}:`, error);
        }
      }
    }

    // Broadcast video with caption
    if (message.video) {
      const fileId = message.video.file_id;
      for (const id of userIds) {
        try {
          await bot.telegram.sendVideo(id, fileId, { caption: caption });
        } catch (error) {
          console.error(`Failed to send video to user ${id}:`, error);
        }
      }
    }

    // Broadcast audio with caption
    if (message.audio) {
      const fileId = message.audio.file_id;
      for (const id of userIds) {
        try {
          await bot.telegram.sendAudio(id, fileId, { caption: caption });
        } catch (error) {
          console.error(`Failed to send audio to user ${id}:`, error);
        }
      }
    }

    ctx.reply('Your media with caption has been broadcasted to all users!');
    isAdminBroadcasting = false;  // Reset the flag
  }
} else {
  ctx.reply('No users to broadcast the message to.');
}
}});


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
        caption: 'Your ticket is not \u274C verified.\nTo verify, please send ticket money to Telebirr account 0984403840.\nThen come back and send me screenshot.\nGOOD LUCK',
      });

    }
    let backupData = { ...userData[userId] }; // Create a backup before deletion
    if (ctx.callbackQuery.data === 'Verify') {
      const adminId = ctx.from.id.toString();
     
      userData[userId] = backupData;
     
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
      userData[userId] = backupData;
      if (!userData[userId]) {
        ctx.reply('Error: User data not found for verification.');
        return;
      }

      const user = userData[userId];
      if (verified === true) {
        ctx.reply('Sorry, your ticket is on the way. Please come back and check later.');
        return;
      } else{

      const imageFilePath = await generateVerifiedTicketImage(user, userId);
      const imageBuffer = await fs.promises.readFile(imageFilePath);

      await ctx.telegram.sendPhoto(userId, { source: imageBuffer }, {
        caption: 'Your ticket is now verified! Please do not lose your ticket.\nThank you for your participation!\nGOOD LUCK',
      });
      verified= true
      // Once the verified ticket is sent, reset the user's data
      delete userData[userId];

    }}

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

//module.exports = bot
bot.launch()
  

