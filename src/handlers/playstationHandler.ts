import {
	ExcludeEnum,
	GuildMember,
	InteractionReplyOptions,
	InteractionUpdateOptions,
	MessageActionRow,
	MessageButton,
	MessageComponentInteraction,
	Modal,
	ModalActionRowComponent,
	TextInputComponent,
} from "discord.js";
import { MessageButtonStyles } from "discord.js/typings/enums";
import { config } from "../config";
import {
	getUserIdColumn,
	upsertValueToGoogleSheet,
} from "../functions/googleSheets";

// maybe move this out to a separate file
export interface IIndexable<T = any> {
	[key: string]: T;
}
const surveyType = "playstation";
const { PLAYSTATION_FEEDBACK_SHEET_ID } = config;

let userIds = {} as IIndexable<number>;
const loadUserIds = async () => {
	userIds = (await getUserIdColumn(PLAYSTATION_FEEDBACK_SHEET_ID)).reduce(
		(accum, row, index) => ({
			...accum,
			[row[0]]: index + 1,
		}),
		{} as IIndexable<number>
	);
};

let loadHandlerData = async () => {
	loadUserIds();
};
export { loadHandlerData };

export type NextState = {
	action: string | string[];
	nextState: string;
	response: ModalResponse | ButtonResponse | TextOnlyResponse;
};

type ModalResponse = {
	type: "MODAL";
	components: {
		type: "TEXT_PARAGRAPH" | "TEXT_SHORT";
		label: string;
		placeholder: string;
		style: "SHORT" | "PARAGRAPH";
		required: boolean;
	}[];
};

type ButtonResponse = {
	type: "BUTTONS";
	content: string;
	components: ButtonResponseComponent[];
};

type ButtonResponseComponent = {
	label: string;
	style: ExcludeEnum<typeof MessageButtonStyles, "LINK">;
	value: string;
	emoji?: string;
};

type TextOnlyResponse = {
	type: "TEXT_ONLY";
	content: string;
};

const commentButtonResponse = (topic: string): ButtonResponse => ({
	type: "BUTTONS",
	content: `Would you like to leave a comment on ${topic}?`,
	components: [
		{ label: "Yes", style: "PRIMARY", value: "Yes", emoji: "📝" },
		{ label: "No", style: "SECONDARY", value: "No" },
	],
});
const starButtons: ButtonResponseComponent[] = [
	{ label: "1", style: "PRIMARY", value: "1", emoji: "⭐" },
	{ label: "2", style: "PRIMARY", value: "2", emoji: "⭐" },
	{ label: "3", style: "PRIMARY", value: "3", emoji: "⭐" },
	{ label: "4", style: "PRIMARY", value: "4", emoji: "⭐" },
	{ label: "5", style: "PRIMARY", value: "5", emoji: "⭐" },
];

const graphicsResponse: ButtonResponse = {
	type: "BUTTONS",
	content: `Question 2: 
How would you rate the overall graphics of the game? 1-Poor, 5-Great`,
	components: starButtons,
};

const performanceResponse: ButtonResponse = {
	type: "BUTTONS",
	content: `Question 3: 
How would you rate the performance? 1-Poor, 5-Great`,
	components: starButtons,
};
const uiResponse: ButtonResponse = {
	type: "BUTTONS",
	content: `Question 4: 
Was the UI easy to read?  1-Poor, 5-Great`,
	components: starButtons,
};
const gamepadResponse: ButtonResponse = {
	type: "BUTTONS",
	content: `Question 5: 
Were there any gamepad controls missing?`,
	components: [
		{ label: "Yes", style: "PRIMARY", value: "Yes", emoji: "📝" },
		{ label: "No", style: "SECONDARY", value: "No" },
	],
};
const finishResponse: TextOnlyResponse = {
	type: "TEXT_ONLY",
	content: "Thank you for your feedback!",
};

const modalCommentResponse = (topic: string): ModalResponse => ({
	type: "MODAL",
	components: [
		{
			type: "TEXT_PARAGRAPH",
			label: `Comment on ${topic}`,
			placeholder: `Leave a comment about ${topic}`,
			style: "PARAGRAPH",
			required: true,
		},
	],
});

