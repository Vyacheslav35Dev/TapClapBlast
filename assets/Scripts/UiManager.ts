
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

    @property(cc.Button) 
    public swapBoosterButton: cc.Button = null;
    @property(cc.Button) 
    public bombBoosterButton: cc.Button = null;
    
    @property
    text: string = 'hello';
    
    public SetValues(score : number, movesLeft: number, countBombBooster : number, countSwapBooster : number){
        this.scoreLabel.string = `${score}`;
        this.movesLabel.string = `${movesLeft}`;

        this.bombCountLabel.string = `x${countBombBooster}`;
        this.swapCountLabel.string = `x${countSwapBooster}`;
    }
}
