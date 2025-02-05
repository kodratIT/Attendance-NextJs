import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const EMBEDDINGS_PATH = path.resolve("data", "embeddings.json");

const readEmbeddings = (): Array<{ id: number; name: string; embedding: number[] }> => {
  return fs.existsSync(EMBEDDINGS_PATH) ? JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, "utf8")) : [];
};

const calculateCosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { embedding } = req.body;

  if (!Array.isArray(embedding)) {
    return res.status(400).json({ error: "Valid embedding array is required." });
  }

  const data = readEmbeddings();

  if (data.length === 0) {
    return res.status(404).json({ error: "No saved embeddings found." });
  }

  const similarities = data.map((entry) => {
    const similarity = calculateCosineSimilarity(embedding, entry.embedding);
    return { name: entry.name, similarity };
  });

  similarities.sort((a, b) => b.similarity - a.similarity);

  return res.status(200).json({
    message: "Recognition completed.",
    bestMatch: similarities[0],
    allMatches: similarities,
  });
}
