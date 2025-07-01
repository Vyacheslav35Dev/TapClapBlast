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

    public onSwapBoosterActivate: () => void = null;
    public onBombBoosterActivate: () => void = null;

    protected onLoad(): void {
        this.swapButton.node.on('click', this.onSwapClick, this);
        this.bombButton.node.on('click', this.onBombClick, this);
    }

    protected onDestroy(): void {
        this.swapButton.node.off('click', this.onSwapClick, this);
        this.bombButton.node.off('click', this.onBombClick, this);
    }

    private onSwapClick(): void {
        if (this.onSwapBoosterActivate) {
            this.onSwapBoosterActivate();
        }
    }

    private onBombClick(): void {
        console.log('click')
        //if (this.onBombBoosterActivate) {
           this.onBombBoosterActivate();
        //}
    }

    public onSwapButtonActivated(state : boolean): void {
        if (state)
        {
            this.shakeButton(this.swapButton.node);
            this.highlightButton(this.swapButton.node);
        }
        else
        {
            this.shakeButton(this.swapButton.node);
        }
    }

    public onBombButtonActivated(state : boolean): void {
        if (state)
        {
            this.shakeButton(this.bombButton.node);
            this.highlightButton(this.bombButton.node);
        }
        else
        {
            this.shakeButton(this.bombButton.node);
        }
        
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
