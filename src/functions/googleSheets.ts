import { GuildMember, User } from "discord.js";
import { google } from "googleapis";
import { getGoogleSheetsOAuth2Client } from "./getGoogleSheetOAuth2Client";

const upsertValueToGoogleSheet = async (
	spreadsheetId: string,
	user: GuildMember,
	column: number,
	value: string,
	userIds: { [key: string]: number }
) => {
	const auth = await getGoogleSheetsOAuth2Client();
	if (!auth) return;
	const sheets = google.sheets({ version: "v4", auth });
	// lookup userId in userIds
	const rowNumber = userIds[user.id];
	if(!rowNumber) {
		console.log(`user id ${user.id} not found in userIds`);
		// find last row
		const newRow = Object.keys(userIds).length + 1; // one for header, one for 0 index
		// save to last row
		const rowValues = [user.id, user.user.tag, new Date()];
		// pad with empty strings so we can just insert once
		for(let i=3;i<column;i++) {
			rowValues.push("");
		}
		rowValues.push(value);

		sheets.spreadsheets.values.update({
			spreadsheetId,
			range: `Feedback!${getA1Notation(newRow, 0)}`, // todo change the sheet name to be a parameter
			valueInputOption: "RAW",
			requestBody: {
				values: [rowValues],
			},
		});
		// save userId to userIds with row number
		userIds[user.id] = newRow;
	} else{
		console.log(`user id ${user.id} found in userIds, updating row ${rowNumber} column ${column}`);
		//update existing row
		sheets.spreadsheets.values.update(
			{
				spreadsheetId,
				range: `Feedback!${getA1Notation(rowNumber,column)}`,
				valueInputOption:'RAW',
				requestBody: {
					values: [[value]]
				}
			})
	}
};

const getUserIdColumn = async (spreadsheetId:string) => {
	const auth = await getGoogleSheetsOAuth2Client();
	if (!auth) return [];
	const sheets = google.sheets({ version: "v4", auth });
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId,
		range: "Feedback!A2:A",
	});
	return res?.data.values??[];
	
}

const appendToGoogleSheet = async (
	values: string[][],
	sheetName: string,
	spreadsheetId: string
) => {
	//todo should we cache this auth?
	const auth = await getGoogleSheetsOAuth2Client();
	if (!auth) return;
	const sheets = google.sheets({ version: "v4", auth });
	sheets.spreadsheets.values.append(
		{
			spreadsheetId,
			range: sheetName,
			valueInputOption: "RAW",
			insertDataOption: "INSERT_ROWS",
			requestBody: {
				majorDimension: "ROWS",
				values,
			},
		},
		(err: any, res: any) => {
			if (err) return console.log("The API returned an error: " + err);
		}
	);
};

// Thank you to Amit Agarwal
// https://www.labnol.org/convert-column-a1-notation-210601
const getA1Notation = (row:number, column:number) => {
	const a1Notation = [`${row + 1}`];
	const totalAlphabets = "Z".charCodeAt(0) - "A".charCodeAt(0) + 1;
	let block = column;
	while (block >= 0) {
		a1Notation.unshift(
			String.fromCharCode((block % totalAlphabets) + "A".charCodeAt(0))
		);
		block = Math.floor(block / totalAlphabets) - 1;
	}
	return a1Notation.join("");
};

export { appendToGoogleSheet, upsertValueToGoogleSheet, getUserIdColumn };