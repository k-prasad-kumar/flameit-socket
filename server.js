import "dotenv/config";
import { app, server } from "./socket.js";

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log("Server started on port 3000");
});
