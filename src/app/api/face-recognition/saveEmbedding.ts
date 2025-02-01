import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const EMBEDDINGS_PATH = path.resolve("data", "embeddings.json");

const readEmbeddings = (): Array<{ id: number; name: string; embedding: number[] }> => {
  return fs.existsSync(EMBEDDINGS_PATH) ? JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, "utf8")) : [];
};

const saveEmbeddings = (data: any): void => {
  fs.mkdirSync(path.dirname(EMBEDDINGS_PATH), { recursive: true });
  fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(data, null, 2));
};

const calculateSafeAverageEmbedding = (
    existing: number[],
    newEmbedding: number[],
    threshold: number = 0.4 // Sesuai dengan embedding yang mencapai 0.9
  ): number[] => {
    return existing.map((val, idx) => {
      const diff = Math.abs(newEmbedding[idx] - val);
      if (diff > threshold) {
        // Jika perbedaan terlalu jauh, beri bobot lebih kecil pada nilai baru
        return (val * 49 + val) / 50;
      }
      // Jika perbedaan wajar, lanjutkan rata-rata normal
      return (val * 49 + newEmbedding[idx]) / 50;
    });
  };
  
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { name, embedding } = req.body;

  if (!name || !Array.isArray(embedding)) {
    return res.status(400).json({ error: "Name and valid embedding array are required." });
  }

  const data = readEmbeddings();
  const userIndex = data.findIndex((entry) => entry.name === name);

  if (userIndex !== -1) {
    const userEmbeddings = data[userIndex].embedding;
    data[userIndex].embedding = calculateSafeAverageEmbedding(userEmbeddings, embedding);
  } else {
    data.push({ id: data.length + 1, name, embedding });
  }

  saveEmbeddings(data);
  return res.status(200).json({ message: "Embedding saved successfully." });
}
