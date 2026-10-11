'use strict';

/*
 * ============================================================
 * CROSSY JS
 * Crossy Road style game cho GB300 / mQuickJS
 *
 * Độ phân giải: 320x240
 *
 * UP    = đi lên
 * DOWN  = đi xuống
 * LEFT  = sang trái
 * RIGHT = sang phải
 * A     = bắt đầu / chơi lại
 * START = pause
 * B     = về menu
 * SELECT = thoát game
 * ============================================================
 */


/* ============================================================
   1. CẤU HÌNH
   ============================================================ */

var SW = 320;
var SH = 240;
var RUNNING = true;


/* ============================================================
   2. INPUT GB300
   ============================================================ */

var BTN_B = 1;
var BTN_Y = 2;
var BTN_SELECT = 4;
var BTN_START = 8;

var BTN_UP = 16;
var BTN_DOWN = 32;
var BTN_LEFT = 64;
var BTN_RIGHT = 128;

var BTN_A = 256;
var BTN_X = 512;
var BTN_L = 1024;
var BTN_R = 2048;


/* ============================================================
   3. TRẠNG THÁI GAME
   ============================================================ */

var STATE_MENU = 0;
var STATE_GAME = 1;
var STATE_PAUSE = 2;
var STATE_OVER = 3;

var state = STATE_MENU;

var score = 0;
var bestScore = 0;

var gameTime = 0;
var moveCooldown = 0;

var lastInput = 0;

var cameraRow = 0;


/* ============================================================
   4. PLAYER
   ============================================================ */

var player = {

    x: 0,
    targetX: 0,

    row: 0,

    jump: 0,

    jumpTime: 0,

    alive: true,

    update: function(dt) {

        if (this.x < this.targetX)
            this.x += 7 * dt;

        if (this.x > this.targetX)
            this.x -= 7 * dt;

        if (Math.abs(this.x - this.targetX) < 0.03)
            this.x = this.targetX;

        if (this.jump > 0) {

            this.jumpTime += dt;

            if (this.jumpTime >= 0.20) {

                this.jump = 0;
                this.jumpTime = 0;
            }
        }
    },

    draw: function() {

        var px =
            160 +
            this.x * 42;

        var py = 165;

        /*
         * Nhảy giả 3D
         */

        if (this.jump > 0) {

            var t =
                this.jumpTime / 0.20;

            py -=
                Math.sin(t * Math.PI) * 24;
        }

        px = px | 0;
        py = py | 0;


        /*
         * Bóng
         */

        ScreenDraw.fillRect(
            px - 11,
            py + 2,
            22,
            5,
            0x55333333
        );


        /*
         * Thân
         */

        ScreenDraw.fillRect(
            px - 10,
            py - 20,
            20,
            20,
            0xFFFFD34D
        );


        /*
         * Mặt 3D phía trên
         */

        ScreenDraw.fillRect(
            px - 7,
            py - 23,
            14,
            4,
            0xFFFFE889
        );


        /*
         * Mặt bên
         */

        ScreenDraw.fillRect(
            px + 7,
            py - 18,
            3,
            17,
            0xFFD49D18
        );


        /*
         * Mắt
         */

        ScreenDraw.fillRect(
            px - 6,
            py - 15,
            4,
            5,
            0xFF202020
        );

        ScreenDraw.fillRect(
            px + 2,
            py - 15,
            4,
            5,
            0xFF202020
        );


        /*
         * Mỏ
         */

        ScreenDraw.fillRect(
            px - 2,
            py - 9,
            5,
            3,
            0xFFFF8C21
        );
    }
};


/* ============================================================
   5. WORLD ROW
   ============================================================ */

var rows = [];


