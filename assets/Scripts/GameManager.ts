import Tile from "./Tile";
import {BoosterType, TileType} from "./GameTypes";
import UiManager from "./UiManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {
    @property(cc.Prefab)
    private tilePrefab: cc.Prefab = null;

    @property(cc.Node)
    private gameField: cc.Node = null;

    @property({ type: cc.Integer })
    private gridWidth: number = 8;

    @property({ type: cc.Integer })
    private gridHeight: number = 8;

    @property({ type: cc.Float })
    private tileSize: number = 80;

    @property(cc.Component)
    private uiManager: UiManager = null;

    private grid: cc.Node[][] = [];
    private selectedTile: cc.Node = null;
    private isAnimationPlaying: boolean = false;
    private score: number = 0;
    private movesLeft: number = 30;
    private activeBooster: BoosterType = BoosterType.NONE;
    private targetTile: cc.Node = null;
    private swapBoosterCount: number = 3;
    private bombBoosterCount: number = 3;

    public onSwapBoosterActivated: () => void = null;
    public onBombBoosterActivated: () => void = null;

    protected onLoad(): void {
        this.initGame();
    }

    private initGame(): void {
        this.initGrid();
        this.createGrid();
        this.updateUI();
    }

    private initGrid() {
        try {
            this.grid = new Array(this.gridHeight);
            for (let y = 0; y < this.gridHeight; y++) {
                this.grid[y] = new Array(this.gridWidth).fill(null);
            }
        } catch (error) {
            cc.error("Grid init error:", error);
            this.grid = [];
        }
    }

    private createGrid(): void {
        this.gameField.removeAllChildren();

        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.createTileAt(x, y);
            }
        }
    }

    private createTileAt(x: number, y: number): void {
        const tile = cc.instantiate(this.tilePrefab);
        tile.parent = this.gameField;
        tile.setPosition(this.getPositionForTile(x, y));

        const tileComp = tile.getComponent(Tile);
        const randomType = Math.floor(Math.random() * Object.keys(TileType).length / 2) as TileType;
        tileComp.init(x, y, randomType, BoosterType.NONE);

        this.grid[y][x] = tile;
    }

    private getPositionForTile(x: number, y: number): cc.Vec2 {
        // Учитываем что y=0 это низ, y=gridHeight-1 - верх
        const offsetX = (x - this.gridWidth/2 + 0.5) * this.tileSize;
        const offsetY = (y - this.gridHeight/2 + 0.5) * this.tileSize;
        return cc.v2(offsetX, offsetY);
    }

    public async onTileClick(tile: cc.Node): Promise<void> {
        if (this.isAnimationPlaying || this.movesLeft <= 0) return;

        const tileComp = tile.getComponent('Tile');
        const x = tileComp.gridX;
        const y = tileComp.gridY;

        
        switch (this.activeBooster) {
            case BoosterType.SWAP:
                //TODO add implementation swap booster
                break;

            case BoosterType.BOMB:
                await this.handleBombBooster(tile);
                break;

            default:
                await this.handleNormalClick(tile);
                break;
        }
    }

    public async handleNormalClick(tile: cc.Node): Promise<void> {
        if (this.isAnimationPlaying || this.movesLeft <= 0 || !tile?.isValid) return;

        try {
            const tileComp = tile.getComponent(Tile);
            if (!tileComp) return;

            // 1. Находим только тайлы того же цвета
            const tilesToRemove = this.findSameColorTiles(tileComp.gridX, tileComp.gridY, tileComp.tileType);

            if (tilesToRemove.length < 2) return;

            // 2. Удаляем с анимацией
            this.movesLeft--;
            await this.removeTilesSafely(tilesToRemove);
            await this.fillEmptySpaces();
            this.updateUI();
        } catch (error) {
            cc.error("Tile click error:", error);
        }
    }

    private findSameColorTiles(startX: number, startY: number, targetType: TileType): cc.Node[] {
        const tiles: cc.Node[] = [];
        const visited = new Set<string>();
        const queue: [number, number][] = [[startX, startY]];

        while (queue.length > 0) {
            const [x, y] = queue.shift()!;
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            if (!this.isValidPosition(x, y)) continue;

            const tile = this.grid[y]?.[x];
            if (!tile?.isValid) continue;

            const tileComp = tile.getComponent(Tile);
            if (!tileComp || tileComp.tileType !== targetType) continue;

            visited.add(key);
            tiles.push(tile);

            // Добавляем соседей
            queue.push([x + 1, y]);
            queue.push([x - 1, y]);
            queue.push([x, y + 1]);
            queue.push([x, y - 1]);
        }

        return tiles;
    }

    private async removeTilesSafely(tiles: cc.Node[]): Promise<void> {
        if (!tiles?.length) return;

        this.isAnimationPlaying = true;

        try {
            // 1. Подсветка перед удалением
            await this.highlightTiles(tiles);

            // 2. Удаляем с анимацией
            const destroyPromises = tiles.map(tile => {
                if (!tile.isValid) return Promise.resolve();

                const tileComp = tile.getComponent(Tile);
                if (!tileComp) return Promise.resolve();

                // Помечаем как null в сетке перед анимацией
                this.grid[tileComp.gridY][tileComp.gridX] = null;
                return tileComp.explode();
            });

            await Promise.all(destroyPromises);

            // 3. Начисляем очки
            this.addScore(tiles.length * 10);
        } catch (error) {
            cc.error("Remove tiles error:", error);
        } finally {
            this.isAnimationPlaying = false;
        }
    }

    private async highlightTiles(tiles: cc.Node[]): Promise<void> {
        await Promise.all(
            tiles.map(tile => {
                return new Promise<void>(resolve => {
                    if (!tile.isValid) return resolve();

                    cc.tween(tile)
                        .to(0.1, { scale: 1.2, color: cc.Color.RED })
                        .to(0.1, { scale: 1.0, color: cc.Color.WHITE })
                        .call(resolve)
                        .start();
                });
            })
        );
    }

    private isValidPosition(x: number, y: number): boolean {
        return x >= 0 && x < this.gridWidth &&
            y >= 0 && y < this.gridHeight;
    }

    private findMatchesAt(x: number, y: number): cc.Node[] {
        if (!this.isValidPosition(x, y) || !this.grid[y]?.[x]) {
            return [];
        }

        try {
            const tileType = this.grid[y][x].getComponent(Tile).tileType;
            const horizontalMatches = this.findMatchesInDirection(x, y, 1, 0, tileType);
            const verticalMatches = this.findMatchesInDirection(x, y, 0, 1, tileType);

            return [...horizontalMatches, ...verticalMatches];
        } catch (error) {
            cc.error(`Error finding matches at (${x},${y}):`, error);
            return [];
        }
    }
    private findMatchesInDirection(
        x: number,
        y: number,
        dx: number,
        dy: number,
        tileType: TileType
    ): cc.Node[] {
        const matches: cc.Node[] = [];

        // Поиск в положительном направлении
        let cx = x + dx;
        let cy = y + dy;
        while (this.isValidPosition(cx, cy)) {
            const tile = this.grid[cy][cx];
            if (!tile || tile.getComponent(Tile).tileType !== tileType) break;
            matches.push(tile);
            cx += dx;
            cy += dy;
        }

        // Поиск в отрицательном направлении
        cx = x - dx;
        cy = y - dy;
        while (this.isValidPosition(cx, cy)) {
            const tile = this.grid[cy][cx];
            if (!tile || tile.getComponent(Tile).tileType !== tileType) break;
            matches.push(tile);
            cx -= dx;
            cy -= dy;
        }

        return matches;
    }

    private async handleBombBooster(tile: cc.Node): Promise<void> {
        const tileComp = tile.getComponent('Tile');
        const x = tileComp.gridX;
        const y = tileComp.gridY;

        // Собираем все соседние тайлы (3x3 область)
        const tilesToRemove: cc.Node[] = [tile];

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;

                if (this.isValidPosition(nx, ny)) {
                    tilesToRemove.push(this.grid[ny][nx]);
                }
            }
        }

        this.bombBoosterCount--;
        await this.removeTilesSafely(tilesToRemove);
        await this.fillEmptySpaces();
        this.resetActiveBooster();
        this.updateUI();
    }

    private async fillEmptySpaces(): Promise<void> {
        if (this.isAnimationPlaying) return;
        this.isAnimationPlaying = true;

        try {
            const movePromises: Promise<void>[] = [];

            for (let x = 0; x < this.gridWidth; x++) {
                let emptySpots = 0;
                for (let y = 0; y < this.gridHeight; y++) { 
                    if (this.grid[y][x] === null) {
                        emptySpots++;
                    } else if (emptySpots > 0) {
                        const tile = this.grid[y][x];
                        const newY = y - emptySpots;
                        
                        this.grid[y][x] = null;
                        this.grid[newY][x] = tile;

                        const tileComp = tile.getComponent(Tile);
                        tileComp.gridY = newY;

                        // Анимация перемещения
                        movePromises.push(tileComp.moveTo(x, newY));
                    }
                }
            }

            await Promise.all(movePromises);
            const createPromises: Promise<void>[] = [];

            for (let x = 0; x < this.gridWidth; x++) {
                
                let emptyTopSpots = 0;
                for (let y = this.gridHeight - 1; y >= 0; y--) {
                    if (this.grid[y][x] === null) {
                        emptyTopSpots++;
                    } else {
                        break;
                    }
                }
                
                for (let i = 0; i < emptyTopSpots; i++) {
                    const targetY = this.gridHeight - 1 - i;
                    const newTile = cc.instantiate(this.tilePrefab);
                    newTile.parent = this.gameField;

                    const tileComp = newTile.getComponent(Tile);
                    const randomType = Math.floor(Math.random() * Object.keys(TileType).length / 2) as TileType;
                    tileComp.init(x, targetY, randomType, BoosterType.NONE);
                    
                    const startY = targetY + emptyTopSpots - i;
                    const startPos = this.getPositionForTile(x, startY);
                    newTile.setPosition(startPos);
                    
                    this.grid[targetY][x] = newTile;
                    
                    createPromises.push(tileComp.moveTo(x, targetY));
                }
            }

            await Promise.all(createPromises);
            
            const newMatches = this.findAllMatches();
            if (newMatches.length >= 3) {
                await this.removeMatches(newMatches);
                await this.fillEmptySpaces();
            }
        } finally {
            this.isAnimationPlaying = false;
        }
    }

    private findAllMatches(): cc.Node[] {
        const matchedTiles = new Set<cc.Node>();

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x] === null) continue;

                const matches = this.findMatchesAt(x, y);
                if (matches.length >= 3) {
                    matches.forEach(tile => matchedTiles.add(tile));
                }
            }
        }

        return Array.from(matchedTiles);
    }

    private async removeMatches(matches: cc.Node[]): Promise<void> {
        if (matches.length === 0 || this.isAnimationPlaying) return;

        this.isAnimationPlaying = true;

        try {
            const uniqueMatches = [...new Set(matches)];
            this.addScore(uniqueMatches.length * 10);

            // Анимация взрыва
            await Promise.all(uniqueMatches.map(tile => {
                const tileComp = tile.getComponent(Tile);
                return tileComp.explode();
            }));

            // Удаление из сетки
            uniqueMatches.forEach(tile => {
                const tileComp = tile.getComponent(Tile);
                this.grid[tileComp.gridY][tileComp.gridX] = null;
                tile.destroy();
            });
        } finally {
            this.isAnimationPlaying = false;
        }
    }

    private addScore(points: number): void {
        this.score += points;
        this.updateUI();
    }

    private updateUI(): void {
        this.uiManager.SetScoreCount(this.score);
        this.uiManager.SetMoves(this.movesLeft);
        this.uiManager.SetSwapBoosterCount(this.swapBoosterCount);
        this.uiManager.SetBoombBoosterCount(this.bombBoosterCount);
    }

    public tryUseSwapBooster(): boolean {
        /*if (this.swapBoosterCount > 0) {
            this.activeBooster = BoosterType.SWAP;
            if (this.onSwapBoosterActivated) {
                this.onSwapBoosterActivated();
            }
            return true;
        }*/
        return false;
    }

    public tryUseBombBooster(): boolean {
        if (this.bombBoosterCount > 0) {
            this.activeBooster = BoosterType.BOMB;
            if (this.onBombBoosterActivated) {
                this.onBombBoosterActivated();
            }
            return true;
        }
        return false;
    }

    private resetActiveBooster(): void {
        if (this.targetTile) {
            this.targetTile.getComponent(Tile)?.removeHighlight();
            this.targetTile = null;
        }
        this.activeBooster = BoosterType.NONE;
    }
}