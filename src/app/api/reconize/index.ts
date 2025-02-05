import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

// Fungsi untuk menghitung cosine similarity
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { embedding } = req.body;

    if (!Array.isArray(embedding)) {
      return res.status(400).json({ error: "Invalid embedding data" });
    }

    const filePath = path.join(process.cwd(), "data", "faceEmbeddings.json");

    try {
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "No embeddings found" });
      }

      const fileData = fs.readFileSync(filePath, "utf-8");
      const embeddings = JSON.parse(fileData);

      let bestMatch = null;
      let highestSimilarity = 0;

      embeddings.forEach((savedFace: { id: string; name: string; embedding: number[] }) => {
        const similarity = cosineSimilarity(embedding, savedFace.embedding);

        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = { id: savedFace.id, name: savedFace.name, similarity };
        }
      });

      const threshold = 0.9; // Adjust similarity threshold as needed

      if (highestSimilarity >= threshold) {
        res.status(200).json({ match: bestMatch });
      } else {
        res.status(200).json({ match: null });
      }
    } catch (error) {
      console.error("Error recognizing face:", error);
      res.status(500).json({ error: "Failed to recognize face" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
