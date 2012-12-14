enchant();

var SCREEN_WIDTH	= 320;
var SCREEN_HEIGHT	= 320;
var TANKTYPE_PLAYER	= 0;
var TANKTYPE_ENEMY	= 1;
var TANK_SPEED		= 8;
var SHOT_SPEED		= 8;
// 弾を連続で撃つことができないようにする間隔
var INTERVAL_COOLDOWN			= 400;
// 戦車の移動処理の実行間隔
var INTERVAL_UPDATE_POSITION	= 40;
// 戦車が向きを変えるときの行動制限時間
var INTERVAL_TURNING			= 80;

var Tank = Class.create(Sprite, {
	initialize: function(type,direction){
		Sprite.call(this, 32, 32);
		this.image = game.assets['js/images/chara3.png'];
		this.pattern = 0;
		this.direction = direction;
		this.isMoving = false;
		this.cooldown = false;
		this.isTurning = false;
		if (type == TANKTYPE_PLAYER) {
			// 緑色の戦車
			this.frame = direction * 6;
			// キー入力の確認や戦車の移動プログラムを登録する。
			this.addEventListener('enterframe', this.updatePlayer);
		} else {
			// デザートカラーの戦車
			this.frame = direction * 6 + 3;
			this.addEventListener('enterframe', this.updateEnemy);
		}
	},
	updatePlayer: function() {
		// 自分の戦車の情報を更新する関数
		if (this.isMoving == false && this.isTurning == false) {
			this.vx = this.vy = 0;

			// 入力チェック前の向きを覚えておく。
			var prevDirection = this.direction;

			// 向き 0:下、1:左、2:右、3:上
			if (game.input.left) {
				this.direction = 1;
				this.vx = -TANK_SPEED;
			} else if (game.input.right) {
				this.direction = 2;
				this.vx = TANK_SPEED;
			} else if (game.input.up) {
				this.direction = 3;
				this.vy = -TANK_SPEED;
			} else if (game.input.down) {
				this.direction = 0;
				this.vy = TANK_SPEED;
			} else if (game.input.a) {
				if (this.cooldown == false) {
					this.cooldown = true;
					var shot = new Shot(this.x+((32-16)/2), this.y+((32-16)/2), TANKTYPE_PLAYER, this.direction);
					// 弾はshotGroupへ追加するようにします。
					shotGroup.addChild(shot);
					// 弾は間隔を空けないと撃てないよう修正。
					var timerTarget = this;
					setTimeout( function(){
						timerTarget.cooldown = false;
					}, INTERVAL_COOLDOWN);
				}
			} else if (game.input.b) {
			}

			if (prevDirection != this.direction) {
				// 向きが変わる場合は使用する絵の番号を更新。
				this.frame = this.direction * 6 + this.pattern;
				// 向きを変えた直後は動けないことにする。
				// これによりキーをちょっと押すだけならばその場で向きを変えることが出来るようになる。
				this.isTurning = true;
				var timerTarget = this;
				setTimeout( function(){
					timerTarget.isTurning = false;
				}, INTERVAL_TURNING);
			} else {
				// 向きと移動方向が同じ場合はその方向へ向かって動き始める。
				if (this.vx) {
					var x = this.x + (this.vx ? this.vx / Math.abs(this.vx) * 32 : 0);
					var y = this.y + (this.vy ? this.vy / Math.abs(this.vy) * 32 : 0);
					if (0 <= x && x < SCREEN_WIDTH && !background.hitTest(x, y)) {
						this.isMoving = true;
					}
				}
				if (this.vy) {
					var x = this.x + (this.vx ? this.vx / Math.abs(this.vx) * 32 : 0);
					var y = this.y + (this.vy ? this.vy / Math.abs(this.vy) * 32 : 0);
					if (0 <= y && y < SCREEN_HEIGHT && !background.hitTest(x, y)) {
						this.isMoving = true;
					}
				}
				if (this.isMoving) {
					this.updatePosition();
				}
			}
		}
	},
	updateEnemy: function() {
		// 敵戦車の情報を更新する関数
		// キー入力ではなくどのように動くかをプログラムで考えます。
		
	},
	updatePosition: function() {
		// 戦車の位置を更新する関数
		this.moveBy(this.vx, this.vy);
		// １ブロック分動いたかどうかを確認する。
		if ((this.vx && this.x % 32 == 0) || (this.vy && this.y % 32 == 0)) {
			this.isMoving = false;
			this.pattern = 1;
		} else {
			// ４方向、３パターンのうちどのフレームを使うかを計算する。
			this.pattern = (this.pattern + 1) % 3;
			// 続けて動く処理を行うようタスク登録を行う。
			var timerTarget = this;
			setTimeout( function(){
				timerTarget.updatePosition();
			}, INTERVAL_UPDATE_POSITION);
		}
		this.frame = this.direction * 6 + this.pattern;
	}
});

