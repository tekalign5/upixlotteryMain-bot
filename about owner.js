 if (ctx.callbackQuery.data === 'Verify') {
      const userId = ctx.from.id.toString();

      // Ensure userData for the user exists before proceeding with verification
      if (!userData[userId]) {
        ctx.reply('Error: User data not found for verification.');
        return;
      }

      // Mark the user as verified
      userData[userId].verified = true;

      // Generate the verified ticket image
      const imageFilePath = await generateVerifiedTicketImage(userData[userId], userId);
      const imageBuffer = await fs.promises.readFile(imageFilePath);

      // Send the verified ticket to the admin
      await ctx.telegram.sendPhoto(ADMIN_ID, { source: imageBuffer }, {
        caption: `Ticket for ${userData[userId].name} (${userData[userId].id}) has been verified!`,
      });

      // Send confirmation to the user
      await ctx.telegram.sendMessage(userId, 'Congratulations! Your ticket has been verified. Thank you for your participation!');
      ctx.reply('Ticket has been verified successfully and sent to the user!');
    }
