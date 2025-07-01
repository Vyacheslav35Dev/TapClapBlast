import { BoosterType, TileType } from "./GameTypes";
import GameManager from "./GameManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Tile extends cc.Component {
    @property(cc.Sprite)
    private sprite: cc.Sprite = null;

    @property([cc.SpriteFrame])
    private tileFrames: cc.SpriteFrame[] = [];

    private _tileType: TileType = TileType.RED;
    private _boosterType: BoosterType = BoosterType.NONE;
    private _gridX: number = 0;
    private _gridY: number = 0;
    private gameManager: GameManager = null;

    /**
     * Initialize the tile with grid position, type, and booster.
     * Sets up visual appearance and click event listener.
     */
    public init(x: number, y: number, type: TileType, booster: BoosterType): void {
        this._gridX = x;
        this._gridY = y;
        this._tileType = type;
        this._boosterType = booster;

        this.updateVisual();

        // Register click event
        this.node.on('click', this.onClick, this);

        // Find the GameManager component in the scene
        this.gameManager = cc.find("GameManager").getComponent("GameManager");
    }

    /**
     * Update the sprite frame based on the tile type.
     */
    private updateVisual(): void {
        if (this._tileType >= 0 && this._tileType < this.tileFrames.length) {
            this.sprite.spriteFrame = this.tileFrames[this._tileType];
        }
    }

    /**
     * Handle tile click event.
     */
    private onClick(): void {
        if (this.gameManager) {
            this.gameManager.onTileClick(this.node);
        }
    }

    /**
     * Highlight the tile to indicate selection.
     */
    public select(): void {
        this.node.scale = 1.2; // Slightly enlarge for visual feedback
    }

    /**
     * Remove selection highlight.
     */
    public deselect(): void {
        this.node.scale = 1.0; // Reset scale
    }

    /**
     * Highlight the tile (e.g., for potential match).
     */
    public highlight(): void {
        this.node.stopAllActions();
        this.node.color = cc.Color.YELLOW; // Change color to yellow
    }

    /**
     * Remove highlight and reset appearance.
     */
    public removeHighlight(): void {
        this.node.stopAllActions();
        this.node.color = cc.Color.WHITE; // Reset color to white
        this.node.scale = 1; // Reset scale if changed
    }

    /**
     * Play a swap animation effect.
     */
    public playSwapEffect(): void {
        this.node.runAction(
            cc.sequence(
                cc.scaleTo(0.1, 1.2),
                cc.scaleTo(0.1, 1.0)
            )
        );
    }

    /**
     * Animate explosion effect and destroy the tile node.
     */
    public async explode(): Promise<void> {
        if (!this.node?.isValid) return Promise.resolve();

        return new Promise(resolve => {
            try {
                this.node.stopAllActions();

                // Animate scale up and fade out
                cc.tween(this.node)
                    .to(0.2, { scale: 1.5, opacity: 0 })
                    .call(() => {
                        if (this.node.isValid) {
                            this.node.destroy(); // Remove node after animation
                        }
                        resolve();
                    })
                    .start();
            } catch (error) {
                cc.error("Explode animation error:", error);
                resolve();
            }
        });
    }

    /**
     * Move the tile to a new grid position with animation.
     * @param newX - target grid X coordinate
     * @param newY - target grid Y coordinate
     */
    public async moveTo(newX: number, newY: number): Promise<void> {
        if (!this.node || !this.gameManager) return Promise.resolve();

        try {
            // Update internal grid position
            this._gridX = newX;
            this._gridY = newY;

            // Get target position from game manager
            const targetPos = this.gameManager['getPositionForTile'](newX, newY);

            // Animate movement to target position
            return new Promise(resolve => {
                this.node.stopAllActions();
                cc.tween(this.node)
                    .to(0.3, { position: targetPos })
                    .call(resolve)
                    .start();
            });
        } catch (error) {
            cc.error("Tile move error:", error);
            return Promise.resolve();
        }
    }

    // Getters and setters for encapsulation

    /** Get current tile type */
    public get tileType(): TileType { return this._tileType; }

    /** Get current booster type */
    public get boosterType(): BoosterType { return this._boosterType; }

    /** Get current grid X coordinate */
    public get gridX(): number { return this._gridX; }

    /** Get current grid Y coordinate */
    public get gridY(): number { return this._gridY; }

    /** Set grid X coordinate */
    public set gridX(x: number) {
        this._gridX = x;
    }

    /** Set grid Y coordinate */
    public set gridY(y: number) {
        this._gridY = y;
    }
}