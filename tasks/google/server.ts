import express, { Request, Response } from "express";
import bodyParser from "body-parser";

const searchParams = new URLSearchParams({
	engine: "google",
	api_key: process.env.SERP_API_KEY as string,
});

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post("/api", async (req: Request, res: Response) => {
	const { question } = req.body;

	if (!question)
		return res.status(400).json({ error: "Please provide a question" });

	const searchRes = await fetch(
		`https://serpapi.com/search?${searchParams}&q=${question}`
	);

	const searchData = await searchRes.json();

	res.status(200).json({ reply: searchData.organic_results[0].link });
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
