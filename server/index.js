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

class GameState {
  constructor() {
    this._connectedUsers = [];
    this._clientPositions = {};
  }

  getConnectedUsers() {
    return this._connectedUsers;
  }

  getClientPositions() {
    return this._clientPositions;
  }

  addConnectedUser(id) {
    this._connectedUsers.push(id);
  }

  spawnPlayer(id) {
    this._clientPositions[id] = {
      position: [0, 10, 0],
      rotation: [0, 0, 0],
    };
  }

  updateClientPositions(newPosition) {
    this._clientPositions = { ...this._clientPositions, ...newPosition };
  }

  deletePlayer(socketId) {
    delete this._clientPositions[socketId];
    this._connectedUsers = this._connectedUsers.filter((id) => id !== socketId);
  }
}

app.get("/", (_, res) => {
  res.send(
    "I am a websocket server for a personal project - please be kind :)"
  );
});

const gameState = new GameState();

io.on("connection", (socket) => {
  console.log(
    `player ${socket.id} connected; there are ${io.engine.clientsCount} connected players`
  );

  gameState.addConnectedUser(socket.id);
  gameState.spawnPlayer(socket.id);

  // Send the client a list of all connected users
  io.emit(
    "introduction",
    gameState.getConnectedUsers(),
    gameState.getClientPositions()
  );

  socket.on("move", (location) => {
    gameState.updateClientPositions(location);
    io.emit("currentLocations", gameState.getClientPositions());
  });

  socket.on("disconnect", () => {
    console.log(
      `player ${socket.id} disconnected; there are ${io.engine.clientsCount} connected players`
    );

    gameState.deletePlayer(socket.id);
    io.emit("disconnectUser", socket.id, gameState.getConnectedUsers());
  });
});

server.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