var Shot = Class.create(Sprite, {
	initialize: function(x,y,type,direction){
		Sprite.call(this, 16, 16);
		this.image = game.assets['js/images/icon0.png'];
		this.x = x;
		this.y = y;
		// 使用する画像パターンの先頭のフレーム番号をセット。
		var topFrame = 0;
		if (type == TANKTYPE_PLAYER) {
			topFrame = 48;
		} else {
			topFrame = 56;
		}
		// 向きは戦車と同じ情報を受け取る。しかし画像の格納順は一致していない。
		// 0:下、1:左、2:右、3:下
		this.vx = this.vy = 0;
		if (direction == 0) {
			this.frame = topFrame + 4;
			this.vy = SHOT_SPEED;
		} else if (direction == 1) {
			this.frame = topFrame + 2;
			this.vx = -SHOT_SPEED;
		} else if (direction == 2) {
			this.frame = topFrame + 6;
			this.vx = SHOT_SPEED;
		} else if (direction == 3) {
			this.frame = topFrame;
			this.vy = -SHOT_SPEED;
		}
		this.addEventListener('enterframe', function() {
			// スクリーンの端かまたは何かに当たるまで飛んでいく。
			if (this.checkCollision() == true) {
				// 何かに衝突したらこれ以上は処理をしない。
				return;
			}
			// フレーム毎にやることが増えてくるとプログラムが見づらくなる。
			// そのときに備えて移動処理を関数へ変更。
			this.move();
		});
	},
	move: function() {
		var x = this.x + this.vx;
		var y = this.y + this.vy;
		if (this.vx != 0) {
			if (0 <= x && x < SCREEN_WIDTH) {
				this.moveBy(this.vx, this.vy);
			} else {
				// 画面からはみ出たら弾を消す。
				shotGroup.removeChild(this);
			}
		}
		if (this.vy != 0) {
			if (0 <= y && y < SCREEN_HEIGHT) {
				this.moveBy(this.vx, this.vy);
			} else {
				// 画面からはみ出たら弾を消す。
				shotGroup.removeChild(this);
			}
		}
	},
	checkCollision: function() {
		// collision: 「コリジョン」とはモノとモノとの衝突といった意味です。
		var i;
		for (i = 0; i < enemies.length; i++) {
			if (this.intersect(enemies[i])) {
				// enchant.jsの関数intersectを使ってスプライトが重なっているかをチェックします。
				// 敵タンクに当たったら弾を消す。
				// 2012/12/10時点では敵タンクへ当たったことを伝える処理は実装していない。
				shotGroup.removeChild(this);
				return true;
			}
		}
		
		if (background.hitTest(this.x, this.y)) {
			// enchant.jsの関数hitTestを使って地形の衝突判定を行います。
			// レンガなど障害物にあたった場合の処理。
			shotGroup.removeChild(this);
			return true;
		}
		
		return false;
	}
});

function loadLevel(){
	backgroundMap = [
		[0,0,0,0,0,0,0,0,0,0],
		[0,1,1,0,0,0,0,1,1,0],
		[0,1,0,0,0,1,0,0,1,0],
		[0,0,0,1,0,0,1,0,0,0],
		[0,1,1,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,1,1,0],
		[0,0,0,1,0,0,1,0,0,0],
		[0,1,0,0,1,0,0,0,1,0],
		[0,1,1,0,0,0,0,1,1,0],
		[0,0,0,0,0,0,0,0,0,0]
	];
	
	background = new Map(32, 32);
	background.image = game.assets['js/images/tankmap.png'];
	background.loadData(backgroundMap);
	background.collisionData = backgroundMap;
}

window.onload = function() {
	
	game = new Game(SCREEN_WIDTH, SCREEN_HEIGHT);
	
	game.fps = 24;
	game.touched = false;
	game.preload('js/images/chara3.png', 'js/images/icon0.png', 'js/images/tankmap.png');
	game.keybind(90, 'a');      // ＺキーをＡボタンとみなす
	game.keybind(88, 'b');      // ＸキーをＢボタンと見なす
	
	enemies = [];	// 敵タンクの情報を保持する配列

	game.onload = function() {
		game.currentScene.backgroundColor = 'rgb(239, 228, 202)';

		loadLevel();
		
		// 緑色の戦車（自分用）のスプライトを用意。
		var myTank = new Tank(TANKTYPE_PLAYER, 0);
		// 表示位置の指定
		myTank.x = 0;
		myTank.y = 0;
		
		// デザートカラーの戦車（敵用）のスプライトを用意。
		var teki = new Tank(TANKTYPE_ENEMY, 1);
		// 表示位置の指定
		teki.x = 288;
		teki.y = 288;
		
		enemies.push(teki);

		// 用意したスプライト、バックグラウンドをシーンに関連づける。シーンはスクラッチで言えばステージのこと。
		// これで表示されるようになる。
		game.currentScene.addChild(background);
		// スプライト表示を管理しやすいようにグループを分ける。
		tekiGroup = new Group();
		myTankGroup = new Group();
		shotGroup = new Group();
		game.currentScene.addChild(tekiGroup);
		game.currentScene.addChild(myTankGroup);
		game.currentScene.addChild(shotGroup);
		
		// 戦車スプライトは用意したグループへ登録するようにする。
		tekiGroup.addChild(teki);
		myTankGroup.addChild(myTank);
	};
	game.start();
};
