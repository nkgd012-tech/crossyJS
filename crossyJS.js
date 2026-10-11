
"use strict";

// Crossy Road - GB300 / mQuickJS
// 320x240 - ScreenDraw API

var W = 320, H = 240, TILE = 20;

var BTN_UP = 16;
var BTN_DOWN = 32;
var BTN_LEFT = 64;
var BTN_RIGHT = 128;
var BTN_A = 256;

var C = {
    grass: 0xFF83CF70,
    grass2: 0xFF76C263,
    road: 0xFF515761,
    line: 0xFFE8DDB2,
    water: 0xFF42A6D9,
    water2: 0xFF69C5EB,
    log: 0xFF9B6337,
    logLight: 0xFFC18A51,
    tree: 0xFF27834B,
    treeLight: 0xFF46AB60,
    trunk: 0xFF79502F,
    white: 0xFFFFFFFF,
    black: 0xFF20252B,
    yellow: 0xFFFFD34F,
    orange: 0xFFFFA52E,
    red: 0xFFE94D53,
    blue: 0xFF5597EC
};

var rows = [];
var player;
var score = 0;
var best = 0;
var maxProgress = 0;
var gameOver = false;
var frame = 0;
var camera = 0;
var previousButtons = 0;
var moveCooldown = 0;
var lastTime = Date.now();

function randomInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

function randomChoice(a) {
    return a[randomInt(0, a.length - 1)];
}

function rect(x, y, w, h, color) {
    x = Math.floor(x);
    y = Math.floor(y);
    w = Math.floor(w);
    h = Math.floor(h);

    if (w <= 0 || h <= 0) return;
    ScreenDraw.fillRect(x, y, w, h, color);
}

function text(x, y, value, color) {
    ScreenDraw.text8x8(
        Math.floor(x),
        Math.floor(y),
        String(value),
        color
    );
}

function newPlayer() {
    return {
        x: 160,
        y: 190,
        fromX: 160,
        fromY: 190,
        toX: 160,
        toY: 190,
        jumping: false,
        jump: 0,
        jumpLength: 100,
        alive: true
    };
}

function makeRow(y, forcedType) {
    var type = forcedType || randomChoice([
        "grass", "grass", "grass",
        "road", "road", "water"
    ]);

    var row = {
        y: y,
        type: type,
        objects: [],
        speed: randomChoice([-1, 1]) *
            (0.35 + Math.random() * 0.65),
        offset: randomInt(0, 40)
    };

    if (type === "road") {
        row.speed *= 1.6;

        for (var i = 0; i < 2; i++) {
            row.objects.push({
                x: randomInt(-100, W),
                w: randomInt(23, 34),
                color: randomChoice([
                    C.red, C.yellow, C.blue, C.white
                ])
            });
        }
    }

    if (type === "water") {
        for (var j = 0; j < 3; j++) {
            row.objects.push({
                x: j * 112 + randomInt(-10, 10),
                w: randomInt(43, 65)
            });
        }
    }

    if (type === "grass") {
        for (var k = 0; k < 5; k++) {
            if (Math.random() < 0.38) {
                row.objects.push({
                    x: randomInt(8, W - 8),
                    size: randomInt(8, 12)
                });
            }
        }
    }

    return row;
}

function resetGame() {
    rows = [];

    rows.push(makeRow(190, "grass"));
    rows.push(makeRow(170, "grass"));
    rows.push(makeRow(150, "grass"));
    rows.push(makeRow(130, "grass"));
    rows.push(makeRow(110, "grass"));

    for (var y = 90; y >= -180; y -= TILE) {
        rows.push(makeRow(y));
    }

    player = newPlayer();
    score = 0;
    maxProgress = 0;
    camera = 0;
    frame = 0;
    gameOver = false;
    moveCooldown = 0;
    previousButtons = 0;
}

function rowAt(y) {
    for (var i = 0; i < rows.length; i++) {
        if (y >= rows[i].y && y < rows[i].y + TILE) {
            return rows[i];
        }
    }
    return null;
}

// Hitbox cây: chặn di chuyển, không gây chết.
function blockedByTree(nx, ny) {
    var row = rowAt(ny);

    if (!row || row.type !== "grass") return false;

    for (var i = 0; i < row.objects.length; i++) {
        var tree = row.objects[i];

        // Thân cây rộng 10 pixel.
        var left = tree.x - 5;
        var right = tree.x + 5;

        // Hitbox gà rộng khoảng 10 pixel.
        if (nx + 5 > left && nx - 5 < right) {
            return true;
        }
    }

    return false;
}

function beginMove(dx, dy) {
    if (gameOver || player.jumping) return;

    var nx = player.x + dx * TILE;
    var ny = player.y + dy * TILE;

    if (nx < 10 || nx > W - 10) return;

    // Không cho gà đi xuyên qua thân cây.
    if (blockedByTree(nx, ny)) return;

    player.fromX = player.x;
    player.fromY = player.y;
    player.toX = nx;
    player.toY = ny;
    player.jump = 0;
    player.jumping = true;

    if (ny < 85) {
        var shift = 85 - ny;

        player.toY += shift;
        camera += shift;

        for (var j = 0; j < rows.length; j++) {
            rows[j].y += shift;
        }
    }
}

