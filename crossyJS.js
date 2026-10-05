/*
 * crossyJS.js
 * Crossy Road style - mQuickJS
 * 320x240
 */

var W = 320;
var H = 240;

var BTN_B = 1;
var BTN_SELECT = 4;
var BTN_START = 8;
var BTN_UP = 16;
var BTN_LEFT = 64;
var BTN_RIGHT = 128;
var BTN_A = 256;

var gameState = "title";
var oldKeys = 0;

var score = 0;
var best = 0;

var playerX = 0;
var playerRow = 0;
var playerTargetX = 0;

var jump = 0;
var moveDelay = 0;

var cameraRow = 0;
var roadTime = 0;

var shake = 0;
var flash = 0;

var rows = [];
var particles = [];


/* =========================================================
   BASIC DRAW
   ========================================================= */

function fill(x, y, w, h, c) {
    try {
        ScreenDraw.fillRect(
            Math.floor(x),
            Math.floor(y),
            Math.floor(w),
            Math.floor(h),
            c
        );
    } catch (e) {}
}

function line(x1, y1, x2, y2, c) {
    try {
        ScreenDraw.drawLine(
            Math.floor(x1),
            Math.floor(y1),
            Math.floor(x2),
            Math.floor(y2),
            c
        );
    } catch (e) {}
}

function print(t, x, y, c) {
    try {
        if (ScreenDraw.drawText)
            ScreenDraw.drawText(String(t), Math.floor(x), Math.floor(y), c);
        else if (ScreenDraw.text8x8)
            ScreenDraw.text8x8(String(t), Math.floor(x), Math.floor(y), c);
    } catch (e) {}
}

function clear(c) {
    try {
        if (ScreenDraw.clear)
            ScreenDraw.clear(c);
        else
            fill(0, 0, W, H, c);
    } catch (e) {
        fill(0, 0, W, H, c);
    }
}

function present() {
    try {
        if (ScreenDraw.present)
            ScreenDraw.present();
    } catch (e) {}
}


/* =========================================================
   UTILS
   ========================================================= */

function random(a, b) {
    return a + Math.random() * (b - a);
}

function randomInt(a, b) {
    return Math.floor(random(a, b + 1));
}

function clamp(v, a, b) {
    if (v < a) return a;
    if (v > b) return b;
    return v;
}

function justPressed(keys, button) {
    return (keys & button) && !(oldKeys & button);
}


/* =========================================================
   WORLD
   ========================================================= */

function createRow(type, z) {

    var r = {
        type: type,
        z: z,
        speed: 0,
        objects: [],
        variant: randomInt(0, 2)
    };

    if (type === "road") {

        r.speed = random(0.45, 1.15);

        if (Math.random() < 0.5)
            r.speed *= -1;

        var cars = randomInt(1, 3);

        for (var i = 0; i < cars; i++) {

            r.objects.push({
                x: random(-2.5, 2.5),
                width: random(0.65, 1.0),
                type: randomInt(0, 4)
            });
        }
    }

    else if (type === "water") {

        r.speed = random(0.25, 0.55);

        if (Math.random() < 0.5)
            r.speed *= -1;

        var logs = randomInt(1, 3);

        for (var j = 0; j < logs; j++) {

            r.objects.push({
                x: random(-2.5, 2.5),
                width: random(1.0, 1.8)
            });
        }
    }

    else if (type === "grass") {

        var trees = randomInt(0, 2);

        for (var k = 0; k < trees; k++) {

            r.objects.push({
                x: random(-2.5, 2.5)
            });
        }
    }

    return r;
}


function generateWorld() {

    rows = [];

    for (var i = -8; i < 40; i++) {

        var type;

        if (i < 3) {

            type = "grass";

        } else {

            var p = Math.random();

            if (p < 0.46)
                type = "grass";
            else if (p < 0.78)
                type = "road";
            else
                type = "water";
        }

        rows.push(createRow(type, i));
    }
}


function getRow(n) {

    var index = n + 8;

    if (index < 0 || index >= rows.length)
        return null;

    return rows[index];
}


/* =========================================================
   PARTICLES
   ========================================================= */

function particle(x, y, color) {

    particles.push({
        x: x,
        y: y,
        vx: random(-1.5, 1.5),
        vy: random(-3, -0.5),
        life: randomInt(12, 25),
        color: color
    });
}


function updateParticles() {

    for (var i = particles.length - 1; i >= 0; i--) {

        var p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.vy += 0.12;

        p.life--;

        if (p.life <= 0)
            particles.splice(i, 1);
    }
}