function createRow(index) {

    var type;

    /*
     * Cứ vài hàng tạo các loại địa hình khác nhau
     */

    var randomValue =
        Math.random();

    if (index < 2) {

        type = 0;

    } else if (randomValue < 0.45) {

        type = 0;

    } else if (randomValue < 0.75) {

        type = 1;

    } else {

        type = 2;
    }


    var row = {

        index: index,

        type: type,

        speed:
            (0.5 + Math.random() * 0.8),

        direction:
            Math.random() < 0.5 ? -1 : 1,

        objects: []
    };


    /*
     * ROAD
     */

    if (type === 1) {

        var amount =
            1 + Math.floor(
                Math.random() * 3
            );

        for (var i = 0; i < amount; i++) {

            row.objects.push({

                x:
                    -2.8 +
                    Math.random() * 5.6,

                width:
                    0.65 +
                    Math.random() * 0.35,

                color:
                    Math.floor(
                        Math.random() * 5
                    )
            });
        }
    }


    /*
     * WATER
     */

    if (type === 2) {

        var logAmount =
            1 +
            Math.floor(
                Math.random() * 3
            );

        for (
            var j = 0;
            j < logAmount;
            j++
        ) {

            row.objects.push({

                x:
                    -2.8 +
                    Math.random() * 5.6,

                width:
                    0.9 +
                    Math.random() * 0.9
            });
        }
    }


    /*
     * GRASS
     */

    if (type === 0) {

        var treeAmount =
            Math.floor(
                Math.random() * 3
            );

        for (
            var k = 0;
            k < treeAmount;
            k++
        ) {

            row.objects.push({

                x:
                    -2.8 +
                    Math.random() * 5.6
            });
        }
    }


    return row;
}


/* ============================================================
   6. TẠO MAP
   ============================================================ */

function generateWorld() {

    rows = [];

    for (
        var i = -8;
        i < 45;
        i++
    ) {

        rows.push(
            createRow(i)
        );
    }
}


/* ============================================================
   7. LẤY ROW
   ============================================================ */

function getRow(number) {

    var index =
        number + 8;

    if (
        index < 0 ||
        index >= rows.length
    ) {

        return null;
    }

    return rows[index];
}


/* ============================================================
   8. RESET GAME
   ============================================================ */

function resetGame() {

    score = 0;

    gameTime = 0;

    moveCooldown = 0;

    cameraRow = 0;

    player.x = 0;
    player.targetX = 0;
    player.row = 0;

    player.jump = 0;
    player.jumpTime = 0;

    player.alive = true;

    generateWorld();

    state = STATE_GAME;
}


/* ============================================================
   9. DI CHUYỂN
   ============================================================ */

function movePlayer(dx, dy) {

    if (moveCooldown > 0)
        return;

    if (!player.alive)
        return;


    /*
     * Trái / phải
     */

    if (dx !== 0) {

        player.targetX += dx;

        if (player.targetX < -2)
            player.targetX = -2;

        if (player.targetX > 2)
            player.targetX = 2;
    }


    /*
     * Lên / xuống
     */

    if (dy !== 0) {

        player.row += dy;

        if (player.row < 0)
            player.row = 0;

        if (player.row > 35)
            player.row = 35;


        /*
         * Chỉ tăng điểm khi đi lên
         */

        if (dy > 0) {

            score++;

            if (score > bestScore)
                bestScore = score;
        }
    }


    /*
     * Animation nhảy
     */

    player.jump = 1;
    player.jumpTime = 0;

    moveCooldown = 0.10;


    /*
     * Camera đi theo player
     */

    if (
        player.row >
        cameraRow + 5
    ) {

        cameraRow =
            player.row - 5;
    }
}


/* ============================================================
   10. UPDATE XE / LOG
   ============================================================ */

function updateRows(dt) {

    for (
        var i = 0;
        i < rows.length;
        i++
    ) {

        var row = rows[i];

        if (
            row.type !== 1 &&
            row.type !== 2
        ) {

            continue;
        }


        for (
            var j = 0;
            j < row.objects.length;
            j++
        ) {

            var object =
                row.objects[j];


            object.x +=
                row.speed *
                row.direction *
                dt;


            if (object.x < -3.5)
                object.x = 3.5;

            if (object.x > 3.5)
                object.x = -3.5;
        }
    }
}


/* ============================================================
   11. KIỂM TRA XE
   ============================================================ */

