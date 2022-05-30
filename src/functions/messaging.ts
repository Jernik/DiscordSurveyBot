import { GuildMember, User } from "discord.js";

async function safelySendDm(member: GuildMember|User, message: string) {
	try {
		member.send(message).catch((e) => console.log("unable to send dm"));
	} catch (e) {
		console.log("unable to send dm");
	}
}

export {safelySendDm};