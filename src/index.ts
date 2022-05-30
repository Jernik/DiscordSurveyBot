// Require the necessary discord.js classes
import {
	Client,
	Intents,
	MessageComponentInteraction,
} from "discord.js";
import * as dotenv from "dotenv";
dotenv.config();

import { config } from "./config";
import { safeLogCreator } from "./functions/logging";
import {
	playStationHandler,
	loadHandlerData as loadPlaystationHandlerData,
} from "./handlers/playstationHandler";

async function main() {
	let token = config.DISCORD_TOKEN;

	// Create a new client instance
	const client = new Client({
		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES,
		],
	});
	let _safeLog = safeLogCreator(client);

	// When the client is ready, run this code (only once)
	client.once("ready", () => {
		console.log("Ready!");
	});

	client.on(
		"interactionCreate",
		async (interaction: MessageComponentInteraction) => {
			//todo add a try catch around all of this
			// switch on the first part of the customId to determine which survey it is
			try{
			const surveyType = interaction.customId.split("-")[0];
			switch (surveyType) {
				case "playstation":
					//dispatch to playstation handler
					await playStationHandler(interaction);
					break;
				default:
					interaction.reply({
						content: `Unknown Survey type ${surveyType}! Please contact Modmail with a screenshot of this message!`,
						ephemeral: true,
					});
			}
		}catch(e){
			console.log("error in interactionCreate: ", e.message);
		}
		}
	);
	// load all handler data before starting bot on discord
	console.log("Loading all handler data...");
	await loadPlaystationHandlerData();
	console.log("Loaded all handler data, connecting to discord...");
	// Login to Discord with your client's token
	client.login(token);
}
main();
