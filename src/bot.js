/**
 * @author Joshua Maxwell
 * @author Brandon Ingli
 * This file will start the bot, send commands to the command handlers
 * and it will add Spike Bucks to users whenever they send a message
 */

// dependencies
require("dotenv").config();
const { Client } = require("discord.js");
const { execute, onBotStart, onReaction } = require("./commands.js");
const { readIn, addBucks, getConsts } = require("./faccess.js");
const { verify } = require("./verify.js");
const cron = require("./botCron.js");
const slashCommands = require("./slashCommands.js");

const PREFIX = "$";

// loads in data
readIn();

// starting the bot
const bot = new Client();

const { spikeUID, simoneUID } = getConsts();

bot.on("ready", async () => {
  // when loaded (ready event)
  bot.user.setActivity(`${PREFIX}help | ${PREFIX}info`, { type: "LISTENING" });
  console.log(`${bot.user.username} is ready...`);
  // Starts the bot cron jobs
  cron.startJobs(bot);

  slashCommands.setBot(bot);

  // Uncomment below to delete all commands
  // const commands = await slashCommands.getCommands();
  // for (command of commands){
  // await slashCommands.deleteCommand(command.id);
  // }

  // Uncomment below to add new or update existing commands
  // slashCommands.addAllCommands();

  bot.ws.on("INTERACTION_CREATE", async (interaction) => {
    slashCommands.handleInteraction(interaction, bot);
  });

  onBotStart(bot);
});
// on message recieved
bot.on("message", (message) => {
  if (
    message.member &&
    !message.member.roles.cache.has(getConsts().role["verified"]) &&
    message.channel.id != getConsts().channel.introductions
  ) {
    verify(message, bot);
  }

  if (message.channel.type === "dm") {
    //TODO
  }

  // if it is a command
  if (message.content.charAt(0) === PREFIX) {
    execute(message, bot, PREFIX);
  }

  // if a user sends a message
  if (!message.author.bot) addBucks(message.author, 1);
});

// on Reactions

/**
 * Determine if a reaction should be processed
 * @param {Discord.MessageReaction} reaction Reaction triggered
 * @param {Discord.User} user User triggering reaction
 * @returns {boolean} true if reaction should be processed, false otherwise
 */
function reactionShouldBeProcessed(reaction, user) {
  return (
    (reaction.message.author.id == spikeUID ||
      reaction.message.author.id == simoneUID) &&
    user.id != spikeUID &&
    user.id != simoneUID &&
    reaction.message.embeds.length >= 1
  );
}

bot.on("messageReactionAdd", async (reaction, user) => {
  // When a reaction is received, check if the structure is partial
  if (reaction.partial) {
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the message: ", error);
      // Return as `reaction.message.author` may be undefined/null
      return;
    }
  }
  // Only deal with Spike and Simone messages with embeds
  if (reactionShouldBeProcessed(reaction, user)) {
    onReaction(reaction, user, true, bot);
  }
});

bot.on("messageReactionRemove", async (reaction, user) => {
  // When a reaction is received, check if the structure is partial
  if (reaction.partial) {
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the message: ", error);
      // Return as `reaction.message.author` may be undefined/null
      return;
    }
  }
  // Only deal with Spike and Simone messages with embeds
  if (reactionShouldBeProcessed(reaction, user)) {
    onReaction(reaction, user, false, bot);
  }
});

// brings the bot online
bot.login(process.env.DISJS_BOT_TOKEN);
