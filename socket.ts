import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import "dotenv/config";

const clientUrl = process.env.CLIENT_URL;

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"],
  },
});

const userSocketMap: { [key: string]: string } = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    userSocketMap[userId as string] = socket.id;
    console.log("a user connected", userId, socket.id);
  }

  // Emit online users after updating the map
  io.emit("online-users", Object.keys(userSocketMap));

  socket.on("online-users", (userId) => {
    const receiverSocketId = userSocketMap[userId as string];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("online-users", Object.keys(userSocketMap));
    }
  });

  socket.on("typing", (data) => {
    data.forEach((p: string) => {
      const receiverSocketId = userSocketMap[p as string];
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit("typing", true);
      }
    });
  });

  socket.on("stopTyping", (data) => {
    data.forEach((p: string) => {
      const receiverSocketId = userSocketMap[p as string];
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit("stopTyping", false);
      }
    });
  });

  socket.on("newMessage", (data) => {
    const participants = data.conversationParticipants?.filter(
      (p: { userId: string; username: string; image: string }) => {
        return p.userId !== data.senderId;
      }
    );

    participants.forEach(
      (p: { userId: string; username: string; image: string }) => {
        const receiverSocketId = userSocketMap[p.userId as string];
        if (receiverSocketId) {
          socket.to(receiverSocketId).emit("newMessage", data);
        }
      }
    );
  });

  socket.on("notification", (data) => {
    data?.recivers?.forEach((userId: string) => {
      const receiverSocketId = userSocketMap[userId as string];
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit("notification", data);
      }
    });
  });

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId as string];
    }

    // Emit online users after updating the map
    io.emit("online-users", Object.keys(userSocketMap));

    console.log("user disconnected");
  });
});

export { app, server, io };
