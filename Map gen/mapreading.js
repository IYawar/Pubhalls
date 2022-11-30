if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        value: function(callback, type, quality) {
            var canvas = this;
            setTimeout(function() {
                var binStr = atob(canvas.toDataURL(type, quality).split(',')[1]),
                    len = binStr.length,
                    arr = new Uint8Array(len);
                for (var i = 0; i < len; i++) {
                    arr[i] = binStr.charCodeAt(i);
                }

                callback(new Blob([arr], { type: type || 'image/png' }));
            });
        }
    });
}


class Room {
    constructor(num, x, y) {
        this.x = x;
        this.y = y;

        this.isBorder = num == 1;
        if (num < 500 && num > 250)
            this.isStart = true;

        else if (num > 500 && num < 750)
            this.isPot = true;
        else if (num > 750 && num < 999)
            this.isDefender = true;
        else if (num == 126)
            this.isTRoom = true;
        this.up = num % 2 == 1;
        this.down = num % 5 == 1;
        this.left = num % 7 == 1;
        this.right = num % 3 == 1;

        this.value = num;
    }

    get v() {
        return this.value;
    }
    serialize() {
        var output = `{"x":${this.x},"y":${this.y},"v":${this.value}}`;
        return output;
    }
    static deseralize(text) {
        var obj = JSON.parse(text);
        return new Room(obj.v, obj.x, obj.y);
    }
    get hassplits() {
        return this.up || this.down || this.left || this.right;
    }

    convert() {
        if (this.isBorder)
            return 25;
        if (!this.hassplits)
            return 0;
        if (this.isTRoom)
            return 16;
        if (this.isDefender) {
            if (this.up)
                return 17;
            if (this.right)
                return 18;
            if (this.down)
                return 19;
            if (this.left)
                return 20;
        }
        if (this.isPot) {
            if (this.up)
                return 21;
            if (this.right)
                return 22;
            if (this.down)
                return 23;
            if (this.left)
                return 24;
        }

        return (this.isStart ? 40 : 0) + (this.left << 3) | (this.down << 2) | (this.right << 1) | this.up;
    }
    static back(val, x, y) {
        var room = new Room(0, x, y);
        switch (val) {
            case 0:
                return room;
            case 16:
                room.down = true;
                room.isTRoom = true;
                return room;
            case 17:
                room.up = true;
                room.isDefender = true;
                return room;
            case 18:
                room.right = true;
                room.isDefender = true;
                return room;
            case 19:
                room.down = true;
                room.isDefender = true;
                return room;
            case 20:
                room.left = true;
                room.isDefender = true;
                return room;
            case 21:
                room.up = true;
                room.isPot = true;
                return room;
            case 22:
                room.right = true;
                room.isPot = true;
                return room;
            case 23:
                room.down = true;
                room.isPot = true;
                return room;
            case 24:
                room.left = true;
                room.isPot = true;
                return room;
            case 25:
                room.isBorder = true;
                return room;
        }
        if (val > 40) {
            room.isStart = true;
            room.isSeen = true;
            val -= 40;
        }
        room.up = !!(val & 0b0001);
        room.right = !!(val & 0b0010);
        room.down = !!(val & 0b0100);
        room.left = !!(val & 0b1000);
        return room;
    }
}
Room.flags = {
    empty: 0,
    room: 1,
    troom: 16,
    defender: {
        up: 17,
        right: 18,
        down: 19,
        left: 20
    },
    pot: {
        up: 21,
        right: 22,
        down: 23,
        left: 24
    },
    spawn: 25
}
Array.prototype.convert = function() {
    var str = this.reduce((a, v) => a + v.reduce((bi, room) => bi + String.fromCharCode(room.convert() + 65), ""), "");
    var out = "";
    while (str) {
        var count = 1;
        var char = str[0];
        str = str.substring(1);
        while (str && str[0] == char) {
            count++;
            str = str.substring(1);
        }
        if (count > 1) {
            out += count + "" + char;
        } else
            out += char;
    }
    return out;
}

String.prototype.revert = function() {
    var str = this.match(/(\d*\w)/gi).reduce((s, c) => s + (c.length == 1 ? c : c[c.length - 1].repeat(c.match(/\d+/)[0])), "");
    var arr = [];
    while (str) {
        arr.push(str.slice(0, 9));
        str = str.substring(9);
    }

    for (var i = 0; i < 9; i++) {
        var r = arr[i];
        var row = [];
        for (var j = 0; j < 9; j++) {
            row.push(Room.back(r.charCodeAt(j) - 65, i, j));
        }
        arr[i] = row;
    }
    return arr;
}

class Setting {
    constructor(group, type, key, name, value, disabled) {
        this.group = group;
        this.name = name;
        this.value = value;
        this.type = type;
        this.key = key;
        this.disabled = !!disabled;
    }
}
class Settings {
    constructor() {
        this.load();
        Settings.__change_events = [];
    }

    load() {
        this.defaults();

        if (localStorage.getItem("settings-version") != "1.1") {
            localStorage.removeItem("settings");
            this.save();
            localStorage.setItem("settings-version", "1.1");
            Settings.settingsChanged = true;
        } else {
            var settings = localStorage.getItem('settings');
            if (!!settings) {
                settings = JSON.parse(settings);
                for (var key in settings)
                    this[key] = settings[key];
            }
        }
    }
    save() {
        localStorage.setItem('settings', JSON.stringify(this));
        if (Settings.__change_events)
            for (var evt of Settings.__change_events)
                evt.paint();
    }

    onchange(lhmap) {
        Settings.__change_events.push(lhmap);
    }

    offchange(callback) {
        Settings.__change_events = Settings.__change_events.filter(evt => evt == callback);
    }

    defaults() {
        this.up1 = new Setting("Keybind", "key", "up1", "Up 1", 'ArrowUp');
        this.up2 = new Setting("Keybind", "key", "up2", "Up 2", 'w');
        this.down1 = new Setting("Keybind", "key", "down1", "Down 1", 'ArrowDown');
        this.down2 = new Setting("Keybind", "key", "down2", "Down 2", 's');
        this.left1 = new Setting("Keybind", "key", "left1", "Left 1", 'ArrowLeft');
        this.left2 = new Setting("Keybind", "key", "left2", "Left 2", 'a');
        this.right1 = new Setting("Keybind", "key", "right1", "Right 1", 'ArrowRight');
        this.right2 = new Setting("Keybind", "key", "right2", "Right 2", 'd');
        this.newmap = new Setting("Keybind", "key", "newmap", "Get New Map", 'n');
        this.showpots = new Setting("Keybind", "key", "showpots", "Show Pots", 'p');
        this.showborders = new Setting("Keybind", "key", "showborders", "Show Cutoffs & Shifts", 'b');
        this.showallrooms = new Setting("Keybind", "key", "showallrooms", "Show All Rooms", 'i');
        this.options = new Setting("Keybind", "key", "options", "Open Options", 'o');
        this.undo = new Setting("Keybind", "key", "undo", "Undo Last Action", "Backspace");
        this.showmain = new Setting("Keybind", "key", "showmain", "Show Main Path", 'm', true);
        this.togglemousepad = new Setting("Keybind", "key", "togglemousepad", "Toggle D-Pad", 'h');
        this.toggledpadcenterproc = new Setting("Keybind", "bool", "toggledpadcenterproc", "Toggle D-Pad Center Changing Map", true);
        this.showmousepad = new Setting("Visual", "bool", "showmousepad", "Show D-Pad", false);
        this.mousepadposition = new Setting("Visual", "position", "mousepadposition", "D-Pad Position", { top: 100, left: 100 }, true);
        this.cursor = new Setting("Visual", "color", "cursor", "Cursor Color", "#800080");
        this.highlight1 = new Setting("Visual", "color", "highlight1", "Highlight 1 (left-click)", "#00FFFF");
        this.highlight2 = new Setting("Visual", "color", "highlight2", "Highlight 2 (right-click)", "#FFD700");
        this.bordercol = new Setting("Visual", "color", "bordercol", "Cutoff & Shift Color", "#1a1a1a");
    }

