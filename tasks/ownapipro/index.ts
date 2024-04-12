import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import fs from "fs";

const getSystem = (memory: string) => `
As a personal assistant, your main task is to answer questions as truthfully as possible while keeping them concise and short. If message is not a question
generate a hint and return it in JSON.

As an response return JSON with format ###
{
	"isQuestion": true or false,
	"answer": "The answer to the question, if it is not a question, return something like 'OK. Get it'",
    hint: The hint to be added to the memory file
}
###

Context###
${memory}
###
`;

const addHintToMemory = async (hint: string) => {
	const content = fs.readFileSync("tasks/ownapipro/memory.md", "utf8");
	const newContent = `${content}\n${hint}`;

	fs.writeFileSync("tasks/ownapipro/memory.md", newContent);
};

const app = express();
const PORT = 3001;

app.use(bodyParser.json());

app.post("/api", async (req: Request, res: Response) => {
	const { question } = req.body;
	const fileContent = fs.readFileSync("tasks/ownapipro/memory.md", "utf8");

	if (!question)
		return res.status(400).json({ error: "Please provide a question" });

	try {
		const chat = new ChatOpenAI({
			modelName: "gpt-4-turbo",
		});

		const { content: answer } = await chat.invoke([
			new SystemMessage(getSystem(fileContent)),
			new HumanMessage(question),
		]);

		const data = JSON.parse(String(answer));

		if (!data.isQuestion) {
			console.log("Adding hint to memory");
			await addHintToMemory(data.hint);
		}

		res.status(200).json({ reply: data.answer });
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Something went wrong..." });
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
