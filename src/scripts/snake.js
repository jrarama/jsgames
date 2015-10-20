;(function($, _H) {
    var fn = Game.prototype;
    var lefts = { E: 'N', N: 'W', W: 'S', S: 'E'};
    var rights = { E: 'S', N: 'E', W: 'N', S: 'W'};
    var movement = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1]};

    Game.defaults = {
        maxWidth: 800,
        countX: 24,
        countY: 16,
        spaceSize: 1,
        spaceColor: '#eee',
        cellSize: 4,
        cellColor: '#e5e5e5',
        gridArea: '.grid-area',
        snakeArea: '.snake-area',
        template: [
        '<div class="relative">',
            '{{#cells}}',
                '<div class="cell {{cls}}" style="top: {{top}}px; left: {{left}}px; width: {{width}}px; height: {{height}}px; background: {{background}};"></div>',
            '{{/cells}}',
            '{{#if food}}{{#with food}}',
            '<div class="cell snake-food {{cls}}" style="top: {{top}}px; left: {{left}}px; width: {{width}}px; height: {{height}}px; background: {{background}};"></div>',
            '{{/with}}{{/if}}',
            '{{#bonus}}',
                '<div class="cell snake-food bonus {{cls}}" style="top: {{top}}px; left: {{left}}px; width: {{width}}px; height: {{height}}px; background: {{background}};">{{timeLeft}}</div>',
            '{{/bonus}}',
        '</div>'].join(''),
        delay: 120,
        onGameOver: function() {
            alert('Game Over');
            this.restart();
        },
        snake: {
            minSize: 4,
            initX: 2,
            color: '#565656'
        },
        food: {
            color: '#ee2222',
            bonusColor: '#22ee22',
            bonusTime: 40
        }

    };

    function Cell(x, y, dir, cls) {
        this.dir = dir || 'E'; // N|NE|NW|E|EN|ES|W|WN|WS|S|SE|SW
        this.x = x || 0;
        this.y = y || 0;
        this.cls = cls || 'turn-E'; // The CSS class
    }

    function Game(options) {
        this.options = $.extend(true, {}, Game.defaults, options);
        this.init();
    }

    fn.init = function(options) {
        this.options = $.extend(true, {}, this.options, options);
        var opts = this.options;
        this.$element = $(opts.element);
        this.$gridArea = this.$element.find(opts.gridArea);
        this.$snakeArea = this.$element.find(opts.snakeArea);
        this._template = _H.compile(opts.template);

        this.restart();
        this.attachKeyEvents();
    };

    fn.restart = function() {
        this.dir = 'E'; // Face East Direction
        this.turn = null; // L or R
        this.eating = false; 

        this.computeDimensions();
        this.initSnake();
        this.positionFood();
        this.render();
        this.paused = true;
    };

    fn.start = function() {
        if (this.paused) {
            this.paused = false;
        } else {
            return;
        }
        var self = this;
        this.timer = window.setInterval(function() {
            self.move();
        }, self.options.delay);
    };

    fn.pause = function() {
        window.clearInterval(this.timer);
        this.paused = true;
    };

    fn.attachKeyEvents = function(off) {
        var self = this;
        $(window).on('keydown', function(event) {
            switch(event.which) {
                case 37: self.turnLeft(); break; // Left Arrow
                case 39: self.turnRight(); break; // Right arrow
                case 83: self.start(); break; // s
                case 27: self.pause(); break; // esc
            }
            if (event.which === 37) {
                self.turnLeft();
            } else if (event.which === 39) {
                self.turnRight();
            }
        });
    };

    fn.detachKeyEvents = function() {
        this.off('keydown');
    };

    fn.initAvailableCells = function() {
        this.availableCells = [];
        var len = this.options.countX * this.options.countY;
        for (var i = 0; i < this.options.countY; i++) {
            for (var j = 0; j < this.options.countX; j++) {
                this.availableCells.push(i + ':' + j);
            }
        }
    };

    fn.getAvailableCell = function() {
        var len = this.availableCells.length;
        var ind = Math.floor(Math.random() * len);
        var pos = this.availableCells[ind].split(':');

        return {
            y: Number(pos[0]),
            x: Number(pos[1])
        };
    };

    fn.positionFood = function() {
        if(this.availableCells.length > 0) {
            this.food = this.getAvailableCell();
        }

        if (this.foodEaten > 0 && this.foodEaten % 5 === 0 && this.availableCells.length > 1) {
            this.bonusFoods = [];
            this.showBonus = true;
            this.bonusTimer = this.options.food.bonusTime;
            this.bonusFoods.push(this.getAvailableCell());
            this.bonusFoods.push(this.getAvailableCell());
        }
    };

    fn.initSnake = function() {
        var opts = this.options;
        this.cells = [];
        this.foodEaten = 0;
        this.bonusEaten = 0;
        this.bonusFoods = [];
        
        this.initAvailableCells();
        var centerY = Math.floor(opts.countY / 2) - 1;
        for (var i = 0; i < opts.snake.minSize; i++) {
            var x = opts.snake.initX + i;
            this.cells.unshift(new Cell(x, centerY));
            this.occufyCell(x, centerY);
        }
    };

    fn.occufyCell = function(x, y) {
        var ind = $.inArray(y + ':' + x, this.availableCells);
        this.availableCells.splice(ind, 1);
    };

    fn.freeCell = function(x, y) {
        this.availableCells.push(y + ':' + x);
    };

    fn.isFreeCell = function(x, y) {
        return $.inArray(y + ':' + x, this.availableCells) > -1;
    };

    fn.render = function() {
        var opts = this.options;
        this.$element.css({
            background: opts.spaceColor,
            width: this.origWidth,
            height: this.origHeight
        });
        this.renderGrid();
        this.renderSnake();
    };

    fn.createCellCss = function(values) {
        var opts = this.options;
        return {
            width: Math.round(this.cellSize),
            height: Math.round(this.cellSize),
            left: Math.round(this.spaceSize + (this.cellSpaceSize * values.x)),
            top: Math.round(this.spaceSize + (this.cellSpaceSize * values.y)),
            background: values.bg
        };
    };

    fn.renderGrid = function() {
        var opts = this.options;
        var cells = [];

        for(var i = 0; i < opts.countY; i++) {
            for(var j = 0; j < opts.countX; j++) {
                var css = this.createCellCss({ x: j, y: i, bg: opts.cellColor });
                cells.push(css);
            }
        }

        var html = this._template({ cells: cells });
        this.$gridArea.html(html);
    };

    fn.renderSnake = function() {
        var opts = this.options;
        var cells = [];
        var len = this.cells.length;
        var i;

        for (i = 0; i < len; i++) {
            var cell = this.cells[i];
            var css = this.createCellCss({ x: cell.x, y: cell.y, bg: opts.snake.color });
            css.cls = cell.cls;
            cells.push(css);
        }

        var foodCss = this.createCellCss({ x: this.food.x, y: this.food.y, bg: opts.food.color });
        var bonuses = [];
        for (i = 0; i < this.bonusFoods.length; i++) {
            var bonus = this.bonusFoods[i];
            bonuses.push(this.createCellCss({ x: bonus.x, y: bonus.y, bg: opts.food.bonusColor }));
        }

        var html = this._template({
            cells: cells,
            food: foodCss,
            bonus: bonuses
        });

        this.$snakeArea.html(html);
    };

    fn.gameOver = function() {
        this.pause();
        this.options.onGameOver.call(this);
        return this;
    };

    fn.turnLeft = function() {
        if (!this.paused) {
            this.turn = 'L';
        }
    };
    fn.turnRight = function() {
        if (!this.paused) {
            this.turn = 'R';
        }
    };

    fn.displayBonus = function() {
        if (this.showBonus && this.bonusTimer > 0) {
            this.bonusTimer--;
        } else {
            this.bonusFoods = [];
            this.showBonus = false;
        }
    };

    fn.move = function() {
        var cell = this.cells[0];

        this.displayBonus();
        
        if (this.turn != null) {
            var newDir = this.turn == 'L' ? lefts[this.dir] : rights[this.dir];
            this.cells[0].cls = cell.cls + newDir;
            this.dir = newDir;
        }

        var m = movement[this.dir];
        var newCell = new Cell(cell.x + m[0], cell.y + m[1], this.dir, 'turn-' + this.dir);

        if (this.isDead(newCell)) {
            this.gameOver();
            return;
        }
        // Insert the new cell as the first element of cells
        this.cells.unshift(newCell);
        this.occufyCell(newCell.x, newCell.y);

        if (!this.isEating()) {
            if (this.isEatingBonus()) {
                this.addScore();
            } else {
                // Remove tail if not eating
                var tail = this.cells.pop();
                this.freeCell(tail.x, tail.y);
            }
        } else {
            this.positionFood();
            this.addScore();
        }
        this.turn = null;
        this.renderSnake();
    };

    fn.isDead = function(newCell) {
        var tail = this.cells[this.cells.length - 1];
        return !this.isFreeCell(newCell.x, newCell.y) && !(tail.x == newCell.x && tail.y == newCell.y);
    };

    fn.isEating = function() {
        var head = this.cells[0];
        var eating = (head.x == this.food.x && head.y == this.food.y);

        if (eating) {
            this.foodEaten ++;
        }

        return eating;
    };

    fn.isEatingBonus = function() {
        var head = this.cells[0];
        for(var i=0; i < this.bonusFoods.length; i++) {
            var bonus = this.bonusFoods[i];
            if (head.x == bonus.x && head.y == bonus.y) {
                this.bonusEaten ++;
                this.bonusFoods.splice(i, 1);
                return true;
            }
        }
        return false;

    };

    fn.addScore = function() {

    };

    fn.computeDimensions = function() {
        var parent = this.$element.parent();
        var parentWidth = parent.width();
        var opts = this.options;

        this.cellSpace = opts.cellSize + opts.spaceSize;
        this.origWidth = Math.min(parentWidth, opts.maxWidth);
        this.minWidth = opts.countX * this.cellSpace + opts.spaceSize;
        this.unitSize = this.origWidth / this.minWidth;
        this.minHeight = opts.countY * this.cellSpace + opts.spaceSize;
        this.origHeight = this.minHeight * this.unitSize; 
        this.spaceSize = opts.spaceSize * this.unitSize;
        this.cellSize = opts.cellSize * this.unitSize;
        this.cellSpaceSize = this.cellSpace * this.unitSize;
    };

    window.SnakeGame = Game;
})(jQuery, Handlebars);