    generateTable() {
        var table = document.createElement('table');

        var groups = Object.values(LHMap.settings).reduce((r, a) => {
            r[a.group] = [...r[a.group] || [], a];
            return r;
        }, {});

        for (var key in groups) {
            var group = groups[key];
            var title = key;

            var titlerow = document.createElement('tr');
            titlerow.classList.add("setting-title");
            var titlecell = document.createElement('td');
            titlecell.innerText = title;
            titlerow.appendChild(titlecell);

            titlerow.appendChild(document.createElement('td'))
            titlerow.appendChild(document.createElement('td'))
            table.appendChild(titlerow);
            for (var option in group) {
                option = group[option];
                if (option.disabled)
                    continue;
                var row = document.createElement('tr');
                var namecell = document.createElement('td');
                namecell.colSpan = 2;
                namecell.innerText = option.name;

                var datacell = document.createElement('td');
                var btn = document.createElement('input');
                row.dataset.key = option.key;
                row.addEventListener('click', function(e) { document.querySelector(`#settings-modal input[data-key=${this.dataset.key}]`).click() });

                btn.dataset.key = option.key;
                //btn.innerText = option.value;
                switch (option.type) {
                    case "key":
                        //modal listening to key press, [escape] disabling keybind until new key press
                        btn.type = "button";
                        btn.value = option.value.toUpperCase();
                        btn.id = "keybind-" + option.key;
                        btn.addEventListener('click', e => {
                            var modal = document.querySelector("#keybind-modal");
                            var opt = this[e.target.dataset.key];
                            modal.querySelector("h2 span").innerText = opt.name;
                            modal.querySelector(".modal-body").innerText = "Current Keybind: " + opt.value;
                            modal.dataset.key = e.target.dataset.key;
                            modal.style.display = "block";
                        })
                        break;
                    case "bool":
                        //use checkbox with styling
                        btn.type = "checkbox";
                        btn.checked = option.value;
                        btn.addEventListener('change', e => {
                            this[e.target.dataset.key].value = e.target.checked;
                            if (e.target.dataset.key == "showmousepad") {
                                document.getElementsByClassName("d-pad")[0].style.display = e.target.checked ? "block" : "none";
                            }
                            this.save();
                        })
                        break;
                    case "color":
                        btn.type = "color";
                        btn.value = option.value;
                        btn.addEventListener('change', e => {
                            this[e.target.dataset.key].value = e.target.value;
                            this.save();
                        });
                        break;
                    case "percent":
                        btn.type = "range";
                        btn.min = 0;
                        btn.max = 100;
                        btn.value = option.value * 100;
                        btn.addEventListener('input', e => {
                            this[e.target.dataset.key].value = e.target.value / 100;
                            this.save();
                        });
                }


                datacell.appendChild(btn);
                row.appendChild(namecell);
                row.appendChild(datacell);
                table.appendChild(row);
            }
        }
        return table;
    }
}

class LHMap {
    keyboard_listener(e) {
        if (document.querySelector("#settings-modal").style.display == "block")
            return;
        switch (e.key) {
            case LHMap.settings.up1.value:
            case LHMap.settings.up2.value:
                this.map.onUp();
                break;
            case LHMap.settings.down1.value:
            case LHMap.settings.down2.value:
                this.map.onDown();
                break;
            case LHMap.settings.left1.value:
            case LHMap.settings.left2.value:
                this.map.onLeft();
                break;
            case LHMap.settings.right1.value:
            case LHMap.settings.right2.value:
                this.map.onRight();
                break;
            case LHMap.settings.newmap.value:
                this.map.setup();
                break;
            case LHMap.settings.showpots.value:
                this.map.togglePots();
                break;
            case LHMap.settings.showborders.value:
                this.map.toggleBorders();
                break;
            case LHMap.settings.options.value:
                this.map.showOptions();
                break;
            case LHMap.settings.undo.value:
                this.map.undo();
                break;
            case LHMap.settings.showmain.value:
                this.map.toggleMainPath();
                break;
            case LHMap.settings.showallrooms.value:
                this.map.toggleAll();
                break;
            case LHMap.settings.togglemousepad.value:
                LHMap.settings.showmousepad.value = !LHMap.settings.showmousepad.value;
                document.getElementsByClassName("d-pad")[0].style.display = LHMap.settings.showmousepad.value ? "block" : "none";
                document.querySelector("#settings-modal input[type=checkbox][data-key=showmousepad]").checked = LHMap.settings.showmousepad.value;
                LHMap.settings.save();
                break;
        }
        this.map.paint();
    }

    onUp() {
        if (!this.current.up)
            return;

        this.setRoom(0, -1);
    }

    onDown() {
        if (!this.current.down)
            return;

        this.setRoom(0, 1);
    }

    onLeft() {
        if (!this.current.left)
            return;

        this.setRoom(-1, 0);
    }

    onRight() {
        if (!this.current.right)
            return;

        this.setRoom(1, 0);
    }

    showOptions() {
        var modal = document.getElementById("settings-modal");
        if (modal.style.display != "block")
            modal.style.display = "block";
        else
            modal.style.display = "none";
    }

    setRoom(offsetY, offsetX) {
        offsetX = offsetX || 0;
        offsetY = offsetY || 0;
        var n = this.rooms[this.current.x + offsetX][this.current.y + offsetY];
        if (n.isBorder)
            return;
        this.current = n;

        if (n.isDefender && !this.founddefender) {
            this.defendershit++;
            this.founddefender = true;
        }
        if ((n.isPot || n.isTRoom) && !this.foundpots.includes(n) && !this.founddefender) {
            this.potshit++;
            this.foundpots.push(n);
        }
        this.current.isSeen = true;
        this.history.push(this.current);
    }
    togglePots() {
        this.showpots = !this.showpots;
        this.founddefender = true;
        //if (this.defender.isSeen)
        //    return;

        //this.forceRatio();

    }

    toggleBorders() {
        this.showborders = !this.showborders;
    }

    toggleMainPath() {
        if (LHMap.debug)
            this.showmain = !this.showmain;
    }

    toggleAll() {
        this.showallrooms = !this.showallrooms;
        this.founddefender = true;
        //this.forceRatio(true);
    }

