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

const showTime = (seconds) =>
  new Date(seconds * 1000).toISOString().substring(11, 19);

const startTimer = (io, seconds) => {
  timer = setInterval(() => {
    seconds = seconds + 1;
    io.emit("Time", showTime(seconds));
  }, 1000);
};

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
          name: players[0],
          grid: Sudoku.newGrid(9),
        };
        let p2obj = {
          name: players[1],
          grid: Sudoku.newGrid(9),
        };
        let obj = {
          p1: p1obj,
          p2: p2obj,
          solution: [],
        };

        let sudoku = Sudoku.sudokuGen(3);
        obj.p1.grid = JSON.parse(JSON.stringify(sudoku.question));
        obj.p2.grid = JSON.parse(JSON.stringify(sudoku.question));
        obj.solution = sudoku.original;

        playingArr.push(obj);
        players.splice(0, 2);
        io.emit("find", { allPlayers: playingArr, sudoku: sudoku });
        startTimer(io, 0);
      }
    }
  });

  socket.on("input", (input) => {
    const foundObject = playingArr.find(
      (obj) =>
        obj.p1.name == `${input.username}` || obj.p2.name == `${input.username}`
    );

    console.log(input.username, input.row, input.col, input.value);

    foundObject.p1.name == `${input.username}`
      ? (foundObject.p1.grid[input.row][input.col] = input.value)
      : (foundObject.p2.grid[input.row][input.col] = input.value);

    if (Sudoku.compareGrids(foundObject.p1.grid, foundObject.solution)) {
      console.log(foundObject.p1.name);
      io.emit("Won", { winner: foundObject.p1.name });
    } else if (Sudoku.compareGrids(foundObject.p2.grid, foundObject.solution)) {
      console.log(foundObject.p2.name);
      io.emit("Won", { winner: foundObject.p2.name });
    }
  });
});

server.listen(port, () => {
  console.log("Server connected at port: ", port);
});
