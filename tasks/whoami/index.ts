import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "langchain/schema";
import * as fs from "fs";

const getHintAndWriteToFile = async () => {
	const response = await fetch("https://tasks.aidevs.pl/task/");

	const data = await response.json();

	// get file content and add hint as next line
	const fileContent = fs.readFileSync("tasks/whoami/memory.md", "utf8");
	const hint = data.hint;
	const newContent = `${fileContent}\n${hint}`;

	// write new content to file
	fs.writeFileSync("tasks/whoami/memory.md", newContent);

	return newContent;
};

const guess = async () => {
	const description = await getHintAndWriteToFile();

	const user = `Your task is to tell me who is the person described below only if you are 100% sure, if not answer just "NO" and nothing else. \n Description: ${description} \n`;

	const chat = new ChatOpenAI({
		modelName: "gpt-4",
	});

	const { content: answer } = await chat.invoke([new HumanMessage(user)]);

	if (answer === "NO") {
		guess();
	} else {
		await fetch("https://tasks.aidevs.pl/answer/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ answer }),
		});
	}
};

guess();
