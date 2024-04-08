import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";

const getPopulationData = async (endpoint: string) => {
	const res = await fetch(endpoint);
	const data = await res.json();

	return data[0].population;
};
const getCurrencyData = async (endpoint: string) => {
	const res = await fetch(endpoint);
	const data = await res.json();

	return data.rates[0].mid;
};

const question_response = await fetch(
	"https://tasks.aidevs.pl/task/9c2aad2c4f86bb4989d7eca3dded04bffd00229b"
);
const taskData = await question_response.json();
const question = taskData.question;
const databases = [taskData["database #1"], taskData["database #2"]];

const system = `Based on the provided question return a JSON.

If the question is not about currency or population return JSON with key "ANSWER" and answer.

Make sure that the response from API is in JSON Format. Answer as truthfully as possible.

Required JSON Format ###
{
  "answer": an endpoint for getting an answer or actual answer if the question is not about population or currency,
  "key":  key either POPULATION, CURRENCY, or KNOWLEDGE
}###
${databases.join(", ")}`;

const chat = new ChatOpenAI({
	modelName: "gpt-3.5-turbo",
});

const { content } = await chat.invoke([
	new SystemMessage(system),
	new HumanMessage(question),
]);

const { answer, key } = JSON.parse(content as string);
if (answer && key) {
	const functions = {
		POPULATION: getPopulationData,
		CURRENCY: getCurrencyData,
		KNOWLEDGE: (answer: string) => answer,
	} as const;

	const data = await functions[key as keyof typeof functions](answer);

	console.log(data);
}