/* =========================================================
   START
   ========================================================= */

function startGame() {

    score = 0;

    playerX = 0;
    playerTargetX = 0;
    playerRow = 0;

    jump = 0;
    moveDelay = 0;

    cameraRow = 0;

    roadTime = 0;

    shake = 0;
    flash = 0;

    particles = [];

    generateWorld();

    gameState = "game";
}


/* =========================================================
   PLAYER
   ========================================================= */

function movePlayer(dx, dz) {

    if (gameState !== "game")
        return;

    if (moveDelay > 0)
        return;

    if (dx !== 0) {

        playerTargetX += dx;

        playerTargetX =
            clamp(playerTargetX, -2, 2);
    }

    if (dz !== 0) {

        playerRow += dz;

        if (playerRow < 0)
            playerRow = 0;

        if (playerRow > 30)
            playerRow = 30;

        if (dz > 0) {

            score++;

            if (score > best)
                best = score;

            for (var i = 0; i < 5; i++)
                particle(160, 155, 0xffffff);
        }
    }

    jump = 5;
    moveDelay = 5;

    if (playerRow > cameraRow + 5)
        cameraRow = playerRow - 5;
}


/* =========================================================
   COLLISION
   ========================================================= */

function normalizeX(x) {

    while (x < -3)
        x += 6;

    while (x > 3)
        x -= 6;

    return x;
}


function carCollision(row) {

    if (!row)
        return false;

    if (row.type !== "road")
        return false;

    for (var i = 0; i < row.objects.length; i++) {

        var car = row.objects[i];

        var x =
            car.x +
            row.speed *
            roadTime *
            0.004;

        x = normalizeX(x);

        if (
            Math.abs(x - playerX) <
            car.width * 0.55 + 0.27
        ) {

            return true;
        }
    }

    return false;
}


function onLog(row) {

    if (!row)
        return false;

    if (row.type !== "water")
        return false;

    for (var i = 0; i < row.objects.length; i++) {

        var log = row.objects[i];

        var x =
            log.x +
            row.speed *
            roadTime *
            0.008;

        x = normalizeX(x);

        if (
            Math.abs(x - playerX) <
            log.width * 0.55 + 0.25
        ) {

            return true;
        }
    }

    return false;
}


/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {

    gameState = "dead";

    shake = 10;
    flash = 10;

    for (var i = 0; i < 20; i++) {

        particle(
            160,
            150,
            i % 2 ?
            0xffd34d :
            0xffffff
        );
    }
}


/* =========================================================
   UPDATE GAME
   ========================================================= */

function updateGame() {

    if (moveDelay > 0)
        moveDelay--;

    if (Math.abs(playerTargetX - playerX) > 0.01) {

        playerX +=
            (playerTargetX - playerX) *
            0.28;
    }

    if (jump > 0)
        jump--;

    roadTime++;

    for (var i = 0; i < rows.length; i++) {

        var r = rows[i];

        if (
            r.type === "road" ||
            r.type === "water"
        ) {

            for (
                var j = 0;
                j < r.objects.length;
                j++
            ) {

                var o = r.objects[j];

                o.x +=
                    r.speed *
                    0.004;

                if (o.x < -3.3)
                    o.x = 3.3;

                if (o.x > 3.3)
                    o.x = -3.3;
            }
        }
    }

    var row = getRow(playerRow);

    /*
     * Player is airborne during jump,
     * so collision is checked after landing.
     */

    if (row && jump === 0) {

        if (
            row.type === "road" &&
            carCollision(row)
        ) {

            gameOver();
        }

        else if (
            row.type === "water" &&
            !onLog(row)
        ) {

            gameOver();
        }
    }

    updateParticles();

    if (shake > 0)
        shake--;

    if (flash > 0)
        flash--;
}


/* =========================================================
   3D PROJECTION
   ========================================================= */

function projectRow(rowNumber) {

    var relative =
        rowNumber -
        cameraRow;

    var y =
        156 -
        relative * 13;

    var scale =
        1 -
        relative * 0.055;

    scale =
        clamp(scale, 0.42, 1.35);

    return {
        y: y,
        scale: scale
    };
}


/* =========================================================
   TREE
   ========================================================= */

