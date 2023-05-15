const CONSTANT = {
  UNASSIGNED: 0,
  GRID_SIZE: 9,
  BOX_SIZE: 3,
  NUMBERS: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  LEVEL_NAME: ["Easy", "Medium", "Hard", "Very hard", "Insane", "Inhuman"],
  LEVEL: [29, 38, 47, 56, 65, 74],
};

let su = undefined;
let su_answer = undefined;
let level_index = 0;
let level = CONSTANT.LEVEL[level_index];
let selected_cell = -1;

let timer = null;
let seconds = 0;

document.getElementById("loading-gif").style.display = "none";
// document.getElementById("main-grid").style.display = "none";
document.querySelector(".users").classList.add("hide");
document.querySelector(".sudoku-container").classList.add("hide");

const socket = io.connect("http://localhost:3000");

const enterBtn = document.getElementById("btn-user");

let username;

enterBtn.addEventListener("click", (e) => {
  username = document.getElementById("username").value;
  document.getElementById("playerName").innerText = username;

  if (username == null || username == "") {
    alert("Enter Valid Name");
  } else {
    socket.emit("Find", { username: username, id: socket.id });

    document.getElementById("loading-gif").style.display = "block";
    document.getElementById("username").disabled = true;
  }
});

const cells = document.querySelectorAll(".main-grid-cell");

const number_inputs = document.querySelectorAll(".number");

const game_time = document.querySelector(".time");

const initGameGrid = () => {
  let index = 0;
  for (let i = 0; i < Math.pow(CONSTANT.GRID_SIZE, 2); i++) {
    let row = Math.floor(i / CONSTANT.GRID_SIZE);
    let col = i % CONSTANT.GRID_SIZE;
    if (row === 2 || row === 5) cells[index].style.marginBottom = "6px";
    if (col === 2 || col === 5) cells[index].style.marginRight = "6px";

    index++;
  }
};

const resetBg = () => {
  cells.forEach((e) => e.classList.remove("hover"));
};

const hoverBg = (index) => {
  let row = Math.floor(index / CONSTANT.GRID_SIZE);
  let col = index % CONSTANT.GRID_SIZE;

  let box_start_row = row - (row % CONSTANT.BOX_SIZE);
  let box_start_col = col - (col % CONSTANT.BOX_SIZE);

  // highlighting box
  for (let i = 0; i < CONSTANT.BOX_SIZE; i++) {
    for (let j = 0; j < CONSTANT.BOX_SIZE; j++) {
      let cell = cells[9 * (box_start_row + i) + (box_start_col + j)];
      cell.classList.add("hover");
    }
  }

  // highlighting columns
  let step = 9;
  while (index - step >= 0) {
    cells[index - step].classList.add("hover");
    step += 9;
  }

  step = 9;
  while (index + step < 81) {
    cells[index + step].classList.add("hover");
    step += 9;
  }

  // highlighting rows
  step = 1;
  while (index - step >= 9 * row) {
    cells[index - step].classList.add("hover");
    step += 1;
  }

  step = 1;
  while (index + step < 9 * row + 9) {
    cells[index + step].classList.add("hover");
    step += 1;
  }
};

const initNumberInputEvent = () => {
  number_inputs.forEach((e, index) => {
    e.addEventListener("click", () => {
      if (!cells[selected_cell].classList.contains("filled")) {
        cells[selected_cell].innerHTML = index + 1;
        cells[selected_cell].setAttribute("data-value", index + 1);
        // add to answer
        let row = Math.floor(selected_cell / CONSTANT.GRID_SIZE);
        let col = selected_cell % CONSTANT.GRID_SIZE;
        socket.emit("input", {
          username: username,
          row: row,
          col: col,
          value: index + 1,
        });
      }
    });
  });
};

const initCellsEvent = () => {
  cells.forEach((e, index) => {
    e.addEventListener("click", () => {
      if (!e.classList.contains("filled")) {
        cells.forEach((e) => e.classList.remove("selected"));
        selected_cell = index;
        e.classList.add("selected");
        resetBg();
        hoverBg(index);
      }
    });
  });
};

document.querySelector("#btn-del").addEventListener("click", () => {
  cells[selected_cell].innerHTML = "";
  cells[selected_cell].setAttribute("data-value", 0);

  // let row = Math.floor(selected_cell / CONSTANT.GRID_SIZE);
  // let col = selected_cell % CONSTANT.GRID_SIZE;
});

const showTime = (seconds) =>
  new Date(seconds * 1000).toISOString().substring(11, 19);

const startTimer = () => {
  showTime(seconds);

  timer = setInterval(() => {
    seconds = seconds + 1;
    game_time.innerHTML = showTime(seconds);
  }, 1000);
};

const init = () => {
  initGameGrid();
  initNumberInputEvent(number_inputs);
  initCellsEvent();
};

socket.on("find", (e) => {
  if (e != null) {
    let allPlayersArr = e.allPlayers;
    // console.log(allPlayersArr);

    if (username != "") {
      document.getElementById("loading-gif").style.display = "none";
      document.querySelector(".username").style.display = "none";
      document.querySelector(".users").classList.remove("hide");
      document.querySelector(".sudoku-container").classList.remove("hide");
    }

    let oppName;

    const foundObject = allPlayersArr.find(
      (obj) => obj.p1.name == `${username}` || obj.p2.name == `${username}`
    );
    foundObject.p1.name == `${username}`
      ? (oppName = foundObject.p2.name)
      : (oppName = foundObject.p1.name);

    // console.log(oppName, value);
    document.getElementById("oppName").innerText = oppName;

    let su = e.sudoku;

    init();
    // show sudoku to div
    for (let i = 0; i < Math.pow(CONSTANT.GRID_SIZE, 2); i++) {
      let row = Math.floor(i / CONSTANT.GRID_SIZE);
      let col = i % CONSTANT.GRID_SIZE;

      cells[i].setAttribute("data-value", su.question[row][col]);

      if (su.question[row][col] !== 0) {
        cells[i].classList.add("filled");
        cells[i].innerHTML = su.question[row][col];
      }
    }
    socket.on("Time", (timer) => {
      game_time.innerHTML = timer;
    });
  }
});

socket.on("Won", (e) => {
  alert(`${e.winner} Won The Game`);
});
