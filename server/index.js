const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  // TODO: explicitly configure this for deployment domain
  cors: "*",
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("locationUpdate", (value) => {
    console.log(`update: ${JSON.stringify(value)}`);
    io.emit("locationUpdate", value);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
