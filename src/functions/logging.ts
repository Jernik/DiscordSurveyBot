import { Client, Snowflake } from "discord.js";
import { config } from "../config";

let safelyLogToChannel =
	(client: Client) => (e: unknown, extraInfo: string = "") => {
		let fullMessage: string;
		if (e === null) {
			fullMessage =
				extraInfo ?? "attempted to log empty message";
		} else {
			let message: string;
			if (typeof e === "string") {
				message = e; // works, `e` narrowed to string
			} else if (e instanceof Error) {
				message = e.message; // works, `e` narrowed to Error
			}else{
				return;
			}
			fullMessage = message;
		}
		console.log(fullMessage);
		let logChannel = client.channels.cache.get(
			config.LOG_CHANNEL_ID as Snowflake
		);
		if (logChannel?.isText()) {
			logChannel.send(fullMessage);
		}
	};

export { safelyLogToChannel as safeLogCreator};