    /*forceRatio() {
        if (!this.founddefender)
        {

        }
        if (!ignorepots && !this.founddefender) {
            for (var k in this.pots) {
                var pot = this.pots[k];
                if (!this.foundpots.includes(pot)) {
                    this.foundpots.push(pot);
                    this.potshit++;
                }
            }
            if (!this.foundpots.includes(this.troom)) {
                this.foundpots.push(this.troom);
                this.potshit++;
            }
        }
        if (seedefender && !this.founddefender) {
            this.founddefender = true;
            this.defendershit++;
        }
    }*/

    /**
     * Paints to the context given. If none was given, prints to the canvas that belongs to this LHMap.
     * @param {CanvasRenderingContext2D?} ctx A 900 by 900 context to draw to. This will use the LHMap.canvas element if not provided.
     */
    paint(ctx) {

        ctx = ctx || this.canvas.getContext('2d');

        ctx.fillStyle = "hsl(0, 0%, 6.5%)";
        ctx.fillRect(0, 0, 900, 900);

        var shiftx = this.rooms[8][0].isBorder ? 50 : 0;
        var shifty = this.rooms[0][8].isBorder ? 50 : 0;

        if (this.showborders) {
            ctx.fillStyle = LHMap.settings.bordercol.value;
            if (this.start.x <= 3 - !!shiftx || this.start.x > 4) {
                ctx.fillRect(shifty, shiftx, 900 - 2 * shifty, 100);
                ctx.fillRect(shifty, 800 - shiftx, 900 - 2 * shifty, 100);
            }
            if (this.start.y <= 3 - !!shifty || this.start.y > 4) {
                ctx.fillRect(shifty, shiftx, 100, 900 - 2 * shiftx);
                ctx.fillRect(800 - shifty, shiftx, 100, 900 - 2 * shiftx);
            }
        }

        for (var x = 8; x >= 0; x--) {
            for (var y = 8; y >= 0; y--) {
                if (this.rooms[x][y].highlight) {
                    ctx.strokeStyle = this.rooms[x][y].highlight;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(100 * y + 3 + shifty, 100 * x + 3 + shiftx, 92, 92);
                }
            }
        }

        this.drawSplits(ctx, this.start.x, this.start.y, shiftx, shifty);

        var extend = 30;

        for (var x = 8; x >= 0; x--) {
            for (var y = 8; y >= 0; y--) {
                if (this.rooms[x][y].isSeen ||
                    (this.showallrooms && !this.rooms[x][y].isBorder && (this.rooms[x][y].up || this.rooms[x][y].down || this.rooms[x][y].left || this.rooms[x][y].right))) {
                    ctx.fillStyle = "hsl(0, 0%, 20%)";
                    ctx.fillRect(100 * y + 15 + shifty, 100 * x + 15 + shiftx, 70, 70);
                    ctx.fillStyle = "gray";
                    ctx.fillRect(100 * y + 20 + shifty, 100 * x + 20 + shiftx, 60, 60);

                    if (this.rooms[x][y].up) {
                        ctx.fillStyle = "hsl(0, 0%, 20%)";

                        var dist = extend;

                        ctx.fillRect(100 * y + (33 + shifty), 100 * x + shiftx + (15 - dist), 34, dist);
                        ctx.fillStyle = "#404040";
                        ctx.fillRect(100 * y + (38 + shifty), 100 * x + shiftx + (15 - dist), 24, dist + 5);
                    }
                    if (this.rooms[x][y].down) {
                        ctx.fillStyle = "hsl(0, 0%, 20%)";
                        var dist = extend;

                        ctx.fillRect(100 * y + (33 + shifty), 100 * x + (85 + shiftx), 34, dist);
                        ctx.fillStyle = "#404040";
                        ctx.fillRect(100 * y + (38 + shifty), 100 * x + (80 + shiftx), 24, dist + 5);

                    }
                    if (this.rooms[x][y].left) {
                        ctx.fillStyle = "hsl(0, 0%, 20%)";
                        var dist = extend;

                        ctx.fillRect(100 * y + shifty + (15 - dist), 100 * x + (33 + shiftx), dist, 34);
                        ctx.fillStyle = "#404040";
                        ctx.fillRect(100 * y + shifty + (15 - dist), 100 * x + (38 + shiftx), dist + 5, 24);
                    }
                    if (this.rooms[x][y].right) {
                        ctx.fillStyle = "hsl(0, 0%, 20%)";
                        dist = extend;
                        ctx.fillRect(100 * y + (85 + shifty), 100 * x + (33 + shiftx), dist, 34);
                        ctx.fillStyle = "#404040";
                        ctx.fillRect(100 * y + (80 + shifty), 100 * x + (38 + shiftx), dist + 5, 24);
                    }
                    var img = false;
                    if (this.rooms[x][y].isDefender) {
                        img = LHMap.resources.defender;
                    }
                    if (this.rooms[x][y].isTRoom) {
                        img = LHMap.resources.troom;
                    }
                    if (this.rooms[x][y].isPot) {
                        img = LHMap.resources.pot;

                    }
                    if (this.rooms[x][y].isStart) {
                        ctx.font = "bold 48px Arial";
                        ctx.fillStyle = "hsl(90, 100%, 50%)";
                        ctx.fillText("S", 100 * y + 34 + shifty, 100 * x + 67.5 + shiftx);
                    }
                    if (img) {
                        ctx.drawImage(img, 100 * y + 20 + shifty, 100 * x + 20 + shiftx, 60, 60);
                    }
                }

                if (this.rooms[x][y].isTRoom && ((this.troom_showing && this.pots.length < 5) || (this.pots.some(p => p.isSeen) && this.pots.filter(p => p.isSeen).length < (this.pots.length < 3 ? this.pots.length : 3)))) {
                    ctx.fillStyle = "pink";
                    ctx.beginPath();
                    ctx.arc(100 * this.troom.y + (50 + shifty), 100 * this.troom.x + (50 + shiftx), 8, 0, 2 * Math.PI);
                    ctx.fill();
                }

            }
        }
        if (this.showborders) {
            ctx.fillStyle = LHMap.settings.bordercol.value;
            if (shifty) {
                ctx.fillRect(0, 0, 50, 900);
                ctx.fillRect(850, 0, 50, 900);
            }
            if (shiftx) {
                ctx.fillRect(0, 0, 900, 50);
                ctx.fillRect(0, 850, 900, 50);
            }
        }
        if (this.showpots) {
            ctx.strokeStyle = "pink";
            ctx.lineWidth = 1;
            for (var pot in this.pots) {
                ctx.strokeRect(100 * this.pots[pot].y + shifty, 100 * this.pots[pot].x + shiftx, 100, 100);
            }

            ctx.strokeRect(100 * this.troom.y + shifty, 100 * this.troom.x + shiftx, 100, 100);
        }

        ctx.fillStyle = LHMap.settings.cursor.value;
        ctx.beginPath();
        ctx.arc(100 * this.current.y + (50 + shifty), 100 * this.current.x + (50 + shiftx), 8, 0, 2 * Math.PI);
        ctx.fill();

        this.updateUI();
    }

