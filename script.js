/* ============================================================
   SISTEMA DE AUDIO PROFESIONAL (AudioContext + Mixer)
============================================================ */

let audioCtx = null;
let globalVolume = 0.7; // 70%
let isMuted = false;
document.addEventListener("click", () => {
    initAudio();
}, { once: true });

const soundFiles = {
    jump: "sounds/jump.mp3",
    hit: "sounds/hit.mp3",
    point: "sounds/point.mp3",
    flap: "sounds/flap.mp3",
    run: "sounds/run.mp3",
    eat: "sounds/eat.mp3",
    move: "sounds/move.mp3",
    place: "sounds/place.mp3",
    win: "sounds/win.mp3",
    lose: "sounds/lose.mp3",
    click: "sounds/click.mp3",
    mine: "sounds/mine.mp3",
    correct: "sounds/correct.mp3",
    wrong: "sounds/wrong.mp3",
    tick: "sounds/tick.mp3"
};

const soundBuffers = {};

async function loadSound(name, url) {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    soundBuffers[name] = await audioCtx.decodeAudioData(arrayBuffer);
}

async function initAudio() {
    if (audioCtx) return;
    audioCtx = new AudioContext();

    for (const s in soundFiles) {
        await loadSound(s, soundFiles[s]);
    }
}

function playSound(name, volume = 1) {
    if (!audioCtx || isMuted) return;
    const source = audioCtx.createBufferSource();
    source.buffer = soundBuffers[name];

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = globalVolume * volume;

    source.connect(gainNode).connect(audioCtx.destination);
    source.start(0);
}

/* ============================================================
   BOTÓN DE SONIDO 🔊 / 🔇
============================================================ */

const soundBtn = document.getElementById("soundBtn");

soundBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    soundBtn.textContent = isMuted ? "🔇" : "🔊";
});

/* ============================================================
   SISTEMA DE NIVELES Y XP
============================================================ */

let nivel = parseInt(localStorage.getItem("nivel")) || 1;
let xp = parseInt(localStorage.getItem("xp")) || 0;

document.getElementById("nivel").textContent = nivel;
document.getElementById("xp").textContent = xp;

function ganarXP(cantidad) {
    xp += cantidad;
    document.getElementById("xp").textContent = xp;
    localStorage.setItem("xp", xp);

    if (xp >= nivel * 50) {
        nivel++;
        document.getElementById("nivel").textContent = nivel;
        localStorage.setItem("nivel", nivel);
        desbloquearBotones();
    }
}

function desbloquearBotones() {
    for (let i = 2; i <= nivel; i++) {
        const btn = document.getElementById("btn" + i);
        if (btn) btn.classList.remove("locked");
    }
}

desbloquearBotones();

/* ============================================================
   CAMBIO DE PANELES
============================================================ */

function mostrarNivel(n) {
    if (n > nivel) return;

    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    document.getElementById("nivel" + n).classList.add("active");

    initAudio(); // activa audio al entrar en un nivel
}

function volverMenu() {
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    document.getElementById("menu").classList.add("active");
}

/* ============================================================
   NIVEL 1 — ADIVINA EL NÚMERO
============================================================ */

let secreto = Math.floor(Math.random() * 10) + 1;

function comprobarNumero() {
    const num = parseInt(document.getElementById("num").value);
    const msg = document.getElementById("msg1");

    // Desbloquea el audio si aún no está activo
    initAudio();

    playSound("tick", 0.4);

    if (num === secreto) {
        msg.textContent = "¡Correcto!";
        playSound("correct");
        ganarXP(20);
        secreto = Math.floor(Math.random() * 10) + 1;
    } 
    else if (num < secreto) {
        msg.textContent = "Más alto";
        playSound("wrong");
    } 
    else {
        msg.textContent = "Más bajo";
        playSound("wrong");
    }
}


/* ============================================================
   NIVEL 2 — BUSCAMINAS
============================================================ */

const grid = document.getElementById("buscaminasGrid");
let size = 5;
let mines = 4;

