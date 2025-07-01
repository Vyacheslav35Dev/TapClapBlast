import {BoosterType, TileType} from "./GameTypes";
import GameManager from "./GameManager";
import tween = cc.tween;
import Vec3 = cc.Vec3;

const { ccclass, property } = cc._decorator;

@ccclass
export default class Tile extends cc.Component {
    @property(cc.Sprite)
    private sprite: cc.Sprite = null;

    @property([cc.SpriteFrame])
    private tileFrames: cc.SpriteFrame[] = [];

    //@property(cc.Animation)
    //private explosionAnim: cc.Animation = null;

    private _tileType: TileType = TileType.RED;
    private _boosterType: BoosterType = BoosterType.NONE;
    private _gridX: number = 0;
    private _gridY: number = 0;
    private gameManager: GameManager = null;

    public init(x: number, y: number, type: TileType, booster: BoosterType): void {
        this._gridX = x;
        this._gridY = y;
        this._tileType = type;
        this._boosterType = booster;
        this.updateVisual();

        this.node.on('click', this.onClick, this);
        this.gameManager = cc.find("GameManager").getComponent("GameManager");
    }

    private updateVisual(): void {
        if (this._tileType >= 0 && this._tileType < this.tileFrames.length) {
            this.sprite.spriteFrame = this.tileFrames[this._tileType];
        }
    }

    private onClick(): void {
        this.gameManager.onTileClick(this.node);
    }

    public select(): void {
        this.node.scale = 1.2;
    }

    public deselect(): void {
        this.node.scale = 1.0;
    }

    public highlight(): void {
        this.node.stopAllActions();
        this.node.color = cc.Color.YELLOW;
    }

    public removeHighlight(): void {
        this.node.stopAllActions();
        this.node.color = cc.Color.WHITE;
        this.node.scale = 1;
    }

    public playSwapEffect(): void {
        this.node.runAction(
            cc.sequence(
                cc.scaleTo(0.1, 1.2),
                cc.scaleTo(0.1, 1.0)
            )
        );
    }

    public async explode(): Promise<void> {
        if (!this.node?.isValid) return Promise.resolve();

        return new Promise(resolve => {
            try {
                this.node.stopAllActions();

                cc.tween(this.node)
                    .to(0.2, { scale: 1.5, opacity: 0 })
                    .call(() => {
                        if (this.node.isValid) {
                            this.node.destroy();
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

    public async moveTo(newX: number, newY: number): Promise<void> {
        if (!this.node || !this.gameManager) {
            return Promise.resolve();
        }

        try {
            this._gridX = newX;
            this._gridY = newY;
            const newPos = this.gameManager['getPositionForTile'](newX, newY);

            return new Promise(resolve => {
                this.node.stopAllActions();
                cc.tween(this.node)
                    .to(0.3, { position: newPos })
                    .call(resolve)
                    .start();
            });
        } catch (error) {
            cc.error("Tile move error:", error);
            return Promise.resolve();
        }
    }

    // Getters and setters
    public get tileType(): TileType { return this._tileType; }
    public get boosterType(): BoosterType { return this._boosterType; }
    public get gridX(): number { return this._gridX; }
    public get gridY(): number { return this._gridY; }
    public set gridX(x: number) { this._gridX = x; }
    public set gridY(y: number) { this._gridY = y; }
}