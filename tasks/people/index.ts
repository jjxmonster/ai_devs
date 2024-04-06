import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { HumanMessage, SystemMessage } from "langchain/schema";
import fs from "fs";

const COLLECTION_NAME = "people";

const loader = new TextLoader("tasks/people/knowledge.json");

const [doc] = await loader.load();
const knowledge: Array<{ question: string; answer: string }> = JSON.parse(
	doc.pageContent
);

const response = await fetch("https://tasks.aidevs.pl/data/people.json");
const records = await response.json();
const question_response = await fetch("https://tasks.aidevs.pl/task/");
const data = await question_response.json();
const question = data.question;
const foundKnowledge = knowledge.find(k => k.question === question);
if (foundKnowledge) {
	console.log("Answer already found", foundKnowledge.answer);
}

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
const result = await qdrant.getCollections();
const embeddings = new OpenAIEmbeddings({ maxConcurrency: 5 });
const indexed = result.collections.find(
	collection => collection.name === COLLECTION_NAME
);

const queryEmbedding = await embeddings.embedQuery(question);
if (!indexed) {
	await qdrant.createCollection(COLLECTION_NAME, {
		vectors: { size: 1536, distance: "Cosine", on_disk: true },
	});
}
const collectionInfo = await qdrant.getCollection(COLLECTION_NAME);

if (collectionInfo.vectors_count === 0) {
	let documents: any[] = [];

	for (const record of records) {
		console.log(record, "record");
		const [embedding] = await embeddings.embedDocuments([
			record.imie + " " + record.nazwisko,
		]);
		documents.push({
			id: uuidv4(),
			metadata: { ...record, source: COLLECTION_NAME },
			vector: embedding,
		});
	}

	await qdrant.upsert(COLLECTION_NAME, {
		wait: true,
		batch: {
			ids: documents.map(point => point.id),
			vectors: documents.map(point => point.vector),
			payloads: documents.map(point => point.metadata),
		},
	});
}
const search = await qdrant.search(COLLECTION_NAME, {
	vector: queryEmbedding,
	limit: 1,
	filter: {
		must: [
			{
				key: "source",
				match: {
					value: COLLECTION_NAME,
				},
			},
		],
	},
});

try {
	const system = `Return answer for the question in POLISH language, based on provided text about person. About###${JSON.stringify(
		search[0].payload
	)}###`;
	const user = question;

	const chat = new ChatOpenAI({
		modelName: "gpt-3.5-turbo",
	});

	const { content: answer } = await chat.invoke([
		new SystemMessage(system),
		new HumanMessage(user),
	]);

	console.log(answer);

	if (!foundKnowledge) {
		knowledge.push({ question, answer });

		fs.writeFileSync(
			"tasks/people/knowledge.json",
			JSON.stringify(knowledge, null, 2)
		);
	}
} catch (error) {
	console.log(error);
}
