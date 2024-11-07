// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 资源管理器
const resources = {
    sounds: {
        shoot: document.getElementById('shootSound'),
        explosion: document.getElementById('explosionSound'),
        bgm: document.getElementById('bgm')
    }
};

// 游戏状态
const GAME_STATE = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3
};

// 添加奖励类型枚举
const POWER_UP_TYPE = {
    DOUBLE_SCORE: 0,
    RAPID_FIRE: 1,
    SHIELD: 2
};

// 添加奖励类
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.speed = 2;
        this.angle = 0;
    }

    draw() {
        ctx.save();
        this.angle += 0.05;
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.angle);
        
        switch(this.type) {
            case POWER_UP_TYPE.DOUBLE_SCORE:
                // 双倍分数 - 金色星星
                this.drawStar('#ffd700');
                break;
            case POWER_UP_TYPE.RAPID_FIRE:
                // 快速射击 - 红色闪电
                this.drawLightning('#ff4444');
                break;
            case POWER_UP_TYPE.SHIELD:
                // 护盾 - 蓝色盾牌
                this.drawShield('#4488ff');
                break;
        }
        
        ctx.restore();
    }

    drawStar(color) {
        ctx.beginPath();
        for(let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 10,
                      Math.sin((18 + i * 72) * Math.PI / 180) * 10);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 5,
                      Math.sin((54 + i * 72) * Math.PI / 180) * 5);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }

    drawLightning(color) {
        ctx.beginPath();
        ctx.moveTo(-5, -10);
        ctx.lineTo(5, -5);
        ctx.lineTo(0, 0);
        ctx.lineTo(5, 5);
        ctx.lineTo(-5, 10);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }

    drawShield(color) {
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, -5);
        ctx.lineTo(8, 5);
        ctx.lineTo(0, 10);
        ctx.lineTo(-8, 5);
        ctx.lineTo(-8, -5);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }

    update() {
        this.y += this.speed;
    }
}

// 游戏主对象
const game = {
    state: GAME_STATE.MENU,
    player: null,
    enemies: [],
    explosions: [],
    lastEnemySpawn: 0,
    enemySpawnInterval: 1000,
    score: 0,
    lives: 3,
    powerUps: [],
    doubleScoreTime: 0,
    rapidFireTime: 0,
    shieldTime: 0,
    level: 1,
    enemySpeedMultiplier: 1,
    mobileControls: {
        left: false,
        right: false
    },
    
    init() {
        this.player = new Player();
        this.enemies = [];
        this.explosions = [];
        this.score = 0;
        this.lives = 3;
        this.state = GAME_STATE.PLAYING;
        resources.sounds.bgm.play();
        this.powerUps = [];
        this.doubleScoreTime = 0;
        this.rapidFireTime = 0;
        this.shieldTime = 0;
        this.initMobileControls();
    },
    
    initMobileControls() {
        // 检测是否为移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const mobileControls = document.getElementById('mobileControls');
        
        if (isMobile) {
            mobileControls.style.display = 'flex';
            
            // 左移按钮
            const leftBtn = document.getElementById('leftBtn');
            leftBtn.addEventListener('touchstart', () => this.mobileControls.left = true);
            leftBtn.addEventListener('touchend', () => this.mobileControls.left = false);
            
            // 右移按钮
            const rightBtn = document.getElementById('rightBtn');
            rightBtn.addEventListener('touchstart', () => this.mobileControls.right = true);
            rightBtn.addEventListener('touchend', () => this.mobileControls.right = false);
            
            // 发射按钮
            const shootBtn = document.getElementById('shootBtn');
            shootBtn.addEventListener('touchstart', () => {
                if (this.state === GAME_STATE.PLAYING) {
                    this.player.shoot();
                    resources.sounds.shoot.currentTime = 0;
                    resources.sounds.shoot.play();
                }
            });
        }
    },
    
    increaseDifficulty() {
        if (this.score > this.level * 1000) {  // 每1000分升级一次
            this.level++;
            this.enemySpeedMultiplier += 0.1;
            this.enemySpawnInterval = Math.max(500, this.enemySpawnInterval - 50);
        }
    }
};

// 添加成就系统
const achievements = {
    kills: {
        small: 0,
        medium: 0,
        large: 0
    },
    milestones: {
        '初出茅庐': { score: 1000, achieved: false },
        '战斗专家': { score: 5000, achieved: false },
        '空战王者': { score: 10000, achieved: false }
    },
    
    checkMilestones(score) {
        for (let [name, milestone] of Object.entries(this.milestones)) {
            if (!milestone.achieved && score >= milestone.score) {
                milestone.achieved = true;
                this.showAchievement(name);
            }
        }
    },
    
    showAchievement(name) {
        // 显示成就获得提示
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 215, 0, 0.9);
            padding: 10px 20px;
            border-radius: 5px;
            color: #000;
            animation: fadeOut 3s forwards;
        `;
        notification.textContent = `获得成就：${name}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
};

