import { NextResponse } from "next/server";
import { Server } from "socket.io";

let io: Server | null = null;

export function GET() {
  if (!io) {
    console.log("⚡ WebSocket server created");

    io = new Server(3001, { cors: { origin: "*" } });

    io.on("connection", (socket) => {
      console.log("🟢 User connected to WebSocket");
      socket.on("disconnect", () => console.log("🔴 User disconnected"));
    });
  }

  return NextResponse.json({ message: "WebSocket Server Running" });
}
