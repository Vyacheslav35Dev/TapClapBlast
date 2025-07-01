import WinPanel from "./WinPanel";
import LosePanel from "./LosePanel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UiManager extends cc.Component {
    // UI элементы
    @property(cc.Label) 
    scoreLabel: cc.Label = null;
    @property(cc.Label) 
    movesLabel: cc.Label = null;
    @property(cc.Label) 
    bombCountLabel: cc.Label = null;
    @property(cc.Label) 
    swapCountLabel: cc.Label = null;
    @property(cc.Component) 
    private winPanel: WinPanel = null;
    @property(cc.Component) 
    losePanel: LosePanel = null;
    @property(cc.Button) 
    private swapButton: cc.Button = null;
    @property(cc.Button) 
    private bombButton: cc.Button = null;

    @property(cc.Button)
    private winCloseButton: cc.Button = null;
    @property(cc.Button)
    private loseCloseButton: cc.Button = null;
    
    public onSwapBoosterActivate: () => void = null;
    public onBombBoosterActivate: () => void = null;
    public onRestartGame: () => void = null;

    protected onLoad(): void {
        this.swapButton.node.on('click', this.onSwapClick, this);
        this.bombButton.node.on('click', this.onBombClick, this);
        
        this.winCloseButton.node.on('click', this.onClickRestart, this);
        this.loseCloseButton.node.on('click', this.onClickRestart, this);
    }

    protected onDestroy(): void {
        this.swapButton.node.off('click', this.onSwapClick, this);
        this.bombButton.node.off('click', this.onBombClick, this);
        
        this.winCloseButton.node.off('click', this.onClickRestart, this);
        this.loseCloseButton.node.off('click', this.onClickRestart, this);
    }
    
    private onClickRestart() : void {
        if (this.onRestartGame)
        {
            this.onRestartGame();
        }
        else
        {
            console.log("test click")
        }
    }

    private onSwapClick(): void {
        if (this.onSwapBoosterActivate) {
            this.onSwapBoosterActivate();
        }
    }

    private onBombClick(): void {
        if (this.onBombBoosterActivate) {
           this.onBombBoosterActivate();
        }
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
    
    public SetScoreCount(count:number, maxCount:number){
        this.scoreLabel.string = count+"/"+maxCount;
    }
    
    public SetMoves(count:number){
        this.movesLabel.string = `${count}`;
    }

    public showWinPanel(): void {
        
        this.winPanel.node.active = true;
        this.winPanel.node.scale = 0.5;

        cc.tween(this.winPanel.node)
            .to(0.5, { scale: 1 }, { easing: 'backOut' })
            .call(() => this.enabled = false)
            .start();
    }

    public showLosePanel(): void {
        
        this.losePanel.node.active = true;
        this.losePanel.node.scale = 0.5;
        this.losePanel.node.opacity = 0;

        cc.tween(this.losePanel.node)
            .to(0.3, { opacity: 255 })
            .to(0.5, { scale: 1 }, { easing: 'backOut' })
            .call(() => this.enabled = false)
            .start();
    }
}