// 玩家飞机类
class Player {
    constructor() {
        this.width = 40;
        this.height = 50;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 5;
        this.bullets = [];
        this.engineFlame = 0;
        this.isInvulnerable = false;
        this.invulnerableTime = 0;
        this.skills = {
            bomb: {
                count: 3,
                cooldown: false
            },
            laser: {
                count: 2,
                cooldown: false
            }
        };
    }

    draw() {
        ctx.save();
        
        // 无敌状态闪烁效果
        if (this.isInvulnerable && Math.floor(Date.now() / 100) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // 绘制引擎火焰动画
        this.engineFlame = (this.engineFlame + 0.2) % 2;
        const flameHeight = 10 + Math.sin(this.engineFlame * Math.PI) * 5;
        
        // 绘制引擎火焰
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.3, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.5, this.y + this.height + flameHeight);
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height);
        ctx.fillStyle = '#ff6600';
        ctx.fill();
        
        // 绘制飞机主体（更详细的战斗机形状）
        ctx.beginPath();
        // 机头
        ctx.moveTo(this.x + this.width * 0.5, this.y);
        // 右翼
        ctx.lineTo(this.x + this.width * 0.9, this.y + this.height * 0.6);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.8);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height);
        // 尾部
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height);
        // 左翼
        ctx.lineTo(this.x, this.y + this.height * 0.8);
        ctx.lineTo(this.x + this.width * 0.1, this.y + this.height * 0.6);
        ctx.closePath();
        
        // 飞机渐变色
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#8af');
        gradient.addColorStop(1, '#48f');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 添加机身细节
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }

    shoot() {
        this.bullets.push(new Bullet(this.x + this.width / 2, this.y));
        if (game.rapidFireTime > Date.now()) {
            // 快速射击状态下额外发射两颗子弹
            this.bullets.push(new Bullet(this.x + this.width / 4, this.y));
            this.bullets.push(new Bullet(this.x + this.width * 3/4, this.y));
        }
    }

    hit() {
        if (!this.isInvulnerable && game.shieldTime < Date.now()) {
            game.lives--;
            if (game.lives <= 0) {
                game.state = GAME_STATE.GAME_OVER;
                return;
            }
            this.isInvulnerable = true;
            setTimeout(() => this.isInvulnerable = false, 2000);
        }
    }

    useBomb() {
        if (this.skills.bomb.count > 0 && !this.skills.bomb.cooldown) {
            this.skills.bomb.count--;
            game.enemies.forEach(enemy => {
                game.explosions.push(new Explosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2));
                game.score += enemy.score;
            });
            game.enemies = [];
            
            this.skills.bomb.cooldown = true;
            setTimeout(() => this.skills.bomb.cooldown = false, 5000);
        }
    }
}

// 敌机类
class Enemy {
    constructor(type) {
        this.type = type;
        this.setupType();
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.rotationAngle = 0;
    }

    setupType() {
        switch(this.type) {
            case 1:
                this.width = 30;
                this.height = 30;
                this.speed = 3;
                this.hp = 1;
                this.score = 100;
                this.color = '#ff4444';
                break;
            case 2:
                this.width = 40;
                this.height = 40;
                this.speed = 2;
                this.hp = 3;
                this.score = 300;
                this.color = '#ff0000';
                break;
            case 3:
                this.width = 60;
                this.height = 60;
                this.speed = 1;
                this.hp = 5;
                this.score = 500;
                this.color = '#990000';
                break;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        this.rotationAngle += 0.02;
        ctx.rotate(Math.PI); // 旋转180度，使敌机朝下
        
        // 根据类型绘制不同的敌机形状
        switch(this.type) {
            case 1: // 小型战斗机
                this.drawFighter(this.width, '#f44');
                break;
            case 2: // 中型战斗机
                this.drawBomber(this.width, '#f22');
                break;
            case 3: // 大型战斗机
                this.drawBoss(this.width, '#900');
                break;
        }
        
        ctx.restore();
    }

    drawFighter(size, color) {
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.lineTo(size/4, -size/4);
        ctx.lineTo(size/4, size/4);
        ctx.lineTo(0, size/2);
        ctx.lineTo(-size/4, size/4);
        ctx.lineTo(-size/4, -size/4);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }

    drawBomber(size, color) {
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.lineTo(size/2, 0);
        ctx.lineTo(size/3, size/2);
        ctx.lineTo(-size/3, size/2);
        ctx.lineTo(-size/2, 0);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }

    drawBoss(size, color) {
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.lineTo(size/2, -size/4);
        ctx.lineTo(size/2, size/4);
        ctx.lineTo(size/4, size/2);
        ctx.lineTo(-size/4, size/2);
        ctx.lineTo(-size/2, size/4);
        ctx.lineTo(-size/2, -size/4);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }

    update() {
        this.y += this.speed;
    }

    hit() {
        this.hp--;
        if (this.hp <= 0) {
            // 随机掉落奖励，概率20%
            if (Math.random() < 0.2) {
                const powerUpType = Math.floor(Math.random() * 3);
                game.powerUps.push(new PowerUp(this.x, this.y, powerUpType));
            }
            return true;
        }
        return false;
    }
}

// 子弹类
class Bullet {
    constructor(x, y) {
        this.width = 4;
        this.height = 12;
        this.x = x - this.width / 2;
        this.y = y;
        this.speed = 7;
    }

