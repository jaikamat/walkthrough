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

let connectedUsers = [];
let clientPositions = {};

io.on("connection", (socket) => {
  console.log(
    `player ${socket.id} connected; there are ${io.engine.clientsCount} connected players`
  );
  connectedUsers.push(socket.id);

  // Spawn player at a location
  clientPositions[socket.id] = {
    position: [0, 10, 0],
    rotation: [0, 0, 0],
  };

  // Send the client a list of all connected users
  io.emit("introduction", connectedUsers, clientPositions);

  socket.on("move", (location) => {
    clientPositions = { ...clientPositions, ...location };
    io.emit("currentLocations", clientPositions);
  });

  socket.on("disconnect", () => {
    console.log(
      `player ${socket.id} disconnected; there are ${io.engine.clientsCount} connected players`
    );
    delete clientPositions[socket.id];
    io.emit("disconnectUser", socket.id);
    connectedUsers = connectedUsers.filter((d) => d !== socket.id);
  });
});

server.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
