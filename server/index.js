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

let users = [];

io.on("connection", (socket) => {
  console.log("a user connected");
  users.push(socket.id);

  socket.on("locationUpdate", (value) => {
    io.emit("locationUpdate", value);

    // Send the client a list of all connected users
    io.emit("connectedUsers", users);
  });

  socket.on("disconnect", () => {
    users = users.filter((d) => d !== socket.id);
  });
});

server.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