function checkCarCollision(row) {

    if (!row)
        return false;

    if (row.type !== 1)
        return false;


    for (
        var i = 0;
        i < row.objects.length;
        i++
    ) {

        var car =
            row.objects[i];


        if (
            Math.abs(
                car.x - player.x
            )
            <
            car.width * 0.55 +
            0.28
        ) {

            return true;
        }
    }


    return false;
}


/* ============================================================
   12. KIỂM TRA LOG
   ============================================================ */

function checkLog(row) {

    if (!row)
        return false;

    if (row.type !== 2)
        return true;


    for (
        var i = 0;
        i < row.objects.length;
        i++
    ) {

        var log =
            row.objects[i];


        if (
            Math.abs(
                log.x - player.x
            )
            <
            log.width * 0.55 +
            0.20
        ) {

            return true;
        }
    }


    return false;
}


/* ============================================================
   13. GAME OVER
   ============================================================ */

function killPlayer() {

    player.alive = false;

    state = STATE_OVER;
}


/* ============================================================
   14. COLLISION UPDATE
   ============================================================ */

function checkWorldCollision() {

    /*
     * Khi đang nhảy không kiểm tra
     */

    if (player.jump > 0)
        return;


    var row =
        getRow(player.row);


    if (!row)
        return;


    /*
     * Đường
     */

    if (row.type === 1) {

        if (
            checkCarCollision(row)
        ) {

            killPlayer();

            return;
        }
    }


    /*
     * Nước
     */

    if (row.type === 2) {

        if (
            !checkLog(row)
        ) {

            killPlayer();

            return;
        }
    }
}


/* ============================================================
   15. VẼ CÂY
   ============================================================ */

function drawTree(x, y, scale) {

    var s =
        (scale * 15) | 0;


    /*
     * Bóng
     */

    ScreenDraw.fillRect(
        x - s,
        y,
        s * 2,
        4,
        0x55333333
    );


    /*
     * Thân
     */

    ScreenDraw.fillRect(
        x - 3,
        y - s,
        6,
        s,
        0xFF7B4A27
    );


    /*
     * Tán cây
     */

    ScreenDraw.fillRect(
        x - s,
        y - s * 2,
        s * 2,
        s,
        0xFF218447
    );

    ScreenDraw.fillRect(
        x - s + 4,
        y - s * 2 - 5,
        s * 2 - 8,
        8,
        0xFF36A653
    );

    ScreenDraw.fillRect(
        x - 6,
        y - s * 2 - 10,
        12,
        7,
        0xFF55BB5E
    );
}


/* ============================================================
   16. VẼ XE
   ============================================================ */

function drawCar(x, y, scale, color) {

    var s =
        (scale * 16) | 0;


    /*
     * Bóng
     */

    ScreenDraw.fillRect(
        x - s,
        y,
        s * 2,
        4,
        0x55333333
    );


    /*
     * Bánh
     */

    ScreenDraw.fillRect(
        x - s,
        y - 5,
        6,
        9,
        0xFF151515
    );

    ScreenDraw.fillRect(
        x + s - 6,
        y - 5,
        6,
        9,
        0xFF151515
    );


    /*
     * Thân xe
     */

    ScreenDraw.fillRect(
        x - s,
        y - 15,
        s * 2,
        12,
        color
    );


    /*
     * Cabin
     */

    ScreenDraw.fillRect(
        x - s + 5,
        y - 21,
        s * 2 - 10,
        8,
        color
    );


    /*
     * Kính
     */

    ScreenDraw.fillRect(
        x - s + 8,
        y - 19,
        7,
        5,
        0xFF8ED4E7
    );

    ScreenDraw.fillRect(
        x + 1,
        y - 19,
        7,
        5,
        0xFF8ED4E7
    );


    /*
     * Đèn
     */

    ScreenDraw.fillRect(
        x - s,
        y - 12,
        4,
        4,
        0xFFFFEE88
    );

    ScreenDraw.fillRect(
        x + s - 4,
        y - 12,
        4,
        4,
        0xFFFF4444
    );
}


/* ============================================================
   17. VẼ KHÚC GỖ
   ============================================================ */