function inputUpdate() {
    if (typeof getInputState !== "function") return;

    var buttons = getInputState() || 0;
    var pressed = buttons & ~previousButtons;
    previousButtons = buttons;

    if (moveCooldown > 0) return;

    if (gameOver) {
        if (pressed & (
            BTN_UP | BTN_DOWN |
            BTN_LEFT | BTN_RIGHT | BTN_A
        )) {
            resetGame();
        }
        return;
    }

    if (pressed & BTN_UP) {
        beginMove(0, -1);
        moveCooldown = 5;
    } else if (pressed & BTN_DOWN) {
        beginMove(0, 1);
        moveCooldown = 5;
    } else if (pressed & BTN_LEFT) {
        beginMove(-1, 0);
        moveCooldown = 5;
    } else if (pressed & BTN_RIGHT) {
        beginMove(1, 0);
        moveCooldown = 5;
    } else if (pressed & BTN_A) {
        beginMove(0, -1);
        moveCooldown = 5;
    }
}

function updatePlayer(dt) {
    if (!player.jumping) return;

    player.jump += dt;

    var t = player.jump / player.jumpLength;
    if (t >= 1) t = 1;

    var smooth = t * t * (3 - 2 * t);

    player.x = player.fromX +
        (player.toX - player.fromX) * smooth;

    player.y = player.fromY +
        (player.toY - player.fromY) * smooth;

    if (t >= 1) {
        player.x = player.toX;
        player.y = player.toY;
        player.jumping = false;

        // Tính điểm bằng tiến trình thật, không dùng
        // tọa độ camera làm nguồn điểm trực tiếp.
        var progress = Math.floor(
            (190 + camera - player.y) / TILE
        );

        if (progress > maxProgress) {
            score += progress - maxProgress;
            maxProgress = progress;
        }
    }
}

function updateObjects(dt) {
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];

        if (row.type !== "road" && row.type !== "water") {
            continue;
        }

        for (var j = 0; j < row.objects.length; j++) {
            var obj = row.objects[j];

            obj.x += row.speed * dt * 0.055;

            if (row.speed > 0 && obj.x > W + 10) {
                obj.x = -obj.w - randomInt(10, 55);
            }

            if (row.speed < 0 && obj.x + obj.w < -10) {
                obj.x = W + randomInt(10, 55);
            }
        }
    }
}

function checkCollision(dt) {
    if (gameOver || player.jumping) return;

    var row = rowAt(player.y + 1);
    if (!row) return;

    var px = player.x;
    var py = player.y;

    if (row.type === "road") {
        for (var i = 0; i < row.objects.length; i++) {
            var car = row.objects[i];

            var hitX =
                px + 4 > car.x + 2 &&
                px - 4 < car.x + car.w - 2;

            var hitY =
                py + 5 > row.y + 2 &&
                py - 5 < row.y + TILE - 2;

            if (hitX && hitY) {
                gameOver = true;
                player.alive = false;
                return;
            }
        }
    }

    if (row.type === "water") {
        var foundLog = null;

        for (var j = 0; j < row.objects.length; j++) {
            var log = row.objects[j];

            if (px + 5 > log.x &&
                px - 5 < log.x + log.w) {
                foundLog = log;
                break;
            }
        }

        if (!foundLog) {
            gameOver = true;
            player.alive = false;
            return;
        }

        // Gà trôi cùng khúc gỗ.
        player.x += row.speed * dt * 0.055;

        if (player.x < -5 || player.x > W + 5) {
            gameOver = true;
            player.alive = false;
        }
    }

    // Cây không được xử lý như va chạm chết.
}

function updateWorld() {
    var highest = 99999;

    for (var i = 0; i < rows.length; i++) {
        if (rows[i].y < highest) highest = rows[i].y;
    }

    while (highest > -TILE) {
        highest -= TILE;
        rows.unshift(makeRow(highest));
    }

    for (var j = rows.length - 1; j >= 0; j--) {
        if (rows[j].y > H + TILE) {
            rows.splice(j, 1);
        }
    }
}

function update(dt) {
    frame++;

    if (dt > 50) dt = 50;
    if (dt < 0) dt = 0;

    if (moveCooldown > 0) moveCooldown--;

    inputUpdate();

    if (!gameOver) {
        updatePlayer(dt);
        updateObjects(dt);
        checkCollision(dt);
        updateWorld();
    }
}

// ---------------- DRAWING ----------------

function drawTree(x, y, size) {
    rect(x - 2, y + 3, 5, 9, C.trunk);

    rect(
        x - size / 2,
        y - size / 2,
        size,
        size,
        C.tree
    );

    rect(
        x - size / 2 + 3,
        y - size / 2 - 3,
        size - 5,
        size - 3,
        C.treeLight
    );

    rect(x - 2, y - size / 2 - 5, 5, 5, C.treeLight);
}