    draw() {
        ctx.save();
        
        // 绘制子弹光晕
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, 
                this.width * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fill();
        
        // 绘制子弹主体
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.restore();
    }
}

// 爆炸效果类
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.maxFrame = 10;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.frame * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${255 - this.frame * 25}, 0, ${1 - this.frame/this.maxFrame})`;
        ctx.fill();
        this.frame++;
        ctx.restore();
    }
}

// 更新和绘制所有游戏对象
function updateAndDraw() {
    // 修改移动控制逻辑
    if (keys['ArrowLeft'] || game.mobileControls.left) {
        game.player.x = Math.max(0, game.player.x - game.player.speed);
    }
    if (keys['ArrowRight'] || game.mobileControls.right) {
        game.player.x = Math.min(canvas.width - game.player.width, game.player.x + game.player.speed);
    }

    // 生成敌机
    if (Date.now() - game.lastEnemySpawn > game.enemySpawnInterval) {
        const rand = Math.random();
        let type;
        if (rand < 0.7) type = 1;        // 70% 几率出现小型敌机
        else if (rand < 0.9) type = 2;    // 20% 几率出现中型敌机
        else type = 3;                    // 10% 几率出现大型敌机
        
        game.enemies.push(new Enemy(type));
        game.lastEnemySpawn = Date.now();
    }

    // 更新和绘制子弹
    game.player.bullets.forEach((bullet, bulletIndex) => {
        bullet.y -= bullet.speed;
        bullet.draw();
        
        // 删除超出屏幕的子弹
        if (bullet.y < 0) {
            game.player.bullets.splice(bulletIndex, 1);
        }

        // 检测子弹击中敌机
        game.enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                game.player.bullets.splice(bulletIndex, 1);
                if (enemy.hit()) {
                    game.explosions.push(new Explosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2));
                    game.enemies.splice(enemyIndex, 1);
                    game.score += enemy.score;
                    resources.sounds.explosion.currentTime = 0;
                    resources.sounds.explosion.play();
                }
            }
        });
    });

    // 更新和绘制敌机
    game.enemies.forEach((enemy, index) => {
        enemy.update();
        enemy.draw();
        
        // 删除超出屏幕的敌机
        if (enemy.y > canvas.height) {
            game.enemies.splice(index, 1);
        }
    });

    // 更新和绘制爆炸效果
    game.explosions.forEach((explosion, index) => {
        explosion.draw();
        if (explosion.frame >= explosion.maxFrame) {
            game.explosions.splice(index, 1);
        }
    });

    // 绘制玩家
    game.player.draw();

    // 检测玩家与敌机碰撞
    game.enemies.forEach((enemy, index) => {
        if (game.player.x < enemy.x + enemy.width &&
            game.player.x + game.player.width > enemy.x &&
            game.player.y < enemy.y + enemy.height &&
            game.player.y + game.player.height > enemy.y) {
            game.player.hit();
        }
    });

    // 绘制分数和生命值
    ctx.fillStyle = '#fff';  // 改为白色文字
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`分数: ${game.score}`, 10, 30);
    ctx.fillText(`生命: ${game.lives}`, 10, 60);

    // 更新和绘制奖励
    game.powerUps.forEach((powerUp, index) => {
        powerUp.update();
        powerUp.draw();
        
        // 检测玩家获得奖励
        if (game.player.x < powerUp.x + powerUp.width &&
            game.player.x + game.player.width > powerUp.x &&
            game.player.y < powerUp.y + powerUp.height &&
            game.player.y + game.player.height > powerUp.y) {
            
            switch(powerUp.type) {
                case POWER_UP_TYPE.DOUBLE_SCORE:
                    game.doubleScoreTime = Date.now() + 10000; // 10秒双倍分数
                    break;
                case POWER_UP_TYPE.RAPID_FIRE:
                    game.rapidFireTime = Date.now() + 5000;    // 5秒快速射击
                    break;
                case POWER_UP_TYPE.SHIELD:
                    game.shieldTime = Date.now() + 8000;       // 8秒护盾
                    break;
            }
            
            game.powerUps.splice(index, 1);
        }
        
        // 删除超出屏幕的奖励
        if (powerUp.y > canvas.height) {
            game.powerUps.splice(index, 1);
        }
    });

    // 显示当前激活的奖励状态
    let statusY = 90;
    if (game.doubleScoreTime > Date.now()) {
        ctx.fillText('双倍分数!', 10, statusY);
        statusY += 30;
    }
    if (game.rapidFireTime > Date.now()) {
        ctx.fillText('快速射击!', 10, statusY);
        statusY += 30;
    }
    if (game.shieldTime > Date.now()) {
        ctx.fillText('护盾激活!', 10, statusY);
    }

    game.increaseDifficulty();

    // 显示当前等级
    ctx.fillText(`等级: ${game.level}`, 10, 120);
}

// 键盘控制
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        if (game.state === GAME_STATE.PLAYING) {
            game.player.shoot();
            resources.sounds.shoot.currentTime = 0;
            resources.sounds.shoot.play();
        }
    }
    if (e.key === 'Escape') {
        if (game.state === GAME_STATE.PLAYING) {
            game.state = GAME_STATE.PAUSED;
            resources.sounds.bgm.pause();
        } else if (game.state === GAME_STATE.PAUSED) {
            game.state = GAME_STATE.PLAYING;
            resources.sounds.bgm.play();
            gameLoop();
        }
    }
});
document.addEventListener('keyup', (e) => keys[e.key] = false);

// 游戏主循环
function gameLoop() {
    if (game.state === GAME_STATE.PLAYING) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateAndDraw();
        requestAnimationFrame(gameLoop);
    } else if (game.state === GAME_STATE.GAME_OVER) {
        drawGameOver();
    } else if (game.state === GAME_STATE.PAUSED) {
        drawPause();
    }
}

// 添加游戏结束画面
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width/2, canvas.height/2 - 60);
    
    ctx.font = '24px Arial';
    ctx.fillText(`最终得分: ${game.score}`, canvas.width/2, canvas.height/2 - 20);
    ctx.fillText(`最高等级: ${game.level}`, canvas.width/2, canvas.height/2 + 20);
    
    // 绘制重新开始按钮
    const btnY = canvas.height/2 + 80;
    const btnWidth = 200;
    const btnHeight = 50;
    const btnX = canvas.width/2 - btnWidth/2;
    
    // 绘制按钮背景
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    
    // 绘制按钮文字
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('重新开始', canvas.width/2, btnY + btnHeight/2 + 8);
    
    // 添加点击/触摸事件监听
    const handleRestart = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (x >= btnX && x <= btnX + btnWidth &&
            y >= btnY && y <= btnY + btnHeight) {
            canvas.removeEventListener('click', handleRestart);
            canvas.removeEventListener('touchend', handleRestart);
            startGame();
        }
    };
    
    canvas.addEventListener('click', handleRestart);
    canvas.addEventListener('touchend', handleRestart);
}

// 添加暂停画面
function drawPause() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', canvas.width/2, canvas.height/2);
    ctx.font = '20px Arial';
    ctx.fillText('按ESC继续', canvas.width/2, canvas.height/2 + 40);
}

// 开始界面
function drawMenu() {
    ctx.fillStyle = '#000';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('飞机大战', canvas.width/2, canvas.height/2 - 50);
    ctx.font = '20px Arial';
    ctx.fillText('点击开始游戏', canvas.width/2, canvas.height/2);
    ctx.fillText('使用方向键移动，空格键发射', canvas.width/2, canvas.height/2 + 30);
}

// 初始化
function init() {
    const startButton = document.getElementById('startButton');
    const gameMenu = document.getElementById('gameMenu');
    
    // 阻止移动端双击缩放
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    
    startButton.addEventListener('click', () => {
        if (game.state === GAME_STATE.MENU || game.state === GAME_STATE.GAME_OVER) {
            gameMenu.style.display = 'none';
            startGame();
        }
    });
}

// 开始游戏
function startGame() {
    game.init();
    gameLoop();
}

// 初始化游戏
init();