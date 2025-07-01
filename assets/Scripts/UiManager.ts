import Action = cc.Action;
import GameManager from "./GameManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UiManager extends cc.Component {
    // UI элементы
    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) movesLabel: cc.Label = null;
    @property(cc.Label) bombCountLabel: cc.Label = null;
    @property(cc.Label) swapCountLabel: cc.Label = null;
    @property(cc.Node) losePanel: cc.Node = null;
    @property(cc.Node) winPanel: cc.Node = null;
    @property(cc.Button) private swapButton: cc.Button = null;
    @property(cc.Button) private bombButton: cc.Button = null;

    // Убираем публичные EventTarget, так как будем использовать callbacks
    @property(GameManager)
    private gameManager: GameManager = null;

    protected onLoad(): void {
        // Получаем GameManager через свойство, а не через поиск
        if (!this.gameManager) {
            this.gameManager = cc.find("GameManager").getComponent(GameManager);
        }

        this.swapButton.node.on('click', this.onSwapClick, this);
        this.bombButton.node.on('click', this.onBombClick, this);

        // Подписываемся на события через методы GameManager
        if (this.gameManager) {
            this.gameManager.onSwapBoosterActivated = () => this.onSwapActivated();
            this.gameManager.onBombBoosterActivated = () => this.onBombActivated();
        }
    }

    protected onDestroy(): void {
        this.swapButton.node.off('click', this.onSwapClick, this);
        this.bombButton.node.off('click', this.onBombClick, this);

        // Отписываемся от событий
        if (this.gameManager) {
            this.gameManager.onSwapBoosterActivated = null;
            this.gameManager.onBombBoosterActivated = null;
        }
    }

    private onSwapClick(): void {
        if (this.gameManager) {
            if (!this.gameManager.tryUseSwapBooster()) {
                this.shakeButton(this.swapButton.node);
            }
        }
    }

    private onBombClick(): void {
        if (this.gameManager) {
            if (!this.gameManager.tryUseBombBooster()) {
                this.shakeButton(this.bombButton.node);
            }
        }
    }

    private onSwapActivated(): void {
        this.highlightButton(this.swapButton.node);
    }

    private onBombActivated(): void {
        this.highlightButton(this.bombButton.node);
    }

    private highlightButton(button: cc.Node): void {
        button.runAction(
            cc.sequence(
                cc.scaleTo(0.1, 1.2),
                cc.scaleTo(0.1, 1.0)
            )
        );
    }

    private shakeButton(button: cc.Node): void {
        button.runAction(
            cc.sequence(
                cc.moveBy(0.05, cc.v2(5, 0)),
                cc.moveBy(0.05, cc.v2(-10, 0)),
                cc.moveBy(0.05, cc.v2(10, 0)),
                cc.moveBy(0.05, cc.v2(-5, 0))
            )
        );
    }
    public SetSwapBoosterCount(count:number){
        this.swapCountLabel.string = `${count}`;
    }

    public SetBoombBoosterCount(count:number){
        this.bombCountLabel.string = `${count}`;
    }
    
    public SetScoreCount(count:number){
        this.scoreLabel.string = `${count}`;
    }
    
    public SetMoves(count:number){
        this.movesLabel.string = `${count}`;
    }
}