    drawSplits(ctx, x, y, shiftx, shifty) {
        if (this.rooms[x][y].isStart) {
            //GO HERE
            //SHOW PEEK ROOKS OFF SPAWN
            if (this.start.up) {
                var px = x - 1,
                    py = y;
                var peeking = this.rooms[px][py];

                //fill half of room
                ctx.fillStyle = "hsl(0, 0%, 20%)";
                ctx.fillRect(100 * py + 15 + shifty, 100 * px + 50 + shiftx, 70, 35);
                ctx.fillStyle = "gray";
                ctx.fillRect(100 * py + 20 + shifty, 100 * px + 50 + shiftx, 60, 30);

                //add hallway
                ctx.fillStyle = "hsl(0, 0%, 20%)";
                ctx.fillRect(100 * py + (33 + shifty), 100 * px + (85 + shiftx), 34, 15);
                ctx.fillStyle = "#404040";
                ctx.fillRect(100 * py + (38 + shifty), 100 * px + (80 + shiftx), 24, 20);
                if (peeking.left) {
                    ctx.fillStyle = "hsl(0, 0%, 20%)";
                    ctx.fillRect(100 * py - 15 + shifty, 100 * px + (50 + shiftx), 30, 17);
                    ctx.fillStyle = "#404040";
                    ctx.fillRect(100 * py - 15 + shifty, 100 * px + (50 + shiftx), 35, 12);
                }
                if (peeking.right) {
                    ctx.fillStyle = "hsl(0, 0%, 20%)";
                    ctx.fillRect(100 * py + (85 + shifty), 100 * px + (50 + shiftx), 30, 17);
                    ctx.fillStyle = "#404040";
                    ctx.fillRect(100 * py + (80 + shifty), 100 * px + (50 + shiftx), 35, 12);
                }

            }
            if (this.start.down) {
                var px = x + 1,
                    py = y;
                var peeking = this.rooms[px][py];

                ctx.fillStyle = "hsl(0, 0%, 20%)";
                ctx.fillRect(100 * py + 15 + shifty, 100 * px + 15 + shiftx, 70, 35);
                ctx.fillStyle = "gray";
                ctx.fillRect(100 * py + 20 + shifty, 100 * px + 20 + shiftx, 60, 30);

                ctx.fillStyle = "hsl(0, 0%, 20%)";
                ctx.fillRect(100 * py + (33 + shifty), 100 * px + shiftx, 34, 15);
                ctx.fillStyle = "#404040";
                ctx.fillRect(100 * py + (38 + shifty), 100 * px + shiftx, 24, 20);

                if (peeking.left) {
                    ctx.fillStyle = "hsl(0, 0%, 20%)";
                    ctx.fillRect(100 * py - 15 + shifty, 100 * px + (33 + shiftx), 30, 17);
                    ctx.fillStyle = "#404040";
                    ctx.fillRect(100 * py - 15 + shifty, 100 * px + (38 + shiftx), 35, 12);
                }
                if (peeking.right) {
                    ctx.fillStyle = "hsl(0, 0%, 20%)";
                    ctx.fillRect(100 * py + (85 + shifty), 100 * px + (33 + shiftx), 30, 17);
                    ctx.fillStyle = "#404040";
                    ctx.fillRect(100 * py + (80 + shifty), 100 * px + (38 + shiftx), 35, 12);
                }
            }
            if (this.start.left) {
                var px = x,
                    py = y - 1;
                var peeking = this.rooms[px][py];

                ctx.fillStyle = "hsl(0, 0%, 20%)";
                ctx.fillRect(100 * py + 50 + shifty, 100 * px + 15 + shiftx, 35, 70);
                ctx.fillStyle = "gray";
                ctx.fillRect(100 * py + 50 + shifty, 100 * px + 20 + shiftx, 30, 60);

                ctx.fillStyle = "hsl(0, 0%, 20%)";
                ctx.fillRect(100 * py + (85 + shifty), 100 * px + (33 + shiftx), 15, 34);
                ctx.fillStyle = "#404040";
                ctx.fillRect(100 * py + (80 + shifty), 100 * px + (38 + shiftx), 20, 24);

                if (peeking.up) {
                    ctx.fillStyle = "hsl(0, 0%, 20%)";
                    ctx.fillRect(100 * py + (50 + shifty), 100 * px - 15 + shiftx, 17, 30);
                    ctx.fillStyle = "#404040";
                    ctx.fillRect(100 * py + (50 + shifty), 100 * px - 15 + shiftx, 12, 35);
                }

                if (peeking.down) {
                    ctx.fillStyle = "hsl(0, 0%, 20%)";
                    ctx.fillRect(100 * py + (50 + shifty), 100 * px + (85 + shiftx), 17, 30);
                    ctx.fillStyle = "#404040";
                    ctx.fillRect(100 * py + (50 + shifty), 100 * px + (80 + shiftx), 12, 35);
                }
            }
            if (this.start.right) {
                var px = x,
                    py = y + 1;
                var peeking = this.rooms[px][py];

                ctx.fillStyle = "hsl(0, 0%, 20%)";
                ctx.fillRect(100 * py + 15 + shifty, 100 * px + 15 + shiftx, 35, 70);
                ctx.fillStyle = "gray";
                ctx.fillRect(100 * py + 20 + shifty, 100 * px + 20 + shiftx, 30, 60);

                ctx.fillStyle = "hsl(0, 0%, 20%)";
                ctx.fillRect(100 * py + shifty, 100 * px + (33 + shiftx), 15, 34);
                ctx.fillStyle = "#404040";
                ctx.fillRect(100 * py + shifty, 100 * px + (38 + shiftx), 20, 24);
                if (peeking.up) {
                    ctx.fillStyle = "hsl(0, 0%, 20%)";
                    ctx.fillRect(100 * py + (33 + shifty), 100 * px - 15 + (shiftx), 17, 30);
                    ctx.fillStyle = "#404040";
                    ctx.fillRect(100 * py + (38 + shifty), 100 * px - 15 + (shiftx), 12, 35);
                }

                if (peeking.down) {
                    ctx.fillStyle = "hsl(0, 0%, 20%)";
                    ctx.fillRect(100 * py + (33 + shifty), 100 * px + (85 + shiftx), 17, 30);
                    ctx.fillStyle = "#404040";
                    ctx.fillRect(100 * py + (38 + shifty), 100 * px + (80 + shiftx), 12, 35);
                }
            }
        }
    }

    updateUI() {
        this.displaypots.innerText = "" + this.potshit;
        this.displaydefenders.innerText = "" + this.defendershit;
        this.displayratio.innerText = this.defendershit ? (this.potshit / this.defendershit).toFixed(2) : "No Defenders";

        this.globalpots.innerText = "" + this.__global_potshit;
        this.globaldefenders.innerText = "" + this.__global_defendershit;
        this.globalratio.innerText = this.__global_defendershit ? (this.__global_potshit / this.__global_defendershit).toFixed(2) : "No Defenders";
    }

    undo() {
        if (this.history.length == 0)
            return;
        var room = this.history.pop();
        if (!!room) {
            if (!this.history.includes(room) && room != this.start)
                room.isSeen = false;
            this.current = this.history.length == 0 ? this.start : this.history[this.history.length - 1];
        }
    }

