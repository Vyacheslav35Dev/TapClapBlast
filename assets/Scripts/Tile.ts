
const {ccclass, property} = cc._decorator;

@ccclass
export default class Tile extends cc.Component {
    @property(cc.SpriteFrame) tileSprites: cc.SpriteFrame[] = [];

    private type: number = 0;
    private xPos: number = 0;
    private yPos: number = 0;

    public onClick: (x: number, y: number) => void = null;

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    init(type: number, x: number, y: number) {
        this.type = type;
        this.xPos = x;
        this.yPos = y;

        const sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = this.tileSprites[type];

        const highlight = this.node.getChildByName('Highlight');
        if (highlight) highlight.active = false;
    }

    updatePosition(x: number, y: number) {
        this.xPos = x;
        this.yPos = y;
        
        const highlight = this.node.getChildByName('Highlight');
        if (highlight) highlight.active = false;
    }

    private onTouchStart(event: cc.Event.EventTouch) {
        event.stopPropagation(); // Останавливаем всплытие события
        if (this.onClick) {
            this.onClick(this.xPos, this.yPos);
        }
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    }
}