function iniciarBuscaminas() {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${size}, 40px)`;

    let minePositions = new Set();
    while (minePositions.size < mines) {
        minePositions.add(Math.floor(Math.random() * size * size));
    }

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");

        if (minePositions.has(i)) {
            cell.dataset.mine = "1";
        }

        cell.addEventListener("click", () => {
            playSound("click", 0.5);

            if (cell.dataset.mine) {
                cell.classList.add("mine");
                playSound("mine");
                document.getElementById("msg2").textContent = "¡Has perdido!";
            } else {
                cell.classList.add("open");
                playSound("click", 0.3);
            }

            if (!cell.dataset.mine) {
                let abiertas = document.querySelectorAll(".cell.open").length;
                if (abiertas >= size * size - mines) {
                    playSound("win");
                    document.getElementById("msg2").textContent = "¡Ganaste!";
                    ganarXP(30);
                }
            }
        });

        grid.appendChild(cell);
    }
}

iniciarBuscaminas();

/* ============================================================
   NIVEL 3 — 3 EN RAYA
============================================================ */

const celdas = document.querySelectorAll(".tresCelda");
let turno = "X";

celdas.forEach(c => {
    c.addEventListener("click", () => {
        if (c.textContent !== "") return;

        c.textContent = turno;
        playSound("place");

        if (comprobarTres()) {
            playSound("win");
            document.getElementById("msg3").textContent = "¡Ganaste!";
            ganarXP(40);
            return;
        }

        turno = turno === "X" ? "O" : "X";
    });
});

function comprobarTres() {
    const t = [...celdas].map(c => c.textContent);
    const w = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    return w.some(([a,b,c]) => t[a] && t[a] === t[b] && t[b] === t[c]);
}

/* ============================================================
   NIVEL 4 — SNAKE
============================================================ */

const canvas = document.getElementById("snakeCanvas");
const ctx = canvas.getContext("2d");

let snake = [{x:200, y:200}];
let dir = {x:0, y:0};
let food = {x:100, y:100};

function gameSnake() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,400,400);

    snake.unshift({x: snake[0].x + dir.x, y: snake[0].y + dir.y});

    if (snake[0].x === food.x && snake[0].y === food.y) {
        playSound("eat");
        ganarXP(5);
        food.x = Math.floor(Math.random()*20)*20;
        food.y = Math.floor(Math.random()*20)*20;
    } else {
        snake.pop();
    }

    if (snake[0].x < 0 || snake[0].x >= 400 || snake[0].y < 0 || snake[0].y >= 400) {
        playSound("hit");
        snake = [{x:200,y:200}];
        dir = {x:0,y:0};
    }

    ctx.fillStyle = "#5ad1ff";
    snake.forEach(s => ctx.fillRect(s.x, s.y, 20, 20));

    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, 20, 20);
}

setInterval(gameSnake, 100);

document.addEventListener("keydown", e => {
    playSound("move", 0.2); // volumen bajo opcional

    if (e.key === "ArrowUp") dir = {x:0,y:-20};
    if (e.key === "ArrowDown") dir = {x:0,y:20};
    if (e.key === "ArrowLeft") dir = {x:-20,y:0};
    if (e.key === "ArrowRight") dir = {x:20,y:0};
});

/* ============================================================
   NIVEL 5 — FLAPPY BIRD
============================================================ */

let flappyRunning = false;
let birdY = 200;
let velocity = 0;
let gravity = 1.2;
let jumpStrength = -12;
let pipeX = 350;
let gap = 150;
let score = 0;

function gameFlappy() {
    velocity += gravity;
    birdY += velocity;

    document.getElementById("flappyBird").style.top = birdY + "px";

    pipeX -= 4;
    if (pipeX < -70) {
        pipeX = 350;
        score++;
        playSound("point");
        document.getElementById("flappyScore").textContent = score;
    }

    document.getElementById("pipeTop").style.left = pipeX + "px";
    document.getElementById("pipeBottom").style.left = pipeX + "px";

    if (birdY > 460 || birdY < 0) {
        playSound("hit");
        flappyRunning = false;
        score = 0;
    }
}

setInterval(() => {
    if (flappyRunning) gameFlappy();
}, 20);

document.getElementById("nivel5").addEventListener("click", () => {
    if (!flappyRunning) {
        flappyRunning = true;
        playSound("flap", 0.5);
        velocity = jumpStrength;
    } else {
        playSound("jump");
        velocity = jumpStrength;
    }
});

/* ============================================================
   NIVEL 6 — DINO RUNNER
============================================================ */

const dino = document.getElementById("dino");
const cactus = document.getElementById("cactus");

let dinoY = 0;
let dinoVel = 0;
let dinoGravity = 1;
let cactusX = 500;

function gameDino() {
    dinoVel += dinoGravity;
    dinoY += dinoVel;

    if (dinoY > 0) dinoY = 0;

    dino.style.bottom = (0 - dinoY) + "px";

    cactusX -= 6;
    if (cactusX < -30) {
        cactusX = 500;
        playSound("run", 0.2); // volumen bajo opcional
        ganarXP(2);
    }

    cactus.style.left = cactusX + "px";

    if (cactusX < 90 && cactusX > 50 && dinoY > -40) {
        playSound("hit");
        cactusX = 500;
    }
}

setInterval(gameDino, 20);

document.getElementById("nivel6").addEventListener("click", () => {
    if (dinoY === 0) {
        dinoVel = -15;
        playSound("jump");
    }
});

/* ============================================================
   REINICIAR PROGRESO
============================================================ */

function reiniciarProgreso() {
    localStorage.clear();
    location.reload();
}