function drawTree(x, y, s) {

    /* shadow */

    fill(
        x - s * 0.55,
        y + 1,
        s * 1.1,
        s * 0.18,
        0x315a35
    );

    /* trunk */

    fill(
        x - s * 0.12,
        y - s * 0.55,
        s * 0.24,
        s * 0.65,
        0x7a4c29
    );

    /* foliage */

    fill(
        x - s * 0.5,
        y - s * 1.1,
        s,
        s * 0.7,
        0x238347
    );

    fill(
        x - s * 0.36,
        y - s * 1.35,
        s * 0.72,
        s * 0.55,
        0x35a052
    );

    fill(
        x - s * 0.18,
        y - s * 1.55,
        s * 0.36,
        s * 0.35,
        0x4fbd5b
    );
}


/* =========================================================
   CAR
   ========================================================= */

function drawCar(x, y, s, color) {

    /* shadow */

    fill(
        x - s * 0.75,
        y + s * 0.10,
        s * 1.5,
        s * 0.22,
        0x252525
    );

    /* wheels */

    fill(
        x - s * 0.75,
        y - s * 0.02,
        s * 0.28,
        s * 0.32,
        0x111111
    );

    fill(
        x + s * 0.47,
        y - s * 0.02,
        s * 0.28,
        s * 0.32,
        0x111111
    );

    /* body */

    fill(
        x - s * 0.65,
        y - s * 0.35,
        s * 1.3,
        s * 0.48,
        color
    );

    /* cabin */

    fill(
        x - s * 0.42,
        y - s * 0.68,
        s * 0.84,
        s * 0.40,
        color
    );

    /* windows */

    fill(
        x - s * 0.30,
        y - s * 0.60,
        s * 0.25,
        s * 0.20,
        0x8dd4e8
    );

    fill(
        x + s * 0.05,
        y - s * 0.60,
        s * 0.25,
        s * 0.20,
        0x8dd4e8
    );

    /* lights */

    fill(
        x - s * 0.62,
        y - s * 0.22,
        s * 0.12,
        s * 0.12,
        0xfff0a0
    );

    fill(
        x + s * 0.50,
        y - s * 0.22,
        s * 0.12,
        s * 0.12,
        0xff3b30
    );
}


/* =========================================================
   LOG
   ========================================================= */

function drawLog(x, y, s) {

    fill(
        x - s * 0.85,
        y - s * 0.16,
        s * 1.7,
        s * 0.32,
        0x784722
    );

    fill(
        x - s * 0.70,
        y - s * 0.13,
        s * 1.4,
        s * 0.15,
        0x9d6333
    );

    fill(
        x - s * 0.86,
        y - s * 0.17,
        s * 0.16,
        s * 0.34,
        0xb77a43
    );

    fill(
        x + s * 0.70,
        y - s * 0.17,
        s * 0.16,
        s * 0.34,
        0xb77a43
    );
}


/* =========================================================
   PLAYER - FAKE 3D
   ========================================================= */

function drawPlayer() {

    var x =
        160 +
        playerX * 42;

    var y = 154;

    if (jump > 0) {

        var t =
            (5 - jump) / 5;

        y -=
            Math.sin(t * Math.PI) *
            22;
    }

    var s = 18;

    /* shadow */

    fill(
        x - s * 0.55,
        y + 2,
        s * 1.1,
        s * 0.2,
        0x333333
    );

    /* body */

    fill(
        x - s * 0.48,
        y - s * 0.60,
        s * 0.96,
        s * 0.78,
        0xf2c94c
    );

    /* 3D top */

    line(
        x - s * 0.48,
        y - s * 0.60,
        x,
        y - s * 0.88,
        0xffe17b
    );

    line(
        x,
        y - s * 0.88,
        x + s * 0.48,
        y - s * 0.60,
        0xffe17b
    );

    line(
        x - s * 0.48,
        y - s * 0.60,
        x,
        y - s * 0.40,
        0xd5a51c
    );

    line(
        x + s * 0.48,
        y - s * 0.60,
        x,
        y - s * 0.40,
        0xd5a51c
    );

    /* eyes */

    fill(
        x - s * 0.24,
        y - s * 0.44,
        s * 0.11,
        s * 0.11,
        0x202020
    );

    fill(
        x + s * 0.13,
        y - s * 0.44,
        s * 0.11,
        s * 0.11,
        0x202020
    );

    /* beak */

    fill(
        x - s * 0.10,
        y - s * 0.25,
        s * 0.20,
        s * 0.10,
        0xf28c28
    );
}


/* =========================================================
   WORLD DRAW
   ========================================================= */

