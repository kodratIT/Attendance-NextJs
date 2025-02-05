// import { NextApiRequest, NextApiResponse } from "next";
// import * as faceapi from "face-api.js";
// import multer from "multer";
// import { Canvas, loadImage, createCanvas,Image } from "canvas";
// import sharp from "sharp";
// import fs from "fs";
// import path from "path";
// import { promisify } from "util";

// const MODEL_PATH: string = "http://localhost:3000/model/";
// const upload = multer({ dest: path.join(process.cwd(), "tmp/uploads/") });
// const uploadMiddleware = promisify(upload.single("image"));

// const initializeCanvasEnvironment = async (): Promise<void> => {
//   if (!("Canvas" in global)) {
//     const canvas = await import("canvas");
//     faceapi.env.monkeyPatch({
//       Canvas: canvas.Canvas,
//       Image: canvas.Image,
//       ImageData: canvas.ImageData,
//     });
//   }
// };

// let modelsLoaded = false;
// const loadModelsOnce = async (): Promise<void> => {
//   if (!modelsLoaded) {
//     await Promise.all([
//       faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH + "tiny_face_detector"),
//       faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH + "face_landmark_68"),
//       faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH + "face_recognition"),
//     ]);
//     modelsLoaded = true;
//   }
// };

// const resizeImageBuffer = async (buffer: Buffer, width: number): Promise<Buffer> =>
//   sharp(buffer).resize({ width }).toBuffer();

// const detectFace = async (
//   buffer: Buffer
// ): Promise<
//   faceapi.WithFaceDescriptor<
//     faceapi.WithFaceLandmarks<
//       { detection: faceapi.FaceDetection },
//       faceapi.FaceLandmarks68
//     >
//   > | null
// > => {
//   const img = await loadImage(buffer);
//   const canvas = createCanvas(img.width, img.height);
//   const ctx = canvas.getContext("2d");
//   ctx.drawImage(img, 0, 0);

//   const detectionOptions = new faceapi.TinyFaceDetectorOptions({
//     inputSize: 320,
//     scoreThreshold: 0.5,
//   });

//   const detection = await faceapi
//     .detectSingleFace(canvas as unknown as HTMLCanvasElement, detectionOptions)
//     .withFaceLandmarks()
//     .withFaceDescriptor();

//   // Ubah undefined menjadi null
//   return detection ?? null;
// };


// interface MulterRequest extends NextApiRequest {
//   file?: Express.Multer.File;
// }

// const handler = async (req: MulterRequest, res: NextApiResponse) => {
//   try {
//     if (req.method !== "POST") {
//       res.setHeader("Allow", ["POST"]);
//       return res.status(405).json({ error: "Method not allowed." });
//     }

//     return res.status(200).json({
//       message: "Face embedding generated successfully.",
//       // embedding: Array.from(detection.descriptor),
//     });
//     await initializeCanvasEnvironment();
//     await loadModelsOnce();
//     await uploadMiddleware(req, res);

//     const file = req.file;
//     if (!file) {
//       return res.status(400).json({ error: "Image file is required." });
//     }

//     const originalBuffer = fs.readFileSync(file.path);
//     const resizedBuffer = await resizeImageBuffer(originalBuffer, 416);

//     const detection = await detectFace(resizedBuffer);
//     if (!detection) {
//       await fs.promises.unlink(file.path);
//       return res.status(400).json({ error: "No face detected in the image." });
//     }

//     await fs.promises.unlink(file.path);
//   } catch (error) {
//     console.error("Error generating embedding:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// export const config = {
//   api: {
//     bodyParser: false, // Disable body parser to handle file uploads
//   },
// };

// export default handler;