    mousemove_listener(e) {
        var shifty = this.map.rooms[8][0].isBorder ? 50 : 0;
        var shiftx = this.map.rooms[0][8].isBorder ? 50 : 0;
        var scale = this.map.canvas.clientWidth / 900;
        var px = Math.floor(((e.offsetX - shiftx * scale)) / (100 * scale)),
            py = Math.floor(((e.offsetY - shifty * scale)) / (100 * scale));

        var maxx = shiftx ? 7 : 8;
        var maxy = shifty ? 7 : 8;
        if (px > maxx || py > maxy || px < 0 || py < 0)
            return;

        if (e.buttons == 1 || e.buttons == 2)
            this.map.rooms[py][px].highlight = this.map.highlight;

        this.map.paint();
    }
    mousedown_listener(e) {
        var shifty = this.map.rooms[8][0].isBorder ? 50 : 0;
        var shiftx = this.map.rooms[0][8].isBorder ? 50 : 0;
        var scale = this.map.canvas.clientWidth / 900;
        var px = Math.floor(((e.offsetX - shiftx * scale)) / (100 * scale)),
            py = Math.floor(((e.offsetY - shifty * scale)) / (100 * scale));
        var maxx = shiftx ? 7 : 8;
        var maxy = shifty ? 7 : 8;
        if (px > maxx || py > maxy || px < 0 || py < 0)
            return;
        if (e.buttons == 1) {
            if (this.map.rooms[py][px].highlight != LHMap.settings.highlight1.value) {
                this.map.highlight = LHMap.settings.highlight1.value;
            } else
                this.map.highlight = false;
        } else if (e.buttons == 2) {
            if (this.map.rooms[py][px].highlight != LHMap.settings.highlight2.value)
                this.map.highlight = LHMap.settings.highlight2.value;
            else
                this.map.highlight = false;
        } else
            this.map.highlight = false;

        this.map.rooms[py][px].highlight = this.map.highlight;
        this.map.paint();
    }


    context_listener(e) {
        e.preventDefault();
    }

    get potshit() {
        return this.__potshit;
    }
    set potshit(value) {
        var change = value - this.__potshit;
        this.__potshit = value;
        this.__global_potshit += change;
        localStorage.setItem("potshit", this.__global_potshit);
    }

    get defendershit() {
        return this.__defendershit;
    }

