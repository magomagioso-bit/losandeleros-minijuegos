const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let box = 20;
let snake = [{ x: 10 * box, y: 10 * box }];
let direction = "RIGHT";
let food = randomFood();
let score = 0;

document.addEventListener("keydown", changeDirection);

function changeDirection(e) {
  if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  else if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
}

function randomFood() {
  return {
    x: Math.floor(Math.random() * 20) * box,
    y: Math.floor(Math.random() * 20) * box
  };
}

function draw() {
  ctx.clearRect(0, 0, 400, 400);

  // Dibujar comida
  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, box, box);

  // Dibujar serpiente
  ctx.fillStyle = "#00ff66";
  snake.forEach(s => ctx.fillRect(s.x, s.y, box, box));

  // Movimiento
  let head = { ...snake[0] };

  if (direction === "UP") head.y -= box;
  if (direction === "DOWN") head.y += box;
  if (direction === "LEFT") head.x -= box;
  if (direction === "RIGHT") head.x += box;

  // Comer comida
  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById("score").textContent = "Puntuación: " + score;
    food = randomFood();
  } else {
    snake.pop();
  }

  // Colisión con paredes
  if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400) {
    alert("¡Has perdido!");
    document.location.reload();
  }

  // Colisión con sí mismo
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    alert("¡Has perdido!");
    document.location.reload();
  }

  snake.unshift(head);
}

setInterval(draw, 120);
