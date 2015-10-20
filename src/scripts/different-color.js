;(function($) {
	var fn = Game.prototype;
	Game.defaults = {
		initialSize: 3,
		maxSize: 16,
		height: 500,
		colorStep: 12,
		colorMinStep: 6,
		colorStepSize: 0.1,
		duration: 40,
		gridSelector: '.game-grid',
		sidebarSelector: '.game-sidebar',
		timeSelector: '.game-time',
		scoreSelector: '.game-score'
	};

	function Game(opts) {
		this.init(opts); 
	}

	fn.init = function(opts) {
		this.options = $.extend(true, {}, Game.defaults, opts);

		this.size = this.options.initialSize;
		this.step = this.options.colorStep;
		this.score = 0;

		this.element = opts.element;
		this.$element = $(this.element);
		this.$grid = this.$element.find(this.options.gridSelector);
		this.$sidebar = this.$element.find(this.options.sidebarSelector);
		this.$time = this.$element.find(this.options.timeSelector);
		this.$score = this.$element.find(this.options.scoreSelector);

		return this;
	};

	fn.displayTime = function() {
		this.$time.html('Time: ' + this.time.toFixed(1));

		return this;
	};
	fn.displayScore = function() {
		this.$score.html('Score: ' + this.score);
		return this;
	};

	fn.updateTime = function() {
		if (this.gameOver) {
			window.clearInterval(this.t);
		}
		if (this.paused) {
			return this;
		}
		this.time -= 0.1;
		if (this.time <= 0) {
			this.time = 0;
			return this.showGameOver();
		}
		return this.displayTime();
	};

	fn.showGameOver = function() {
		this.gameOver = true;
		this.paused = true;
		this.displayTime();
		alert('Game Over! You score is: ' + this.score);
		return this;
	};

	fn.start = function(size) {
		this.time = this.options.duration;
		this.paused = true;
		this.gameOver = false;

		var self = this;
		this.displayTime();
		this.displayScore();
		this.t = window.setInterval(function() {
			self.updateTime();
		}, 100);
		return this.renderGrid();		
	};

	fn.renderGrid = function() {
		this.$grid.html(this.createGrid(this.size));
		return this.attachEvents();
	};

	fn.attachEvents = function() {
		var self = this;
		var $tbl = this.$grid.find('table');
		$tbl.on('click', 'td', function(e) {
			e.stopPropagation();

			if (self.gameOver) {
				return self.init(self.options).start();
			}

			self.paused = false;
			var color = $(this).attr('bgcolor');
			if (self.color.d == color) {
				self.size = self.clamp(self.size + 1, 0, self.options.maxSize);
				self.renderGrid();
				self.score ++;
				self.displayScore();
			} else {
				self.showGameOver();
			}
		});
		return this;
	};

	fn.createGrid = function(n) {
		var i, j;
		var other = Math.floor(Math.random() * (n * n));
		var colors = this.color = this.randomColor();
		var gridHeight = this.options.height;
		var height = gridHeight / n;

		var h = '<table style="width:' + gridHeight + 'px; height: ' + gridHeight + 'px;">';
		for (i = 0; i < n; i++) {
			h += '<tr>';
			for (j = 0; j < n; j++) {
				var x = i * n + j;
				var color = x == other ? colors.d : colors.c;

				h += '<td bgcolor="' + color + '" height="' + height + 'px">&nbsp;</td>';
			}
			h += '</tr>';
		}
		h += '</table>';
		return h;
	};

	fn.random = function(n) {
		return Math.floor(Math.random() * n);
	};

	fn.clamp = function(x, min, max) {
		return Math.max(min, Math.min(max, x));
	};

	fn.padZero = function(s) {
		return ("00" + s).substr(-2);
	};

	fn.toHex = function(color) {
		var s = "#";
		s += this.padZero(color.r.toString(16));
		s += this.padZero(color.g.toString(16));
		s += this.padZero(color.b.toString(16));
		return s;
	};

	fn.randomColor = function() {
		var n = 245;
		var c = {
			r: this.random(n),
			g: this.random(n),
			b: this.random(n)
		};

		this.step -= this.options.colorStepSize;
		var step = Math.floor(this.step);

		var d = {
			r: this.clamp(c.r + step, 0, n),
			g: this.clamp(c.g + step, 0, n),
			b: this.clamp(c.b + step, 0, n)
		};

		return { c: this.toHex(c) , d: this.toHex(d) }; 
	};

    window.DifferentColor = Game; 
})(jQuery);
