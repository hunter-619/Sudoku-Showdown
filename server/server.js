const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const Sudoku = require("./sudoku.js");
const io = new Server(server);

const port = 3000;

app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/main.html", (req, res) => {
  res.sendFile(__dirname + "/main.html");
});

let players = [];
let playingArr = [];

io.on("connection", (socket) => {
  console.log("User Connected");
  socket.on("disconnect", (reason) => {
    console.log(reason);
  });
  socket.on("Find", (user) => {
    if (user.username != null) {
      console.log("User: " + user.username);
      console.log("ID: " + user.id);
      players.push(user.username);

      if (players.length >= 2) {
        let p1obj = {
          p1name: players[0],
          p1grid: [],
        };
        let p2obj = {
          p2name: players[1],
          p2grid: [],
        };
        let obj = {
          p1: p1obj,
          p2: p2obj,
        };

        let sudoku = Sudoku.sudokuGen(29);
        obj.p1.p1grid = sudoku;
        obj.p2.p2grid = sudoku;

        playingArr.push(obj);
        players.splice(0, 2);
        io.emit("find", { allPlayers: playingArr, sudoku: sudoku });
      }
    }
  });

  // socket.on("input", (cell) => {});
});

server.listen(port, () => {
  console.log("Server connected at port: ", port);
});
