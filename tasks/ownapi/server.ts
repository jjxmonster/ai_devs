import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { system } from "./helpers";

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post("/api", async (req: Request, res: Response) => {
	const { question } = req.body;

	if (!question)
		return res.status(400).json({ error: "Please provide a question" });

	try {
		const chat = new ChatOpenAI({
			modelName: "gpt-4-turbo",
		});

		const { content: answer } = await chat.invoke([
			new SystemMessage(system),
			new HumanMessage(question),
		]);

		res.status(200).json({ reply: answer });
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Something went wrong..." });
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