function drawLog(x, y, scale) {

    var s =
        (scale * 22) | 0;


    ScreenDraw.fillRect(
        x - s,
        y - 6,
        s * 2,
        12,
        0xFF754421
    );


    ScreenDraw.fillRect(
        x - s + 3,
        y - 4,
        s * 2 - 6,
        4,
        0xFFA96938
    );


    /*
     * Đầu gỗ
     */

    ScreenDraw.fillRect(
        x - s,
        y - 5,
        5,
        10,
        0xFFB87B46
    );

    ScreenDraw.fillRect(
        x + s - 5,
        y - 5,
        5,
        10,
        0xFFB87B46
    );
}


/* ============================================================
   18. VẼ WORLD
   ============================================================ */

function drawWorld() {

    /*
     * Bầu trời
     */

    ScreenDraw.fillRect(
        0,
        0,
        SW,
        100,
        0xFF74C8E8
    );


    /*
     * Núi xa
     */

    ScreenDraw.fillRect(
        0,
        90,
        SW,
        25,
        0xFF72AC70
    );


    /*
     * Các row
     */

    for (
        var number = 38;
        number >= -8;
        number--
    ) {

        var row =
            getRow(number);

        if (!row)
            continue;


        var relative =
            number - cameraRow;


        var y =
            166 -
            relative * 13;


        var scale =
            1 -
            relative * 0.055;


        if (scale < 0.45)
            scale = 0.45;

        if (scale > 1.35)
            scale = 1.35;


        /*
         * GRASS
         */

        if (row.type === 0) {

            ScreenDraw.fillRect(
                0,
                y - 8,
                SW,
                17,
                0xFF5FA74E
            );


            /*
             * sọc cỏ
             */

            for (
                var gx = 0;
                gx < SW;
                gx += 25
            ) {

                ScreenDraw.fillRect(
                    gx,
                    y + 3,
                    8,
                    2,
                    0xFF73B85A
                );
            }
        }


        /*
         * ROAD
         */

        if (row.type === 1) {

            ScreenDraw.fillRect(
                0,
                y - 8,
                SW,
                17,
                0xFF4B4F54
            );


            /*
             * Mép đường
             */

            ScreenDraw.fillRect(
                0,
                y - 8,
                SW,
                2,
                0xFF303337
            );

            ScreenDraw.fillRect(
                0,
                y + 6,
                SW,
                2,
                0xFF303337
            );


            /*
             * Vạch đường
             */

            for (
                var rx = -30;
                rx < SW + 30;
                rx += 42
            ) {

                ScreenDraw.fillRect(
                    rx,
                    y - 1,
                    22,
                    2,
                    0xFFE0C95A
                );
            }
        }


        /*
         * WATER
         */

        if (row.type === 2) {

            ScreenDraw.fillRect(
                0,
                y - 8,
                SW,
                17,
                0xFF318DB7
            );


            /*
             * Sóng
             */

            for (
                var wx = 0;
                wx < SW;
                wx += 30
            ) {

                ScreenDraw.fillRect(
                    wx,
                    y - 4,
                    12,
                    2,
                    0xFF5DC4DF
                );

                ScreenDraw.fillRect(
                    wx + 10,
                    y + 3,
                    13,
                    2,
                    0xFF4EB5D2
                );
            }
        }


        /*
         * OBJECTS
         */

        for (
            var j = 0;
            j < row.objects.length;
            j++
        ) {

            var obj =
                row.objects[j];


            var ox =
                (160 +
                obj.x *
                42 *
                scale) | 0;


            if (row.type === 0) {

                drawTree(
                    ox,
                    y,
                    scale
                );
            }


            if (row.type === 1) {

                var carColors = [

                    0xFFE34B45,
                    0xFFF2C94C,
                    0xFF4D8FE8,
                    0xFFE27D32,
                    0xFFD95AA5

                ];


                drawCar(
                    ox,
                    y,
                    scale,
                    carColors[
                        obj.color
                    ]
                );
            }


            if (row.type === 2) {

                drawLog(
                    ox,
                    y,
                    scale
                );
            }
        }
    }


    /*
     * Player
     */

    player.draw();


    /*
     * HUD
     */

    ScreenDraw.fillRect(
        7,
        7,
        105,
        28,
        0xCC20252A
    );


    ScreenDraw.text8x8(
        13,
        12,
        "SCORE " + score,
        0xFFFFFFFF
    );

    ScreenDraw.text8x8(
        13,
        22,
        "BEST " + bestScore,
        0xFFFFD34D
    );
}


