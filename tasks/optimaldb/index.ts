import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import fs from "fs";
const question_response = await fetch(
	"https://tasks.aidevs.pl/task/860401b33c343fda2781c32ae425d494f86f3c7c"
);
const taskData = await question_response.json();
const database = taskData.database;
const databaseData = await fetch(database);
const records = await databaseData.json();

const system =
	"Compress the JSON data into short sentences, ensuring no information about each person are not left out. Keep it precise and complete.";

const chat = new ChatOpenAI({
	modelName: "gpt-4-turbo",
	maxTokens: 1000,
});

const { content } = await chat.invoke([
	new SystemMessage(system),
	new HumanMessage(JSON.stringify(records)),
]);

fs.writeFileSync("tasks/optimaldb/opt.json", content);

const res = await fetch(
	"https://tasks.aidevs.pl/answer/860401b33c343fda2781c32ae425d494f86f3c7c",
	{
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ answer: content }),
	}
);
const answer = await res.json();
console.log(answer);
