import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "langchain/schema";

const task = await fetch("https://tasks.aidevs.pl/task/");
const taskData = await task.json();
const url = taskData.url;

try {
	const user = [
		{
			type: "text",
			text: "If there’s a gnome in the picture, respond only with the color of his hat in Polish. Otherwise, write “error.”",
		},
		{
			type: "image_url",
			image_url: {
				url,
			},
		},
	];

	const chat = new ChatOpenAI({
		modelName: "gpt-4-turbo",
	});

	const { content: answer } = await chat.invoke([
		// @ts-ignore
		new HumanMessage({ content: user }),
	]);

	console.log(answer);
} catch (error) {
	console.log(error);
}