/* ============================================================
   19. MENU
   ============================================================ */

function drawMenu() {

    ScreenDraw.fillRect(
        0,
        0,
        SW,
        SH,
        0xFF74C8E8
    );


    /*
     * Background
     */

    ScreenDraw.fillRect(
        0,
        150,
        SW,
        90,
        0xFF5FA74E
    );


    /*
     * Đường
     */

    ScreenDraw.fillRect(
        0,
        170,
        SW,
        35,
        0xFF4B4F54
    );


    ScreenDraw.fillRect(
        0,
        187,
        SW,
        2,
        0xFFE0C95A
    );


    /*
     * Logo
     */

    ScreenDraw.text8x8(
        104,
        48,
        "CROSSY",
        0xFFFFFFFF
    );

    ScreenDraw.text8x8(
        143,
        66,
        "JS",
        0xFFFFD34D
    );


    /*
     * Con gà
     */

    player.x = 0;
    player.row = 0;
    player.jump = 0;

    player.draw();


    /*
     * Start button
     */

    ScreenDraw.fillRect(
        78,
        105,
        164,
        32,
        0xFF20252A
    );


    ScreenDraw.text8x8(
        104,
        117,
        "PRESS A",
        0xFFFFFFFF
    );


    ScreenDraw.text8x8(
        112,
        154,
        "D-PAD MOVE",
        0xFF18384C
    );

    ScreenDraw.text8x8(
        115,
        205,
        "BEST " + bestScore,
        0xFFFFFFFF
    );
}


/* ============================================================
   20. PAUSE
   ============================================================ */

function drawPause() {

    drawWorld();


    ScreenDraw.fillRect(
        55,
        65,
        210,
        105,
        0xEE20252A
    );


    ScreenDraw.text8x8(
        128,
        82,
        "PAUSED",
        0xFFFFFFFF
    );


    ScreenDraw.text8x8(
        103,
        106,
        "A RESUME",
        0xFFFFD34D
    );


    ScreenDraw.text8x8(
        100,
        124,
        "START RESUME",
        0xFFFFFFFF
    );


    ScreenDraw.text8x8(
        112,
        142,
        "B TITLE",
        0xFF8ED4E7
    );
}


/* ============================================================
   21. GAME OVER
   ============================================================ */

function drawGameOver() {

    ScreenDraw.fillRect(
        0,
        0,
        SW,
        SH,
        0xFF180B0B
    );


    ScreenDraw.text8x8(
        110,
        75,
        "GAME OVER",
        0xFFFF3333
    );


    ScreenDraw.text8x8(
        112,
        105,
        "SCORE " + score,
        0xFFFFFFFF
    );


    ScreenDraw.text8x8(
        112,
        123,
        "BEST " + bestScore,
        0xFFFFD34D
    );


    ScreenDraw.text8x8(
        112,
        151,
        "A RETRY",
        0xFFFFFFFF
    );


    ScreenDraw.text8x8(
        112,
        169,
        "B TITLE",
        0xFF8ED4E7
    );
}


/* ============================================================
   22. UPDATE
   ============================================================ */

