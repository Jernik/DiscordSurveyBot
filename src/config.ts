interface ENV {
	DISCORD_TOKEN: string | undefined;
	CLIENT_ID: string | undefined;
	LOG_CHANNEL_ID: string | undefined;
	PLAYSTATION_FEEDBACK_SHEET_ID: string | undefined;
}

interface Config {
	DISCORD_TOKEN: string;
	CLIENT_ID: string;
	LOG_CHANNEL_ID: string;
	PLAYSTATION_FEEDBACK_SHEET_ID: string;
}

const getConfig = (): ENV => {
	return {
		DISCORD_TOKEN: process.env.DISCORD_TOKEN,
		CLIENT_ID: process.env.CLIENT_ID,
		LOG_CHANNEL_ID: process.env.LOG_CHANNEL_ID,
		PLAYSTATION_FEEDBACK_SHEET_ID: process.env.PLAYSTATION_FEEDBACK_SHEET_ID,
	};
};

const getSanitizedConfig = (config: ENV): Config => {
	for (const [key, value] of Object.entries(config)) {
		if (value === undefined) {
			throw new Error(`Missing key ${key} in config.env`);
		}
	}
	let parsedConfig = JSON.parse(JSON.stringify(config));
	return parsedConfig as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitizedConfig(config);

export {sanitizedConfig as config};