function drawWorld() {

    clear(0x78c8e8);

    /*
     * SKY
     */

    fill(
        0,
        0,
        W,
        90,
        0x72c4e7
    );

    /*
     * DISTANT HILLS
     */

    for (var h = 0; h < 5; h++) {

        var hx =
            h * 80 -
            35;

        line(
            hx,
            94,
            hx + 40,
            65,
            0x6cad70
        );

        line(
            hx + 40,
            65,
            hx + 85,
            94,
            0x6cad70
        );
    }


    /*
     * WORLD
     */

    for (
        var rowNumber = 32;
        rowNumber >= -5;
        rowNumber--
    ) {

        var row =
            getRow(rowNumber);

        if (!row)
            continue;

        var projection =
            projectRow(rowNumber);

        var y =
            projection.y;

        var scale =
            projection.scale;


        /*
         * GRASS
         */

        if (row.type === "grass") {

            fill(
                0,
                y - 8,
                W,
                17,
                row.variant === 0 ?
                0x63ad4e :
                0x5aa347
            );

            /* grass strips */

            for (
                var gx = 0;
                gx < W;
                gx += 24
            ) {

                line(
                    gx,
                    y + 5,
                    gx + 5,
                    y + 2,
                    0x77bd5a
                );
            }
        }


        /*
         * ROAD
         */

        else if (row.type === "road") {

            fill(
                0,
                y - 8,
                W,
                17,
                0x4d5055
            );

            line(
                0,
                y - 8,
                W,
                y - 8,
                0x34373b
            );

            line(
                0,
                y + 8,
                W,
                y + 8,
                0x34373b
            );

            for (
                var rx = -30;
                rx < 350;
                rx += 42
            ) {

                var offset =
                    (roadTime * 0.5) % 42;

                fill(
                    rx + offset,
                    y - 1,
                    22,
                    2,
                    0xd8c76b
                );
            }
        }


        /*
         * WATER
         */

        else if (row.type === "water") {

            fill(
                0,
                y - 8,
                W,
                17,
                0x318db7
            );

            for (
                var wx = -20;
                wx < 340;
                wx += 32
            ) {

                var waterOffset =
                    (roadTime * 0.3) % 32;

                line(
                    wx + waterOffset,
                    y - 3,
                    wx + 13 + waterOffset,
                    y - 3,
                    0x61c5df
                );

                line(
                    wx + 8 + waterOffset,
                    y + 4,
                    wx + 23 + waterOffset,
                    y + 4,
                    0x54b8d5
                );
            }
        }


        /*
         * OBJECTS
         */

        for (
            var o = 0;
            o < row.objects.length;
            o++
        ) {

            var obj =
                row.objects[o];

            var ox =
                160 +
                obj.x *
                42 *
                scale;

            if (row.type === "road") {

                var colors = [
                    0xe34b45,
                    0xf2c94c,
                    0x4d8fe8,
                    0xe27d32,
                    0xd95aa5
                ];

                drawCar(
                    ox,
                    y,
                    scale * 16,
                    colors[obj.type]
                );
            }

            else if (
                row.type === "water"
            ) {

                drawLog(
                    ox,
                    y,
                    scale * 22
                );
            }

            else if (
                row.type === "grass"
            ) {

                drawTree(
                    ox,
                    y,
                    scale * 15
                );
            }
        }
    }


    /*
     * PLAYER
     */

    drawPlayer();


    /*
     * PARTICLES
     */

    for (
        var p = 0;
        p < particles.length;
        p++
    ) {

        var part =
            particles[p];

        fill(
            part.x,
            part.y,
            3,
            3,
            part.color
        );
    }


    /*
     * HUD
     */

    fill(
        7,
        7,
        95,
        27,
        0x20252a
    );

    print(
        "SCORE " + score,
        13,
        12,
        0xffffff
    );

    print(
        "BEST  " + best,
        13,
        22,
        0xf6d365
    );


    /*
     * PAUSE BUTTON
     */

    fill(
        267,
        7,
        46,
        27,
        0x20252a
    );

    print(
        "II",
        285,
        13,
        0xffffff
    );


    /*
     * SCREEN SHAKE
     */

    if (shake > 0) {

        line(
            0,
            0,
            W,
            0,
            0xffffff
        );

        line(
            0,
            H - 1,
            W,
            H - 1,
            0xffffff
        );
    }

    if (flash > 0) {

        line(
            0,
            0,
            W,
            0,
            0xffffff
        );
    }
}


/* =========================================================
   TITLE
   ========================================================= */