function update(dt) {

    var input = 0;


    try {

        if (
            typeof getInputState !== "undefined"
        ) {

            input =
                getInputState();

        }

    } catch (e) {}


    /*
     * SELECT = thoát
     */

    if (
        input &
        BTN_SELECT
    ) {

        RUNNING = false;

        return;
    }


    /*
     * MENU
     */

    if (
        state === STATE_MENU
    ) {

        if (
            (input & BTN_A) &&
            !(lastInput & BTN_A)
        ) {

            resetGame();
        }
    }


    /*
     * GAME
     */

    else if (
        state === STATE_GAME
    ) {

        if (
            (input & BTN_START) &&
            !(lastInput & BTN_START)
        ) {

            state =
                STATE_PAUSE;
        }


        else if (
            (input & BTN_B) &&
            !(lastInput & BTN_B)
        ) {

            state =
                STATE_MENU;
        }


        else {

            /*
             * UP
             */

            if (
                (input & BTN_UP) &&
                !(lastInput & BTN_UP)
            ) {

                movePlayer(0, 1);
            }


            /*
             * DOWN
             */

            else if (
                (input & BTN_DOWN) &&
                !(lastInput & BTN_DOWN)
            ) {

                movePlayer(0, -1);
            }


            /*
             * LEFT
             */

            else if (
                (input & BTN_LEFT) &&
                !(lastInput & BTN_LEFT)
            ) {

                movePlayer(-1, 0);
            }


            /*
             * RIGHT
             */

            else if (
                (input & BTN_RIGHT) &&
                !(lastInput & BTN_RIGHT)
            ) {

                movePlayer(1, 0);
            }
        }


        if (moveCooldown > 0)
            moveCooldown -= dt;


        if (moveCooldown < 0)
            moveCooldown = 0;


        gameTime += dt;


        player.update(dt);

        updateRows(dt);

        checkWorldCollision();
    }


    /*
     * PAUSE
     */

    else if (
        state === STATE_PAUSE
    ) {

        if (
            (
                input &
                BTN_START
            ) &&
            !(
                lastInput &
                BTN_START
            )
        ) {

            state =
                STATE_GAME;
        }


        if (
            (
                input &
                BTN_A
            ) &&
            !(
                lastInput &
                BTN_A
            )
        ) {

            state =
                STATE_GAME;
        }


        if (
            (
                input &
                BTN_B
            ) &&
            !(
                lastInput &
                BTN_B
            )
        ) {

            state =
                STATE_MENU;
        }
    }


    /*
     * GAME OVER
     */

    else if (
        state === STATE_OVER
    ) {

        if (
            (
                input &
                BTN_A
            ) &&
            !(
                lastInput &
                BTN_A
            )
        ) {

            resetGame();
        }


        if (
            (
                input &
                BTN_B
            ) &&
            !(
                lastInput &
                BTN_B
            )
        ) {

            state =
                STATE_MENU;
        }
    }


    lastInput =
        input;
}


/* ============================================================
   23. RENDER
   ============================================================ */

function render() {

    if (
        typeof ScreenDraw === "undefined"
    ) {

        return;
    }


    if (
        state === STATE_MENU
    ) {

        drawMenu();
    }


    else if (
        state === STATE_GAME
    ) {

        drawWorld();
    }


    else if (
        state === STATE_PAUSE
    ) {

        drawPause();
    }


    else if (
        state === STATE_OVER
    ) {

        drawGameOver();
    }
}


/* ============================================================
   24. GAME LOOP
   ============================================================ */

var lastTime =
    Date.now();


function gameLoop() {

    if (!RUNNING)
        return;


    var now =
        Date.now();


    var dt =
        (now - lastTime) /
        1000;


    /*
     * Chống lag spike
     */

    if (dt > 0.1)
        dt = 0.1;


    if (dt < 0)
        dt = 0;


    lastTime =
        now;


    update(dt);

    render();


    /*
     * Đẩy frame lên màn hình
     */

    if (
        typeof video !== "undefined" &&
        video.present
    ) {

        video.present();

    }

    else if (
        typeof ScreenDraw !== "undefined" &&
        ScreenDraw.present
    ) {

        ScreenDraw.present();
    }
}


/* ============================================================
   25. KHỞI TẠO
   ============================================================ */

generateWorld();


/*
 * Dùng đúng cơ chế loop
 * của file mẫu bạn gửi
 */

if (
    typeof setMainLoop !== "undefined"
) {

    setMainLoop(
        gameLoop
    );

}

else if (
    typeof setInterval !== "undefined"
) {

    setInterval(
        gameLoop,
        33
    );
}
