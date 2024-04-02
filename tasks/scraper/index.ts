import {
	type Browser,
	Page,
	PuppeteerWebBaseLoader,
} from "langchain/document_loaders/web/puppeteer";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";

const task = await fetch("https://tasks.aidevs.pl/task/");

const taskData = (await task.json()) as { input: string; question: string };

const loader = new PuppeteerWebBaseLoader(taskData.input, {
	launchOptions: {
		headless: "shell",
	},
	gotoOptions: {
		waitUntil: "domcontentloaded",
	},
	async evaluate(page: Page, browser: Browser) {
		// @ts-ignore
		const result = await page.evaluate(() => {
			if (document.querySelector("pre")) {
				return document.querySelector("pre").innerHTML;
			} else {
				throw new Error("No pre element found");
			}
		});
		return result;
	},
});

const docs = await loader.load();

try {
	const content = docs[0].pageContent;

	const system = `Return answer for the question in POLISH language, based on provided article. Maximum length for the answer is 200 characters. TEXT###${content}###`;
	const user = taskData.question;

	const chat = new ChatOpenAI({
		modelName: "gpt-3.5-turbo",
	});

	const { content: answer } = await chat.invoke([
		new SystemMessage(system),
		new HumanMessage(user),
	]);

	console.log(answer);
} catch (error) {
	console.log(error);
}
