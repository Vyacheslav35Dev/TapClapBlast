import Tile from "./Tile";
import {BoosterType, TileType} from "./GameTypes";
import UiManager from "./ui/UiManager";

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
    
    private activeBooster: BoosterType = BoosterType.NONE;
    private targetTile: cc.Node = null;
    
    private score: number = 0;
    private movesLeft: number = 30;
    private swapBoosterCount: number = 3;
    private bombBoosterCount: number = 99;

    private curScore: number = 0;
    private curMovesLeft: number = 0;
    private curSwapBoosterCount: number = 0;
    private curBombBoosterCount: number = 0;

    @property(cc.Integer) 
    targetScore: number = 1000; // Целевые очки
    @property(cc.Integer) 
    maxMoves: number = 30; // Лимит ходов


    protected onLoad(): void {
        // Initialize the game when the component loads
        this.initGame();
    }

    /**
     * Initializes the game by setting up event listeners,
     * initializing the grid, and starting the game.
     */
    private initGame(): void {
        this.setupListeners();   // Set up UI event handlers
        this.initGrid();         // Prepare the game grid
        this.startGame();        // Begin a new game session
    }

    /**
     * Starts or restarts the game by resetting variables,
     * creating the grid, and updating the UI.
     */
    private startGame(): void {
        console.log("Starting new game...");

        // Reset current score and moves to initial values
        this.curScore = 0; // Or set to initial score if different
        this.curMovesLeft = this.movesLeft; // Reset moves left to initial value

        // Reset booster counts to their starting values
        this.curBombBoosterCount = this.bombBoosterCount;
        this.curSwapBoosterCount = this.swapBoosterCount;

        // Reset animation state flag
        this.isAnimationPlaying = false;

        // Reset any active boosters or temporary states
        this.resetActiveBooster();

        // Create a fresh grid for the new game
        this.createGrid();

        // Update all UI elements to reflect the reset state
        this.updateUI();
    }

    /**
     * Sets up event listeners for booster activation and restart actions.
     */
    private setupListeners(): void {
        // Assign callback functions for booster activation buttons
        this.uiManager.onSwapBoosterActivate = () => this.tryUseSwapBooster();
        this.uiManager.onBombBoosterActivate = () => this.tryUseBombBooster();

        // Assign callback for restart button to restart the game
        this.uiManager.onRestartGame = () => {
            this.startGame();
        };
    }

    /**
     * Cleans up event listeners when the component is destroyed to prevent memory leaks.
     */
    protected onDestroy(): void {
        // Remove callbacks to avoid dangling references
        this.uiManager.onSwapBoosterActivate = null;
        this.uiManager.onBombBoosterActivate = null;
        this.uiManager.onRestartGame = null;
    }

    /**
     * Initializes the grid array with null values.
     * Uses try-catch to handle potential errors during array creation.
     */
    private initGrid(): void {
        try {
            // Create a 2D array with dimensions gridHeight x gridWidth
            this.grid = new Array(this.gridHeight);
            for (let y = 0; y < this.gridHeight; y++) {
                this.grid[y] = new Array(this.gridWidth).fill(null);
            }
        } catch (error) {
            // Log any errors encountered during grid initialization
            cc.error("Grid initialization error:", error);
            // Fallback to an empty grid to prevent further issues
            this.grid = [];
        }
    }

    /**
     * Creates the game grid by removing existing tiles and instantiating new ones.
     */
    private createGrid(): void {
        // Remove all existing children (tiles) from the game field node
        this.gameField.removeAllChildren();

        // Loop through each position in the grid
        for (let y = 0; y < this.gridHeight; y++) {
            // Initialize the row array
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                // Create a tile at each position
                this.createTileAt(x, y);
            }
        }
    }

    /**
     * Instantiates a tile at the specified grid coordinates.
     * @param x - The x-coordinate in the grid
     * @param y - The y-coordinate in the grid
     */
    private createTileAt(x: number, y: number): void {
        // Instantiate a new tile from the prefab
        const tile = cc.instantiate(this.tilePrefab);
        // Set the parent node to be the game field container
        tile.parent = this.gameField;
        // Position the tile based on its grid coordinates
        tile.setPosition(this.getPositionForTile(x, y));

        // Get the Tile component attached to the instantiated node
        const tileComp = tile.getComponent(Tile);

        // Generate a random tile type from available types
        const totalTypes = Object.keys(TileType).length / 2; // Assuming enum has numeric keys as well
        const randomTypeIndex = Math.floor(Math.random() * totalTypes) as TileType;

        // Initialize the tile with its position, type, and default booster type
        tileComp.init(x, y, randomTypeIndex, BoosterType.NONE);

        // Store reference to the created tile in the grid array
        this.grid[y][x] = tile;
    }

    /**
     * Calculates the position of a tile based on its grid coordinates.
     * Assumes (0,0) is at the bottom-left corner.
     * @param x - The x-coordinate in the grid
     * @param y - The y-coordinate in the grid
     * @returns A cc.Vec2 representing the world position for the tile
     */
    private getPositionForTile(x: number, y: number): cc.Vec2 {
        // Calculate offsets so that (0,0) is at bottom-left,
        // with tiles centered within their cell.

        const offsetX = (x - this.gridWidth / 2 + 0.5) * this.tileSize;
        const offsetY = (y - this.gridHeight / 2 + 0.5) * this.tileSize;

        return cc.v2(offsetX, offsetY);
    }

    /**
     * Handles the click event on a tile.
     * Executes different actions based on the active booster type.
     * @param tile - The clicked tile node
     */
    public async onTileClick(tile: cc.Node): Promise<void> {
        // Prevent action if an animation is ongoing or no moves left
        if (this.isAnimationPlaying || this.curMovesLeft <= 0) return;

        const tileComp = tile.getComponent('Tile');
        if (!tileComp) return;

        const x = tileComp.gridX;
        const y = tileComp.gridY;

        switch (this.activeBooster) {
            case BoosterType.SWAP:
                // TODO: Implement swap booster logic
                break;

            case BoosterType.BOMB:
                await this.handleBombBooster(tile);
                break;

            default:
                await this.handleNormalClick(tile);
                break;
        }
    }

    /**
     * Handles a normal tile click, attempting to remove connected tiles of the same color.
     * @param tile - The clicked tile node
     */
    public async handleNormalClick(tile: cc.Node): Promise<void> {
        // Check for ongoing animations or no remaining moves
        if (this.isAnimationPlaying || this.curMovesLeft <= 0 || !tile?.isValid) return;

        try {
            const tileComp = tile.getComponent(Tile);
            if (!tileComp) return;

            // Find all connected tiles of the same color starting from the clicked tile
            const tilesToRemove = this.findSameColorTiles(tileComp.gridX, tileComp.gridY, tileComp.tileType);

            // Require at least 3 connected tiles to remove
            if (tilesToRemove.length < 3) return;

            // Decrement remaining moves
            this.curMovesLeft--;

            // Remove tiles with animation and update game state
            await this.removeTilesSafely(tilesToRemove);
            await this.fillEmptySpaces();
            this.updateUI();
            this.checkStateWinOrLose();

        } catch (error) {
            cc.error("Error during tile click handling:", error);
        }
    }

    /**
     * Checks whether the player has won or lost the game.
     */
    private checkStateWinOrLose(): void {
        // Check for win condition
        if (this.curScore >= this.targetScore) {
            this.isAnimationPlaying = true;
            this.uiManager.showWinPanel();
            return;
        }

        // Check for lose condition: no moves left or no valid moves available
        if (this.curMovesLeft <= 0 || !this.hasValidMoves()) {
            this.isAnimationPlaying = true;
            this.uiManager.showLosePanel();
        }
    }

    /**
     * Determines if there are any valid moves remaining on the grid.
     * @returns true if at least one move is possible; false otherwise.
     */
    private hasValidMoves(): boolean {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const tile = this.grid[y][x];
                if (!tile) continue;

                const tileComp = tile.getComponent(Tile);
                if (!tileComp) continue;

                // Check for at least 3 connected tiles of the same type
                const sameColorTiles = this.findSameColorTiles(x, y, tileComp.tileType);
                if (sameColorTiles.length >= 3) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Finds all connected tiles of the same type starting from a position.
     * Uses BFS to traverse neighboring tiles.
     * @param startX - Starting x-coordinate
     * @param startY - Starting y-coordinate
     * @param targetType - The type of tiles to find
     * @returns Array of cc.Node representing connected tiles of the same type.
     */
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

            // Add neighboring positions to explore next
            queue.push([x + 1, y]);
            queue.push([x - 1, y]);
            queue.push([x, y + 1]);
            queue.push([x, y - 1]);
        }

        return tiles;
    }

    /**
     * Safely removes a list of tiles with visual effects and updates game state.
     * @param tiles - Array of cc.Node representing tiles to remove.
     */
    private async removeTilesSafely(tiles: cc.Node[]): Promise<void> {
        if (!tiles?.length) return;

        this.isAnimationPlaying = true; // Block other interactions during removal

        try {
            // Step 1: Highlight selected tiles before removal
            await this.highlightTiles(tiles);

            // Step 2: Animate removal and update grid references
            const destroyPromises = tiles.map(tile => {
                if (!tile.isValid) return Promise.resolve();

                const tileComp = tile.getComponent(Tile);
                if (!tileComp) return Promise.resolve();

                // Mark grid position as null before explosion animation
                this.grid[tileComp.gridY][tileComp.gridX] = null;
                return tileComp.explode(); // Play explosion animation and destroy node
            });

            await Promise.all(destroyPromises);

            // Step 3: Award points based on removed tiles count
            this.addScore(tiles.length * 10);

        } catch (error) {
            cc.error("Error removing tiles:", error);
        } finally {
            this.isAnimationPlaying = false; // Re-enable interactions after removal completes
        }
    }

    /**
     * Highlights a list of tiles with a scaling and color animation.
     * @param tiles - Array of cc.Node representing the tiles to highlight.
     */
    private async highlightTiles(tiles: cc.Node[]): Promise<void> {
        await Promise.all(
            tiles.map(tile => {
                return new Promise<void>(resolve => {
                    if (!tile.isValid) {
                        // Skip invalid or destroyed tiles
                        return resolve();
                    }

                    // Animate tile: scale up and change color to red, then revert
                    cc.tween(tile)
                        .to(0.1, { scale: 1.2, color: cc.Color.RED })
                        .to(0.1, { scale: 1.0, color: cc.Color.WHITE })
                        .call(resolve)
                        .start();
                });
            })
        );
    }

    /**
     * Checks if the given grid position is within bounds.
     * @param x - X coordinate on the grid.
     * @param y - Y coordinate on the grid.
     * @returns True if position is valid; false otherwise.
     */
    private isValidPosition(x: number, y: number): boolean {
        return x >= 0 && x < this.gridWidth &&
            y >= 0 && y < this.gridHeight;
    }

    /**
     * Finds all matching connected tiles at a specific position.
     * Checks both horizontal and vertical directions for matches.
     * @param x - X coordinate on the grid.
     * @param y - Y coordinate on the grid.
     * @returns Array of cc.Node representing matched tiles.
     */
    private findMatchesAt(x: number, y: number): cc.Node[] {
        if (!this.isValidPosition(x, y) || !this.grid[y]?.[x]) {
            return [];
        }

        try {
            const tileComponent = this.grid[y][x].getComponent(Tile);
            if (!tileComponent) return [];

            const targetType = tileComponent.tileType;

            // Find matches in horizontal and vertical directions
            const horizontalMatches = this.findMatchesInDirection(x, y, 1, 0, targetType);
            const verticalMatches = this.findMatchesInDirection(x, y, 0, 1, targetType);

            // Combine matches from both directions
            return [...horizontalMatches, ...verticalMatches];

        } catch (error) {
            cc.error(`Error finding matches at (${x}, ${y}):`, error);
            return [];
        }
    }

    /**
     * Finds all connected tiles of the same type in a specific direction from a starting point.
     * Uses BFS-like traversal in both positive and negative directions.
     * @param x - Starting X position.
     * @param y - Starting Y position.
     * @param dx - Direction vector X component (1 for right, -1 for left).
     * @param dy - Direction vector Y component (1 for down, -1 for up).
     * @param tileType - The type of tile to match.
     * @returns Array of cc.Node representing matched tiles in that direction.
     */
    private findMatchesInDirection(
        x: number,
        y: number,
        dx: number,
        dy: number,
        tileType: TileType
    ): cc.Node[] {
        const matches: cc.Node[] = [];

        // Search in the positive direction
        let cx = x + dx;
        let cy = y + dy;
        while (this.isValidPosition(cx, cy)) {
            const tile = this.grid[cy][cx];
            if (!tile) break; // No tile at this position

            const currentTileType = tile.getComponent(Tile)?.tileType;
            if (currentTileType !== tileType) break; // Different type

            matches.push(tile);
            cx += dx;
            cy += dy;
        }

        // Search in the negative direction
        cx = x - dx;
        cy = y - dy;
        while (this.isValidPosition(cx, cy)) {
            const tile = this.grid[cy][cx];
            if (!tile) break; // No tile at this position

            const currentTileType = tile.getComponent(Tile)?.tileType;
            if (currentTileType !== tileType) break; // Different type

            matches.push(tile);
            cx -= dx;
            cy -= dy;
        }

        return matches;
    }

    /**
     * Handles the explosion effect of a bomb booster tile.
     * Removes the 3x3 area around the specified tile, then refills the grid.
     * @param tile - The cc.Node representing the bomb booster tile.
     */
    private async handleBombBooster(tile: cc.Node): Promise<void> {
        const tileComp = tile.getComponent('Tile');
        const x = tileComp.gridX;
        const y = tileComp.gridY;

        // Collect all neighboring tiles in a 3x3 area (including the center)
        const tilesToRemove: cc.Node[] = [tile];

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // Skip the center tile

                const nx = x + dx;
                const ny = y + dy;

                if (this.isValidPosition(nx, ny)) {
                    // Add neighboring tiles within bounds
                    tilesToRemove.push(this.grid[ny][nx]);
                }
            }
        }

        // Decrement booster count
        this.curBombBoosterCount--;

        // Remove collected tiles safely with animation
        await this.removeTilesSafely(tilesToRemove);

        // Fill empty spaces created after removal
        await this.fillEmptySpaces();

        // Reset booster state and update UI
        this.resetActiveBooster();
        this.updateUI();

        // Check for win or lose conditions after move
        this.checkStateWinOrLose();
    }

    /**
     * Fills empty spaces in the grid by moving existing tiles down and spawning new ones at the top.
     */
    private async fillEmptySpaces(): Promise<void> {
        if (this.isAnimationPlaying) return; // Prevent overlapping animations
        this.isAnimationPlaying = true;

        try {
            const movePromises: Promise<void>[] = [];

            // Move existing tiles down to fill gaps
            for (let x = 0; x < this.gridWidth; x++) {
                let emptySpots = 0;
                for (let y = 0; y < this.gridHeight; y++) {
                    if (this.grid[y][x] === null) {
                        emptySpots++;
                    } else if (emptySpots > 0) {
                        const tile = this.grid[y][x];
                        const newY = y - emptySpots;

                        // Update grid data structure
                        this.grid[y][x] = null;
                        this.grid[newY][x] = tile;

                        // Update tile component's gridY property
                        const tileComp = tile.getComponent(Tile);
                        tileComp.gridY = newY;

                        // Animate movement to new position
                        movePromises.push(tileComp.moveTo(x, newY));
                    }
                }
            }

            await Promise.all(movePromises);

            const createPromises: Promise<void>[] = [];

            // Spawn new tiles at the top for empty spots
            for (let x = 0; x < this.gridWidth; x++) {
                let emptyTopSpots = 0;

                // Count how many empty spots are at the top of each column
                for (let y = this.gridHeight - 1; y >= 0; y--) {
                    if (this.grid[y][x] === null) {
                        emptyTopSpots++;
                    } else {
                        break;
                    }
                }

                // Create new tiles for each empty spot at the top
                for (let i = 0; i < emptyTopSpots; i++) {
                    const targetY = this.gridHeight - 1 - i;
                    const newTile = cc.instantiate(this.tilePrefab);
                    newTile.parent = this.gameField;

                    const tileComp = newTile.getComponent(Tile);
                    const randomTypeIndex = Math.floor(Math.random() * Object.keys(TileType).length / 2);
                    const randomType: TileType = randomTypeIndex as TileType;

                    // Initialize new tile with random type and position
                    tileComp.init(x, targetY, randomType, BoosterType.NONE);

                    // Set starting position above the grid for falling animation
                    const startYPositionIndex = targetY + emptyTopSpots - i;
                    const startPos = this.getPositionForTile(x, startYPositionIndex);
                    newTile.setPosition(startPos);

                    // Update grid data structure with new tile
                    this.grid[targetY][x] = newTile;

                    // Animate falling to target position
                    createPromises.push(tileComp.moveTo(x, targetY));
                }
            }

            await Promise.all(createPromises);

            // Check if new matches are formed after refill and process them recursively if needed
            const newMatches = this.findAllMatches();
            if (newMatches.length >= 3) {
                await this.removeMatches(newMatches);
                await this.fillEmptySpaces(); // Recursive call to handle chain reactions
            }

        } finally {
            this.isAnimationPlaying = false; // Reset animation flag regardless of success or failure
        }
    }

    /**
     * Finds all matching tiles on the grid that form at least a sequence of 3.
     * @returns Array of cc.Node representing all matched tiles.
     */
    private findAllMatches(): cc.Node[] {
        const matchedTiles = new Set<cc.Node>(); // Use a Set to avoid duplicates

        // Iterate through each cell in the grid
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const currentTile = this.grid[y][x];
                if (currentTile === null) continue; // Skip empty cells

                // Find matches starting from current position
                const matches = this.findMatchesAt(x, y);
                if (matches.length >= 3) {
                    // Add all matched tiles to the set
                    matches.forEach(tile => matchedTiles.add(tile));
                }
            }
        }

        // Convert set to array and return
        return Array.from(matchedTiles);
    }

    /**
     * Removes the specified matched tiles with explosion animation and updates score.
     * @param matches - Array of cc.Node representing tiles to remove.
     */
    private async removeMatches(matches: cc.Node[]): Promise<void> {
        if (matches.length === 0 || this.isAnimationPlaying) return; // Prevent overlapping animations

        this.isAnimationPlaying = true;

        try {
            const uniqueMatches = [...new Set(matches)]; // Ensure no duplicates
            this.addScore(uniqueMatches.length * 10); // Add score based on number of tiles

            // Animate explosion for each matched tile
            await Promise.all(uniqueMatches.map(tile => {
                const tileComp = tile.getComponent(Tile);
                return tileComp.explode(); // Assume explode() handles animation
            }));

            // Remove tiles from grid and destroy nodes
            uniqueMatches.forEach(tile => {
                const tileComp = tile.getComponent(Tile);
                this.grid[tileComp.gridY][tileComp.gridX] = null; // Clear grid cell
                tile.destroy(); // Remove node from scene
            });
        } finally {
            this.isAnimationPlaying = false; // Reset animation flag
        }
    }

    /**
     * Adds points to the current score and updates UI.
     * @param points - Number of points to add.
     */
    private addScore(points: number): void {
        this.curScore += points;
        this.updateUI();
    }

    /**
     * Updates UI elements such as score, moves, and booster counts.
     */
    private updateUI(): void {
        this.uiManager.setScoreCount(this.curScore, this.targetScore);
        this.uiManager.setMoves(this.curMovesLeft);
        this.uiManager.setSwapBoosterCount(this.curSwapBoosterCount);
        this.uiManager.setBombBoosterCount(this.curBombBoosterCount);
    }

    /**
     * Handles the activation of swap booster when user attempts to use it.
     */
    public tryUseSwapBooster(): void {
        this.uiManager.onSwapButtonActivated(false); // Placeholder for actual logic
    }

    /**
     * Handles the activation of bomb booster when user attempts to use it.
     */
    public tryUseBombBooster(): void {
        console.log("Booster click");
        if (this.curBombBoosterCount > 0) {
            this.activeBooster = BoosterType.BOMB;
            this.uiManager.onBombButtonActivated(true); // Show active state
        } else {
            this.uiManager.onBombButtonActivated(false); // No boosters left
        }
    }

    /**
     * Resets the active booster state and removes highlight from target tile if any.
     */
    private resetActiveBooster(): void {
        if (this.targetTile) {
            const tileComp = this.targetTile.getComponent(Tile);
            tileComp?.removeHighlight(); // Remove visual highlight
            this.targetTile = null;
        }
        this.activeBooster = BoosterType.NONE; // Reset booster type
    }
}