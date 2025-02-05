// import { NextApiRequest, NextApiResponse } from "next";
// import fs from "fs";
// import path from "path";

// const EMBEDDINGS_PATH = path.resolve("data", "embeddings.json");

// const readEmbeddings = (): Array<{ id: number; name: string; embedding: number[] }> => {
//   return fs.existsSync(EMBEDDINGS_PATH) ? JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, "utf8")) : [];
// };

// export default function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "GET") {
//     res.setHeader("Allow", ["GET"]);
//     return res.status(405).json({ error: "Method not allowed." });
//   }

//   const data = readEmbeddings();
//   return res.status(200).json(data);
// }
