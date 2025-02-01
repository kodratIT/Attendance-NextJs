import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { id, name, embedding } = req.body;

    console.log(req.body);
    // Validasi input
    if (!id || !name || !Array.isArray(embedding)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    // Lokasi file untuk menyimpan embedding
    const filePath = path.join(process.cwd(), "data", "faceEmbeddings.json");

    try {
      // Baca data yang sudah ada
      let existingData = [];
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        existingData = JSON.parse(fileData);
      }

      // Tambahkan data baru
      existingData.push({ id, name, embedding });

      // Simpan ke file
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf-8");

      res.status(200).json({ message: "Face embedding saved successfully" });
    } catch (error) {
      console.error("Error saving face embedding:", error);
      res.status(500).json({ error: "Failed to save face embedding" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