function drawTitle() {

    clear(0x78c8e8);

    /*
     * hills
     */

    line(
        0,
        145,
        55,
        105,
        0x6cad70
    );

    line(
        55,
        105,
        120,
        145,
        0x6cad70
    );

    line(
        100,
        145,
        170,
        95,
        0x6cad70
    );

    line(
        170,
        95,
        245,
        145,
        0x6cad70
    );


    /*
     * logo blocks
     */

    drawPlayer();

    print(
        "CROSSY",
        93,
        43,
        0xffffff
    );

    print(
        "JS",
        145,
        67,
        0xf6d365
    );


    /*
     * start button
     */

    fill(
        78,
        105,
        164,
        37,
        0x20252a
    );

    print(
        "PRESS A TO START",
        100,
        117,
        0xffffff
    );


    print(
        "D-PAD  MOVE",
        105,
        168,
        0x18384c
    );

    print(
        "START  PAUSE",
        105,
        181,
        0x18384c
    );

    print(
        "BEST " + best,
        132,
        205,
        0xffffff
    );


    fill(
        0,
        232,
        W,
        8,
        0x2c6b3d
    );
}


/* =========================================================
   PAUSE
   ========================================================= */

function drawPause() {

    fill(
        58,
        64,
        204,
        112,
        0x20252a
    );

    print(
        "PAUSED",
        125,
        81,
        0xffffff
    );

    print(
        "A  RESUME",
        108,
        105,
        0xf6d365
    );

    print(
        "START  RESUME",
        96,
        122,
        0xffffff
    );

    print(
        "B  TITLE",
        112,
        140,
        0x9ed8ef
    );
}


/* =========================================================
   GAME OVER
   ========================================================= */

function drawGameOver() {

    fill(
        47,
        55,
        226,
        130,
        0x20252a
    );

    print(
        "GAME OVER",
        106,
        73,
        0xe34b45
    );

    print(
        "SCORE  " + score,
        112,
        98,
        0xffffff
    );

    print(
        "BEST   " + best,
        112,
        115,
        0xf6d365
    );

    print(
        "A  RETRY",
        116,
        140,
        0xffffff
    );

    print(
        "B  TITLE",
        116,
        158,
        0x9ed8ef
    );
}


/* =========================================================
   MAIN UPDATE
   ========================================================= */

function update(keys) {

    if (gameState === "title") {

        if (
            justPressed(keys, BTN_A) ||
            justPressed(keys, BTN_START)
        ) {

            startGame();
        }
    }


    else if (gameState === "game") {

        if (
            justPressed(keys, BTN_START)
        ) {

            gameState = "pause";
        }

        else if (
            justPressed(keys, BTN_B)
        ) {

            gameState = "title";
        }

        else if (
            justPressed(keys, BTN_UP)
        ) {

            movePlayer(0, 1);
        }

        else if (
            justPressed(keys, BTN_DOWN)
        ) {

            movePlayer(0, -1);
        }

        else if (
            justPressed(keys, BTN_LEFT)
        ) {

            movePlayer(-1, 0);
        }

        else if (
            justPressed(keys, BTN_RIGHT)
        ) {

            movePlayer(1, 0);
        }

        updateGame();
    }


    else if (gameState === "pause") {

        if (
            justPressed(keys, BTN_A) ||
            justPressed(keys, BTN_START)
        ) {

            gameState = "game";
        }

        else if (
            justPressed(keys, BTN_B)
        ) {

            gameState = "title";
        }
    }


    else if (gameState === "dead") {

        updateParticles();

        if (
            justPressed(keys, BTN_A)
        ) {

            startGame();
        }

        else if (
            justPressed(keys, BTN_B)
        ) {

            gameState = "title";
        }
    }

    oldKeys = keys;

    draw();
}


/* =========================================================
   INPUT
   ========================================================= */

function getKeys() {

    try {

        if (
            typeof getInputState === "function"
        ) {

            return getInputState() || 0;
        }

    } catch (e) {}


    try {

        if (
            typeof Input !== "undefined"
        ) {

            if (Input.getKeys)
                return Input.getKeys() || 0;

            if (Input.read)
                return Input.read() || 0;
        }

    } catch (e) {}

    return 0;
}


/* =========================================================
   MAIN LOOP
   ========================================================= */

function tick() {

    update(
        getKeys()
    );
}


generateWorld();


try {

    if (
        typeof setMainLoop === "function"
    ) {

        setMainLoop(tick);

    }

    else if (
        typeof setInterval === "function"
    ) {

        setInterval(
            tick,
            33
        );
    }

}

catch (e) {

    if (
        typeof setInterval === "function"
    ) {

        setInterval(
            tick,
            33
        );
    }
}


/* first frame */

draw();
