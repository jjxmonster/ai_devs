import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";

const COLLECTION_NAME = "urls";

const response = await fetch("https://unknow.news/archiwum_aidevs.json");
const records = await response.json();

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
const result = await qdrant.getCollections();
const embeddings = new OpenAIEmbeddings({ maxConcurrency: 5 });
const indexed = result.collections.find(
	collection => collection.name === COLLECTION_NAME
);
const query = "Co różni pseudonimizację od anonimizowania danych?";
const queryEmbedding = await embeddings.embedQuery(query);

if (!indexed) {
	await qdrant.createCollection(COLLECTION_NAME, {
		vectors: { size: 1536, distance: "Cosine", on_disk: true },
	});
}

const collectionInfo = await qdrant.getCollection(COLLECTION_NAME);

if (!collectionInfo) {
	let documents: any[] = [];

	for (const record of records) {
		const [embedding] = await embeddings.embedDocuments([record.title]);

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

console.log(search);