function drawGrass(row) {
    var base = Math.floor(row.y / TILE) % 2 === 0
        ? C.grass : C.grass2;

    rect(0, row.y, W, TILE, base);

    // Cỏ nhỏ trang trí.
    for (var x = row.offset; x < W; x += 37) {
        rect(x, row.y + 4, 3, 2, 0x557FFFFFF);
        rect(x + 5, row.y + 8, 2, 2, 0x557FFFFFF);
    }

    for (var i = 0; i < row.objects.length; i++) {
        var tree = row.objects[i];
        drawTree(tree.x, row.y + 9, tree.size);
    }
}

function drawRoad(row) {
    rect(0, row.y, W, TILE, C.road);

    for (var x = 0; x < W; x += 40) {
        rect(x + 4, row.y + 9, 20, 2, C.line);
    }

    for (var i = 0; i < row.objects.length; i++) {
        var car = row.objects[i];
        var x1 = car.x;

        rect(x1 + 4, row.y + 14, 6, 4, C.black);
        rect(x1 + car.w - 10, row.y + 14, 6, 4, C.black);

        rect(x1, row.y + 5, car.w, 11, car.color);
        rect(x1 + 5, row.y + 3, car.w - 10, 7, car.color);

        rect(x1 + 7, row.y + 5, 6, 4, 0xFFBDEBFF);
        rect(
            x1 + car.w - 13,
            row.y + 5,
            6,
            4,
            0xFFBDEBFF
        );

        rect(x1 + car.w - 2, row.y + 9, 2, 3, C.yellow);
    }
}

function drawWater(row) {
    rect(0, row.y, W, TILE, C.water);

    for (var x = 0; x < W; x += 35) {
        var rippleX = (x + frame * 0.3) % W;

        rect(rippleX, row.y + 3, 8, 2, C.water2);
        rect((rippleX + 17) % W, row.y + 15, 6, 2, C.water2);
    }

    for (var i = 0; i < row.objects.length; i++) {
        var log = row.objects[i];

        rect(log.x, row.y + 5, log.w, 12, C.log);
        rect(log.x + 3, row.y + 6, log.w - 6, 3, C.logLight);
        rect(log.x + 5, row.y + 12, log.w - 10, 2, C.trunk);

        rect(log.x + 2, row.y + 6, 2, 9, C.logLight);
        rect(
            log.x + log.w - 4,
            row.y + 6,
            2,
            9,
            C.logLight
        );
    }
}

function drawChicken(x, y) {
    // Bóng gà.
    rect(x - 6, y + 6, 12, 3, 0x55000000);

    // Chân.
    rect(x - 4, y + 5, 2, 4, C.orange);
    rect(x + 2, y + 5, 2, 4, C.orange);
    rect(x - 6, y + 8, 5, 2, C.orange);
    rect(x + 1, y + 8, 5, 2, C.orange);

    // Thân.
    rect(x - 6, y - 5, 12, 12, 0xFFFFFAEE);
    rect(x - 4, y - 7, 9, 3, C.white);
    rect(x - 7, y - 3, 3, 7, C.white);

    // Cánh.
    rect(x - 5, y, 4, 4, 0xFFEADCC5);

    // Mào.
    rect(x - 3, y - 10, 3, 4, C.red);
    rect(x, y - 12, 3, 6, C.red);
    rect(x + 3, y - 9, 2, 3, C.red);

    // Mỏ.
    rect(x + 5, y - 2, 5, 3, C.orange);
    rect(x + 7, y + 1, 3, 2, C.orange);

    // Mắt.
    rect(x + 2, y - 4, 2, 3, C.black);
    rect(x + 3, y - 4, 1, 1, C.white);
}

function drawHUD() {
    rect(5, 5, 70, 19, 0xDDFFFFFF);
    text(10, 10, "Score: " + score, C.black);
}

function drawGameOver() {
    rect(0, 0, W, H, 0x99000000);
    rect(66, 69, 188, 90, 0xFFFAFAFA);

    text(105, 83, "GAME OVER", C.red);
    text(111, 103, "Score: " + score, C.black);
    text(94, 121, "Best: " + best, C.black);
    text(76, 142, "Press a direction", C.black);
}

function render() {
    rect(0, 0, W, H, C.grass);

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];

        if (row.y + TILE < 0 || row.y > H) continue;

        if (row.type === "grass") {
            drawGrass(row);
        } else if (row.type === "road") {
            drawRoad(row);
        } else {
            drawWater(row);
        }
    }

    if (player.alive) {
        drawChicken(player.x, player.y);
    }

    drawHUD();

    if (gameOver) {
        drawGameOver();
    }

    if (typeof video !== "undefined" &&
        video && typeof video.present === "function") {
        video.present();
    } else if (typeof ScreenDraw.present === "function") {
        ScreenDraw.present();
    }
}

function gameLoop() {
    var now = Date.now();
    var dt = now - lastTime;
    lastTime = now;

    update(dt);
    render();
}

resetGame();

if (typeof setMainLoop === "function") {
    setMainLoop(gameLoop);
} else {
    setInterval(gameLoop, 33);
}
