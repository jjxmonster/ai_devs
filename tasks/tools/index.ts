import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";

const task = await fetch("https://tasks.aidevs.pl/task/");
const taskData = await task.json();

try {
	const system = `Based on provided message decide whether task should be added to the ToDo list or the calendar (if time is provided). 

    Answer should be in JSON format as follows###
    {
      "tool": whether "ToDo" or "Calendar",
      "desc": provided message,
      "date": YYYY-MM-DD (only for Calendar tool)
    } ###
    
    Context###
        Today is ${new Date().toLocaleDateString()}
    ###
    `;

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
