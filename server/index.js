const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const port = 8080;

const io = new Server(server, {
  cors: "*",
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("locationUpdate", (value) => {
    console.log(`update: ${JSON.stringify(value)}`);
    io.emit("locationUpdate", value);
  });
});

server.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
