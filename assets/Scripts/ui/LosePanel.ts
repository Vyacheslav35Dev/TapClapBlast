
const {ccclass, property} = cc._decorator;

@ccclass
export default class LosePanel extends cc.Component {
    
    @property(cc.Button)
    public closeButton: cc.Button = null;
    
    protected onLoad(): void {
        this.closeButton.node.on('click', this.onClick, this);
    }

    protected onDestroy(): void {
        this.closeButton.node.off('click', this.onClick, this);
    }

    private onClick(): void {
        this.node.active = false;
    }
}