type State = {
	spreadsheetColumnIndex?: number;
	nextStates: NextState[];
};
const states: IIndexable<State> = {
	start: {
		nextStates: [
			{
				action: "start",
				nextState: "platform",
				response: {
					type: "BUTTONS",
					content: `Question 1: 
What platform did you play on?`,
					components: [
						{ label: "PS4", style: "PRIMARY", value: "PS4" },
						{ label: "PS5", style: "PRIMARY", value: "PS5" },
					],
				},
			},
		],
	},
	platform: {
		spreadsheetColumnIndex: 3,
		nextStates: [
			{
				action: ["PS4", "PS5"],
				nextState: "graphics",
				response: graphicsResponse,
			},
		],
	},
	graphics: {
		spreadsheetColumnIndex: 4,
		nextStates: [
			{
				action: ["1", "2", "3", "4", "5"],
				nextState: "graphicsComment",
				response: commentButtonResponse("graphics"),
			},
		],
	},
	graphicsComment: {
		nextStates: [
			{
				action: "Yes",
				nextState: "graphicsCommentModal",
				response: modalCommentResponse("graphics"),
			},
			{
				action: "No",
				nextState: "performance",
				response: performanceResponse,
			},
		],
	},
	graphicsCommentModal: {
		spreadsheetColumnIndex: 5,
		nextStates: [
			{
				action: "submit",
				nextState: "performance",
				response: performanceResponse,
			},
		],
	},
	performance: {
		spreadsheetColumnIndex: 6,
		nextStates: [
			{
				action: ["1", "2", "3", "4", "5"],
				nextState: "performanceComment",
				response: commentButtonResponse("performance"),
			},
		],
	},
	performanceComment: {
		nextStates: [
			{
				action: "Yes",
				nextState: "performanceCommentModal",
				response: modalCommentResponse("performance"),
			},
			{
				action: "No",
				nextState: "ui",
				response: uiResponse,
			},
		],
	},
	performanceCommentModal: {
		spreadsheetColumnIndex: 7,
		nextStates: [
			{
				action: "submit",
				nextState: "ui",
				response: uiResponse,
			},
		],
	},
	ui: {
		spreadsheetColumnIndex: 8,
		nextStates: [
			{
				action: ["1", "2", "3", "4", "5"],
				nextState: "uiComment",
				response: commentButtonResponse("UI"),
			},
		],
	},
	uiComment: {
		nextStates: [
			{
				action: "Yes",
				nextState: "uiCommentModal",
				response: modalCommentResponse("UI"),
			},
			{
				action: "No",
				nextState: "gamepadComment",
				response: gamepadResponse,
			},
		],
	},
	uiCommentModal: {
		spreadsheetColumnIndex: 9,
		nextStates: [
			{
				action: "submit",
				nextState: "gamepadComment",
				response: gamepadResponse,
			},
		],
	},
	gamepadComment: {
		nextStates: [
			{
				action: "Yes",
				nextState: "gamepadCommentModal",
				response: {
					type: "MODAL",
					components: [
						{
							type: "TEXT_PARAGRAPH",
							label: "What Controls were missing?",
							placeholder: "Leave as much detail as you want...",
							style: "PARAGRAPH",
							required: true,
						},
					],
				},
			},
			{
				action: "No",
				nextState: "finish",
				response: finishResponse,
			},
		],
	},
	gamepadCommentModal: {
		spreadsheetColumnIndex: 10,
		nextStates: [
			{
				action: "submit",
				nextState: "finish",
				response: finishResponse,
			},
		],
	},
	finish: { nextStates: [] },
};

let playStationHandler = async (interaction: MessageComponentInteraction) => {
	// todo figure out how to make this mess better
	if (interaction.customId.split("-")[1] === "start") {
		await interaction.reply({
			ephemeral: true,
			...buildButtonReply(
				states.start.nextStates[0].nextState,
				states.start.nextStates[0].response as ButtonResponse
			),
		});
		return;
	}
	// handle state machine from here
	await handleStateTransition(interaction);
};