    set defendershit(value) {
        var change = value - this.__defendershit;
        this.__defendershit = value;
        this.__global_defendershit += change;
        localStorage.setItem("defendershit", this.__global_defendershit);
    }
    constructor(map) {
        this.__global_potshit = parseInt(localStorage.getItem("potshit")) || 0;
        this.__potshit = 0;
        this.__global_defendershit = parseInt(localStorage.getItem("defendershit")) || 0;
        this.__defendershit = 0;
        this.defendershit = 0;
        this.potshit = 0;
        var cvs = document.createElement("canvas");
        cvs.width = 900;
        cvs.height = 900;
        this.canvas = cvs;
        this.displaypots = document.createElement('div');
        this.displaydefenders = document.createElement('div');
        this.displayratio = document.createElement('div');

        this.globalpots = document.createElement('div');
        this.globaldefenders = document.createElement('div');
        this.globalratio = document.createElement('div');

        LHMap.settings.onchange(this);

        this.setup(map);

        var _this = this;

        document.addEventListener('keydown', { handleEvent: this.keyboard_listener, map: this });
        this.canvas.addEventListener('mousemove', { handleEvent: this.mousemove_listener, map: this });
        this.canvas.addEventListener('mousedown', { handleEvent: this.mousedown_listener, map: this });
        this.canvas.addEventListener('contextmenu', { handleEvent: this.context_listener, map: this });
        this.canvas.addEventListener('dblclick', e => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    }
    setup(map) {
        if (this.rooms) {
            this.savemap();
        }
        if (map) {
            this.rooms = map.revert();
        } else
            [this.rooms, this.main] = this.generate();
        this.pots = [];
        this.borders = [];
        this.start = this.rooms[4][4];
        this.showpots = false;
        this.showborders = false;
        this.showcutoffs = false;
        this.showallrooms = false;
        this.history = [];
        this.foundpots = [];
        this.founddefender = false;
        for (var i = 0; i < 9; i++) {
            for (var j = 0; j < 9; j++) {
                var room = this.rooms[i][j];
                if (room.isDefender)
                    this.defender = room;
                if (room.isPot)
                    this.pots.push(room);
                if (room.isTRoom)
                    this.troom = room;
                if (room.isStart)
                    this.start = room;
                if (room.isBorder)
                    this.borders.push(room);
            }
        }

        this.hinttroom = this.pots.length != 5;

        this.start.isSeen = true;
        this.current = this.start;
        this.troom_showing = false;
        if (this.troom_timeout) {
            clearTimeout(this.troom_timeout);
        }
        this.paint();
        this.loopTrooms();
    }
    loopTrooms() {
        return new Promise(async(resolve) => {
            for (let i = this.pots.length; i < 5; i++) {
                await this.toggleTroom();
                await new Promise(res => setTimeout(res, 500));
            }
            resolve();
        });
    }
    toggleTroom() {
        this.troom_showing = true;
        this.paint();
        return new Promise((resolve, reject) => {
            this.troom_timeout = setTimeout(() => {
                this.troom_showing = false;
                this.paint();
                resolve();
            }, 1000);
        })
    }
    clip() {
        this.canvas.toBlob(function(blob) {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]);
        })
    }

    savemap() {

    }

    static deseralizemap(map) {
        var rooms = [];
        if (typeof map === "string") {
            map = map.split(',');
            var row = [];
            for (var i = 0; i < 9; i++)
                row.push(map.splice(i * 9, 9));
            map.push(row);
        }
        for (var i = 0; i < 9; i++) {
            var row = [];
            for (var j = 0; j < 9; j++) {
                row.push(new Room(parseInt(map[i][j]), i, j));
            }
            rooms.push(row);
        }
        return rooms;
    }

    static serializemap(map) {
        if (map.rooms)
            map = map.rooms;
        var data = "";
        for (var i = 0; i < 9; i++) {
            for (var j = 0; j < 9; j++) {
                data += map[i][j].value + ",";
            }
        }

        return data.substring(0, data.length - 1);
    }

    gethashcode(rooms) {
        rooms = rooms || this.rooms;
        var output = "";
        for (var i = 0; i < 9; i++) {
            var pre = false;
            for (var j = 0; j < 9; j++) {
                if (rooms[i][j].value != 0 || pre) {
                    pre = true;
                    output += rooms[i][j].value;
                }
            }
        }
        var output2 = "";
        for (var i = 0; i < output.length; i += 3)
            output2 += output[i];

        return parseInt(output2);
    }

    generate() {
        //Code here is based off of Nacnudd's insane skills
        //https://github.com/RichmondD/Lost_Halls/tree/4.3
        var map = create9x9();
        var mainpath = create9x9();
        var mainloop = false;
        var forceloop = false;
        map[4][4] = 420;

        var mainlength = 10;

        createNextRoom(4, 4, 0, 0, mainlength, false);
        findMainPath(4, 4, 1);
        createPots();
        cleanMap();

        var rooms = create9x9();

        for (var i = 0; i < map.length; i++) {
            for (var j = 0; j < map.length; j++) {
                rooms[i][j] = new Room(map[i][j], i, j);
            }
        }

        return [rooms, mainpath];

        function create9x9() {
            var map = [];
            for (var i = 0; i < 9; i++) {
                var row = [];
                for (var j = 0; j < 9; j++)
                    row.push(0);
                map.push(row);
            }
            return map;
        }

        function rand(min, max) {
            if (!min && !max)
                return Math.random();

            if (!!min && !max)
                return (Math.random() * min) ^ 0;

            return (Math.random() * (max - min) + min) ^ 0;
        }

        function createNextRoom(x, y, pathtype, depth, length, loop) {
            if (depth == length) {
                if (pathtype == 0) {
                    return placeMBC(x, y);
                }
                if (pathtype == 1) {
                    return map[y][x] == 126;
                }
                if (pathtype == 2) {
                    while (map[y][x] < 500) {
                        map[y][x] += 210;
                    }
                    return true;
                }
                return false;
            }

            var available = [];
            var options = [];
            var pick, works = false;

            if (loop) {
                available = [];
                for (var i = 0; i < 4; i++)
                    available.push(true);

                var count = 0;

                while (available[0] || available[1] || available[2] || available[3]) {
                    options = [];
                    for (var i = 0; i < 4; i++) {
                        if (available[i]) {
                            var di = (i / 2) ^ 0;
                            count = ((y + di > 0 && (map[y + di - 1][x + i % 2] == 0)) ? 1 : 0) + ((y + di < 8 && (map[y + di + 1][x + i % 2] == 0)) ? 1 : 0) + ((x + i % 2 > 0 && (map[y + di][x + i % 2 - 1] == 0)) ? 1 : 0) + ((x + i % 2 < 8 && (map[y + di][x + i % 2 + 1] == 0)) ? 1 : 0);

                            while (count > 0) {
                                options.push(i);
                                count--;
                            }
                        }
                    }

                    if (!options.length)
                        break;

                    pick = options[rand(options.length)];

                    if (pick == 0) {
                        works = createNextRoom(x, y, pathtype, depth, length, false);
                        if (!works) { available[0] = false; } else { return true; }
                    }
                    if (pick == 1) {
                        works = createNextRoom(x + 1, y, pathtype, depth, length, false);
                        if (!works) { available[1] = false; } else { return true; }
                    }
                    if (pick == 2) {
                        works = createNextRoom(x + 1, y + 1, pathtype, depth, length, false);
                        if (!works) { available[2] = false; } else { return true; }
                    }
                    if (pick == 3) {
                        works = createNextRoom(x, y + 1, pathtype, depth, length, false);
                        if (!works) { available[3] = false; } else { return true; }
                    }
                }
                return false;
            }

            if ((((!mainloop) && pathtype == 0) && (rand() <= 1.0 / mainlength)) || (forceloop && (!mainloop))) {
                mainloop = true;

                available = loopSpace(x, y);

                while (available[0] || available[1] || available[2] || available[3] || available[4] || available[5] || available[6] || available[7]) {
                    options = [];
                    for (var i = 0; i < 8; i++)
                        if (available[i])
                            options.push(i);

                    pick = options[rand(options.length)];

                    if (pick == 0) {
                        createLoop(x - 1, y - 2);
                        changeRoom(x, y, 0);
                        changeRoom(x, y - 1, 2);
                        works = createNextRoom(x - 1, y - 2, pathtype, depth + 1, length, true);
                        if (!works) {
                            available[0] = false;
                            createLoop(x - 1, y - 2);
                            changeRoom(x, y, 0);
                            changeRoom(x, y - 1, 2);
                        } else { return true; }
                    }
                    if (pick == 1) {
                        createLoop(x, y - 2);
                        changeRoom(x, y, 0);
                        changeRoom(x, y - 1, 2);
                        works = createNextRoom(x, y - 2, pathtype, depth + 1, length, true);
                        if (!works) {
                            available[1] = false;
                            createLoop(x, y - 2);
                            changeRoom(x, y, 0);
                            changeRoom(x, y - 1, 2);
                        } else { return true; }
                    }
                    if (pick == 2) {
                        createLoop(x + 1, y - 1);
                        changeRoom(x, y, 1);
                        changeRoom(x + 1, y, 3);
                        works = createNextRoom(x + 1, y - 1, pathtype, depth + 1, length, true);
                        if (!works) {
                            available[2] = false;
                            createLoop(x + 1, y - 1);
                            changeRoom(x, y, 1);
                            changeRoom(x + 1, y, 3);
                        } else { return true; }
                    }
                    if (pick == 3) {
                        createLoop(x + 1, y);
                        changeRoom(x, y, 1);
                        changeRoom(x + 1, y, 3);
                        works = createNextRoom(x + 1, y, pathtype, depth + 1, length, true);
                        if (!works) {
                            available[3] = false;
                            createLoop(x + 1, y);
                            changeRoom(x, y, 1);
                            changeRoom(x + 1, y, 3);
                        } else { return true; }
                    }
                    if (pick == 4) {
                        createLoop(x, y + 1);
                        changeRoom(x, y, 2);
                        changeRoom(x, y + 1, 0);
                        works = createNextRoom(x, y + 1, pathtype, depth + 1, length, true);
                        if (!works) {
                            available[4] = false;
                            createLoop(x, y + 1);
                            changeRoom(x, y, 2);
                            changeRoom(x, y + 1, 0);
                        } else { return true; }
                    }
                    if (pick == 5) {
                        createLoop(x - 1, y + 1);
                        changeRoom(x, y, 2);
                        changeRoom(x, y + 1, 0);
                        works = createNextRoom(x - 1, y + 1, pathtype, depth + 1, length, true);
                        if (!works) {
                            available[5] = false;
                            createLoop(x - 1, y + 1);
                            changeRoom(x, y, 2);
                            changeRoom(x, y + 1, 0);
                        } else { return true; }
                    }
                    if (pick == 6) {
                        createLoop(x - 2, y);
                        changeRoom(x, y, 3);
                        changeRoom(x - 1, y, 1);
                        works = createNextRoom(x - 2, y, pathtype, depth + 1, length, true);
                        if (!works) {
                            available[6] = false;
                            createLoop(x - 2, y);
                            changeRoom(x, y, 3);
                            changeRoom(x - 1, y, 1);
                        } else { return true; }
                    }
                    if (pick == 7) {
                        createLoop(x - 2, y - 1);
                        changeRoom(x, y, 3);
                        changeRoom(x - 1, y, 1);
                        works = createNextRoom(x - 2, y - 1, pathtype, depth + 1, length, true);
                        if (!works) {
                            available[7] = false;
                            createLoop(x - 2, y - 1);
                            changeRoom(x, y, 3);
                            changeRoom(x - 1, y, 1);
                        } else { return true; }
                    }
                }
                mainloop = false;
                if (forceloop) return false;
            }

            available = [];
            for (var i = 0; i < 4; i++)
                available.push(false);
            if (map[y][x] % 2 == 0 && y > 0) {
                if (map[y - 1][x] == 0) { available[0] = true; }
            }
            if (map[y][x] % 3 == 0 && x < 8) {
                if (map[y][x + 1] == 0) { available[1] = true; }
            }
            if (map[y][x] % 5 == 0 && y < 8) {
                if (map[y + 1][x] == 0) { available[2] = true; }
            }
            if (map[y][x] % 7 == 0 && x > 0) {
                if (map[y][x - 1] == 0) { available[3] = true; }
            }

            while (available[0] || available[1] || available[2] || available[3]) {
                options = [];

                for (var i = 0; i < 4; i++)
                    if (available[i])
                        options.push(i);

                pick = options[rand(options.length)];

                if (pick == 0) {
                    changeRoom(x, y, 0);
                    changeRoom(x, y - 1, 2);
                    works = createNextRoom(x, y - 1, pathtype, depth + 1, length, false);
                    if (!works) {
                        available[0] = false;
                        changeRoom(x, y, 0);
                        changeRoom(x, y - 1, 2);
                    } else { return true; }
                }
                if (pick == 1) {
                    changeRoom(x, y, 1);
                    changeRoom(x + 1, y, 3);
                    works = createNextRoom(x + 1, y, pathtype, depth + 1, length, false);
                    if (!works) {
                        available[1] = false;
                        changeRoom(x, y, 1);
                        changeRoom(x + 1, y, 3);
                    } else { return true; }
                }
                if (pick == 2) {
                    changeRoom(x, y, 2);
                    changeRoom(x, y + 1, 0);
                    works = createNextRoom(x, y + 1, pathtype, depth + 1, length, false);
                    if (!works) {
                        available[2] = false;
                        changeRoom(x, y, 2);
                        changeRoom(x, y + 1, 0);
                    } else { return true; }
                }
                if (pick == 3) {
                    changeRoom(x, y, 3);
                    changeRoom(x - 1, y, 1);
                    works = createNextRoom(x - 1, y, pathtype, depth + 1, length, false);
                    if (!works) {
                        available[3] = false;
                        changeRoom(x, y, 3);
                        changeRoom(x - 1, y, 1);
                    } else { return true; }
                }
            }

            if (pathtype == 0 && (depth == mainlength - 2) && (!mainloop) && (!forceloop) && (rand() <= .4)) {
                forceloop = true;
                works = createNextRoom(x, y, pathtype, depth, length, false);
                forceloop = false;
                return works;
            }
            return false;
        }

        function createPots() {
            while (!createNewPot(4, 4, 0, true));

            var potsplaced = 0;
            var potspaceavailable = true;
            var tries = 0;

            while (potspaceavailable && potsplaced < 5) {
                if (createNewPot(4, 4, 0, false)) { potsplaced++; }
                if (tries > 30 && potsplaced < 5) {
                    if (createNewPot(4, 4, 3, false)) { potsplaced++; } else if (createNewPot(4, 4, 2, false)) { potsplaced++; } else { potspaceavailable = false; }
                }
                tries++;
            }
        }

        function createNewPot(x, y, forcepots, troom) {
            var works = false;
            if ((rand() < 1.0 / mainlength) || (forcepots > 0)) {
                if (troom) { works = createNextRoom(x, y, 1, 0, rand(2) + 2, false); } else if (forcepots > 0) { works = createNextRoom(x, y, 2, 0, rand(forcepots - 1) + 2, false); } else { works = createNextRoom(x, y, 2, 0, rand(2) + 2, false); }
                if (works) { return true; }
            }

            if (map[y][x] % 2 == 1) {
                if (mainpath[y - 1][x] == mainpath[y][x] + 1) {
                    works = createNewPot(x, y - 1, forcepots, troom);
                    if (works) { return true; }
                }
            }
            if (map[y][x] % 3 == 1) {
                if (mainpath[y][x + 1] == mainpath[y][x] + 1) {
                    works = createNewPot(x + 1, y, forcepots, troom);
                    if (works) { return true; }
                }
            }
            if (map[y][x] % 5 == 1) {
                if (mainpath[y + 1][x] == mainpath[y][x] + 1) {
                    works = createNewPot(x, y + 1, forcepots, troom);
                    if (works) { return true; }
                }
            }
            if (map[y][x] % 7 == 1) {
                if (mainpath[y][x - 1] == mainpath[y][x] + 1) {
                    works = createNewPot(x - 1, y, forcepots, troom);
                    if (works) { return true; }
                }
            }

            return false;
        }

        function findMainPath(x, y, depth) {
            if (map[y][x] > 750) { return; }
            mainpath[y][x] = depth;

            if (map[y][x] % 2 == 1) {
                if (map[y - 1][x] < 1000 && mainpath[y - 1][x] == 0) { findMainPath(x, y - 1, depth + 1); }
            }
            if (map[y][x] % 3 == 1) {
                if (map[y][x + 1] < 1000 && mainpath[y][x + 1] == 0) { findMainPath(x + 1, y, depth + 1); }
            }
            if (map[y][x] % 5 == 1) {
                if (map[y + 1][x] < 1000 && mainpath[y + 1][x] == 0) { findMainPath(x, y + 1, depth + 1); }
            }
            if (map[y][x] % 7 == 1) {
                if (map[y][x - 1] < 1000 && mainpath[y][x - 1] == 0) { findMainPath(x - 1, y, depth + 1); }
            }
            return;
        }

        function placeMBC(x, y) {
            if (map[y][x] % 5 == 1 && x > 0 && x < 8 && y > 1) {
                changeRoom(x, y, 2);
                if (spaceForMBC(x, y - 1)) {
                    for (var i = 0; i < 3; i++) {
                        for (var j = 0; j < 3; j++) { map[y + i - 2][x + j - 1] = -1; }
                    }
                    map[y][x] = 756;
                    return true;
                }
                changeRoom(x, y, 2);
            }
            if (map[y][x] % 7 == 1 && x < 7 && y > 0 && y < 8) {
                changeRoom(x, y, 3);
                if (spaceForMBC(x + 1, y)) {
                    for (var i = 0; i < 3; i++) {
                        for (var j = 0; j < 3; j++) { map[y + i - 1][x + j] = -1; }
                    }
                    map[y][x] = 960;
                    return true;
                }
                changeRoom(x, y, 3);
            }
            if (map[y][x] % 2 == 1 && x > 0 && x < 8 && y < 7) {
                changeRoom(x, y, 0);
                if (spaceForMBC(x, y + 1)) {
                    for (var i = 0; i < 3; i++) {
                        for (var j = 0; j < 3; j++) { map[y + i][x + j - 1] = -1; }
                    }
                    map[y][x] = 945;
                    return true;
                }
                changeRoom(x, y, 0);
            }
            if (map[y][x] % 3 == 1 && x > 1 && y > 0 && y < 8) {
                changeRoom(x, y, 1);
                if (spaceForMBC(x - 1, y)) {
                    for (var i = 0; i < 3; i++) {
                        for (var j = 0; j < 3; j++) { map[y + i - 1][x + j - 2] = -1; }
                    }
                    map[y][x] = 910;
                    return true;
                }
                changeRoom(x, y, 1);
            }

            return false;
        }

        function spaceForMBC(x, y) {
            for (var i = 0; i < 3; i++)
                for (var j = 0; j < 3; j++)
                    if (map[y + i - 1][x + j - 1] != 0)
                        return false;
            return true;
        }

        function loopSpace(x, y) {
            var available = [];
            for (var i = 0; i < 8; i++)
                available.push(false);

            if (x > 0 && y > 1) {
                if (map[y - 1][x - 1] == 0 && map[y - 2][x - 1] == 0 && map[y - 1][x] == 0 && map[y - 2][x] == 0) { available[0] = true; }
            }
            if (x < 8 && y > 1) {
                if (map[y - 1][x] == 0 && map[y - 2][x] == 0 && map[y - 1][x + 1] == 0 && map[y - 2][x + 1] == 0) { available[1] = true; }
            }
            if (x < 7 && y > 0) {
                if (map[y - 1][x + 1] == 0 && map[y - 1][x + 2] == 0 && map[y][x + 1] == 0 && map[y][x + 2] == 0) { available[2] = true; }
            }
            if (x < 7 && y < 8) {
                if (map[y][x + 1] == 0 && map[y][x + 2] == 0 && map[y + 1][x + 1] == 0 && map[y + 1][x + 2] == 0) { available[3] = true; }
            }
            if (x < 8 && y < 7) {
                if (map[y + 1][x] == 0 && map[y + 2][x] == 0 && map[y + 1][x + 1] == 0 && map[y + 2][x + 1] == 0) { available[4] = true; }
            }
            if (x > 0 && y < 7) {
                if (map[y + 1][x - 1] == 0 && map[y + 2][x - 1] == 0 && map[y + 1][x] == 0 && map[y + 2][x] == 0) { available[5] = true; }
            }
            if (x > 1 && y < 8) {
                if (map[y][x - 1] == 0 && map[y][x - 2] == 0 && map[y + 1][x - 1] == 0 && map[y + 1][x - 2] == 0) { available[6] = true; }
            }
            if (x > 1 && y > 0) {
                if (map[y - 1][x - 1] == 0 && map[y - 1][x - 2] == 0 && map[y][x - 1] == 0 && map[y][x - 2] == 0) { available[7] = true; }
            }

            return available;
        }

        function cleanMap() {
            var oldm = create9x9();

            for (var i = 0; i < 9; i++)
                for (var j = 0; j < 9; j++)
                    oldm[i][j] = map[i][j];

            var sidespace = [];
            for (var i = 0; i < 4; i++)
                sidespace.push(0);

            var rowempty = true;
            var col = 0;
            while (rowempty) {
                for (var i = 0; i < 9; i++) {
                    if (map[col][i] != 0) {
                        rowempty = false;
                        break;
                    }
                }
                if (rowempty) {
                    sidespace[0]++;
                    col++;
                }
            }

            rowempty = true;
            col = 8;
            while (rowempty) {
                for (var i = 0; i < 9; i++) {
                    if (map[i][col] != 0) {
                        rowempty = false;
                        break;
                    }
                }
                if (rowempty) {
                    sidespace[1]++;
                    col--;
                }
            }
            rowempty = true;
            col = 8;
            while (rowempty) {
                for (var i = 0; i < 9; i++) {
                    if (map[col][i] != 0) {
                        rowempty = false;
                        break;
                    }
                }
                if (rowempty) {
                    sidespace[2]++;
                    col--;
                }
            }
            rowempty = true;
            col = 0;
            while (rowempty) {
                for (var i = 0; i < 9; i++) {
                    if (map[i][col] != 0) {
                        rowempty = false;
                        break;
                    }
                }
                if (rowempty) {
                    sidespace[3]++;
                    col++;
                }
            }
            var newm = [];
            for (var i = 0; i < 9; i++) {
                var row = [];
                for (var j = 0; j < 9; j++)
                    row.push(0);
                newm.push(row);
            }

            var mainn = [];
            for (var i = 0; i < 9; i++) {
                var row = [];
                for (var j = 0; j < 9; j++)
                    row.push(0);
                mainn.push(row);
            }
            var shiftx = Math.floor((sidespace[1] - sidespace[3]) / 2.0);
            var shifty = Math.floor((sidespace[2] - sidespace[0]) / 2.0);

            for (var i = sidespace[0]; i < 9 - sidespace[2]; i++) {
                for (var j = sidespace[3]; j < 9 - sidespace[1]; j++) {
                    newm[i + shifty][j + shiftx] = map[i][j];
                    mainn[i + shifty][j + shiftx] = mainpath[i][j];
                }
            }
            for (var i = 0; i < 9; i++) {
                for (var j = 0; j < 9; j++) {
                    map[i][j] = newm[i][j];
                    mainpath[i][j] = mainn[i][j];
                }
            }

            if ((sidespace[0] + sidespace[2]) % 2 == 1) {
                for (var i = 0; i < 9; i++) {
                    map[8][i] = 1;
                }
            }
            if ((sidespace[1] + sidespace[3]) % 2 == 1) {
                for (var i = 0; i < 9; i++) {
                    map[i][8] = 1;
                }
            }

            for (var i = 0; i < 9; i++) {
                for (var j = 0; j < 9; j++) {
                    if (map[i][j] > 1000) {
                        while (map[i][j] > 250) {
                            map[i][j] -= 210;
                        }
                    }
                    if (map[i][j] == -1) {
                        map[i][j] = 0;
                    }
                }
            }
        }

        function createLoop(x, y) {
            changeRoom(x, y, 1);
            changeRoom(x, y, 2);
            changeRoom(x, y + 1, 0);
            changeRoom(x, y + 1, 1);
            changeRoom(x + 1, y, 3);
            changeRoom(x + 1, y, 2);
            changeRoom(x + 1, y + 1, 0);
            changeRoom(x + 1, y + 1, 3);
        }

        function changeRoom(x, y, direction) {
            var sides = [
                map[y][x] % 2 == 1,
                map[y][x] % 3 == 1,
                map[y][x] % 5 == 1,
                map[y][x] % 7 == 1
            ];
            sides[direction] = !sides[direction];

            var spawn = (map[y][x] > 249 && map[y][x] < 500);
            var defender = (map[y][x] > 749 && map[y][x] < 999);
            var pots = (map[y][x] > 499 && map[y][x] < 750);
            map[y][x] = getRoomNumber(sides[0], sides[1], sides[2], sides[3], spawn, pots, defender);

        }

        function getRoomNumber(up, right, down, left, spawn, pots, defender) {
            var startn;
            var num = 0;
            if (up) { startn = 1; } else { startn = 0; }
            for (var i = startn; i < 250; i += 2) {
                if (((i % 2 == 1 && up) || (i % 2 == 0 && (!up))) && ((i % 3 == 1 && right) || (i % 3 == 0 && (!right))) && ((i % 5 == 1 && down) || (i % 5 == 0 && (!down))) && ((i % 7 == 1 && left) || (i % 7 == 0 && (!left)))) {
                    num = i;
                    break;
                }
            }
            var limit = 0;
            if (spawn) { limit = 250; }
            if (pots) { limit = 500; }
            if (defender) { limit = 750; }
            while (num < limit) { num += 210; }
            if (num == 1) { num += 210; }
            return num;
        }
    }
}

LHMap.settings = new Settings();
LHMap.resources = (function RetrieveResources() {
    var resources = {};

    for (var item of["cutoffs", "defender", "map", "pot", "rooms", "settings", "troom"]) {
        resources[item] = new Image();
        resources[item].src = `images/${item}.png`;
    }

    return resources;
})();