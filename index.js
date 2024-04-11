const Discord = require('discord.js');
const client = new Discord.Client();
const token = 'YOUR_DISCORD_BOT_TOKEN';
const PREFIX = '/';

// Map to store linked accounts
const linkedAccounts = new Map();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'link') {
        if (linkedAccounts.has(message.author.id)) {
            return message.reply('Your Discord account is already linked with a Minecraft account.');
        }
        await linkAccounts(message.author);
    }
});

// Function to handle changes in the Minecraft username
client.on('guildMemberUpdate', (oldMember, newMember) => {
    const linkedUsername = linkedAccounts.get(newMember.user.id);
    if (linkedUsername && oldMember.displayName !== newMember.displayName) {
        // Update the stored Minecraft username
        linkedAccounts.set(newMember.user.id, newMember.displayName);
        console.log(`Minecraft username updated for ${newMember.user.tag}: ${newMember.displayName}`);
    }
});

async function linkAccounts(user) {
    const randomCode = generateRandomCode(10);
    try {
        const code = await sendCode(user, randomCode);
        const minecraftUsername = await getMinecraftUsername(user, code);
        linkedAccounts.set(user.id, minecraftUsername);
        await rewardUser(user, minecraftUsername);
    } catch (error) {
        console.error(error);
    }
}

function generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomCode = '';
    for (let i = 0; i < length; i++) {
        randomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomCode;
}

function sendCode(user, code) {
    return user.send(`To link your Discord account with your Minecraft account, please follow these steps:\n\n1. Input this code along with your Minecraft username in this format: [code] [username].\n\n2. Example: ${code} Steve\n\nPlease reply within 1 minute.`);
}

async function getMinecraftUsername(user, code) {
    const filter = m => m.author.id === user.id;
    const collected = await user.dmChannel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] });
    const userInput = collected.first().content.trim().split(' ');
    const providedCode = userInput[0];
    const minecraftUsername = userInput.slice(1).join(' ');
    if (providedCode !== code) {
        throw new Error('Incorrect code provided');
    }
    return minecraftUsername;
}

async function rewardUser(user, minecraftUsername) {
    // Give the user a diamond sword as a reward
    const rewardMessage = `Congratulations! You have successfully linked your Discord account with Minecraft account: ${minecraftUsername}\n\nAs a reward, you received a Diamond Sword!`;
    await user.send(rewardMessage);
    // Optionally, you can add code here to give the user the diamond sword in Minecraft using your server plugin
}

client.login(token);