let handleStateTransition = async (
	interaction: MessageComponentInteraction
) => {
	// get the current state from the interaction
	const currentStateName = interaction.customId.split("-")[1];
	const currentState = (states as IIndexable<State>)[currentStateName];
	// maybe todo if currentState is a modal then find original message and update that saved interaction instead of the current one??
	if (currentState.spreadsheetColumnIndex) {
		let guildMember = getGuildMemberFromInteraction(interaction);
		if (!guildMember) return; // todo handle this better
		let value = interaction.customId.split("-")[2]; // todo write functions to serialize and deserialize state-value, etc to centralize this logic

		if (interaction.isModalSubmit()) {
			// ASSUMPTION: there is only one field in the modal
			let fieldCustomId = interaction.components[0].components[0].customId;
			value = interaction.fields.getTextInputValue(fieldCustomId);
		}
		saveFeedback(
			guildMember,
			currentState.spreadsheetColumnIndex,
			value,
			userIds
		);
	}
	// calculate the next state
	const nextState = currentState.nextStates.find((nextState) => {
		if (typeof nextState.action === "string") {
			return nextState.action === interaction.customId.split("-")[2];
		} else if (Array.isArray(nextState.action)) {
			return nextState.action.includes(interaction.customId.split("-")[2]);
		}
	})!; // "guaranteed" to exist since these are all dev defined (will need validation if I allow users to define states)

	if (nextState.response.type === "BUTTONS") {
		await interaction.update(
			buildButtonUpdate(nextState.nextState, nextState.response)
		);
	} else if (nextState.response.type === "TEXT_ONLY") {
		await interaction.update(
			buildTextOnlyUpdate(nextState.nextState, nextState.response)
		);
	} else if (nextState.response.type === "MODAL") {
		// maybe todo save current interaction to a map so that I can update it later??
		await interaction.showModal(
			buildModal(nextState.nextState, nextState.response)
		);
	}
};

let buildModal = (nextState: string, responseOptions: ModalResponse): Modal => {
	// Create the modal
	const modal = new Modal()
		.setCustomId(`${surveyType}-${nextState}-submit`)
		.setTitle("Feedback");
	// Add components to modal
	// Create the text input components
	const inputs = responseOptions.components.map((component) =>
		new TextInputComponent()
			.setCustomId(`${surveyType}-${nextState}-${component.label}`)
			.setLabel(component.label)
			.setPlaceholder(component.placeholder)
			.setRequired(component.required)
			.setStyle(component.style)
	);

	// An action row only holds one text input,
	// so you need one action row per text input.
	const actionComponents = inputs.map((input) =>
		new MessageActionRow<ModalActionRowComponent>().addComponents(input)
	);

	// Add inputs to the modal
	modal.addComponents(...actionComponents);
	return modal;
};

// todo figure out this type
let buildButtonMessage = (
	nextState: string,
	responseOptions: ButtonResponse
): unknown => {
	let buttonRow = new MessageActionRow();

	buttonRow.addComponents(
		responseOptions.components.map((component) => {
			return new MessageButton({
				label: component.label,
				style: component.style,
				customId: `${surveyType}-${nextState}-${component.value}`,
				emoji: component.emoji,
			});
		})
	);
	return {
		content: responseOptions.content,
		components: [buttonRow],
	};
};

let buildButtonUpdate = buildButtonMessage as (
	nextState: string,
	responseOptions: ButtonResponse
) => InteractionUpdateOptions;

let buildButtonReply = buildButtonMessage as (
	nextState: string,
	responseOptions: ButtonResponse
) => InteractionReplyOptions;

let buildTextOnlyMessage = (
	nextState: string,
	responseOptions: TextOnlyResponse
): unknown => {
	return {
		content: responseOptions.content,
		components: [],
	};
};
let buildTextOnlyUpdate = buildTextOnlyMessage as (
	nextState: string,
	responseOptions: TextOnlyResponse
)=> InteractionUpdateOptions;

let buildTextOnlyReply = (
	nextState: string,
	responseOptions: TextOnlyResponse
): InteractionReplyOptions => {
	return buildTextOnlyMessage(
		nextState,
		responseOptions
	) as InteractionReplyOptions;
};

async function saveFeedback(
	user: GuildMember,
	columnIndex: number,
	value: string,
	userIds: { [key: string]: number }
) {
	try {
		if (user) {
			console.log("saving feedback");
			console.log(user.id, value);

			upsertValueToGoogleSheet(
				PLAYSTATION_FEEDBACK_SHEET_ID,
				user,
				columnIndex,
				value,
				userIds
			);
		} else {
			console.log("user not found");
		}
	} catch (e) {
		console.log(e);
	}
}

let getGuildMemberFromInteraction = (
	interaction: MessageComponentInteraction
) => {
	if (interaction.member instanceof GuildMember) {
		return interaction.member;
	} else {
		const found = interaction.guild?.members?.resolve(interaction.user?.id);
		if (found) return found;
	}
	return null;
};

export { playStationHandler };
