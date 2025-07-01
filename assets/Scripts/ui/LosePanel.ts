const { ccclass, property } = cc._decorator;

@ccclass
export default class LosePanel extends cc.Component {

    @property(cc.Button)
    public closeButton: cc.Button = null;

    /**
     * Called when the component is loaded.
     * Sets up the click event listener for the close button.
     */
    protected onLoad(): void {
        if (this.closeButton) {
            this.closeButton.node.on('click', this.onClick, this);
        } else {
            cc.warn('Close button is not assigned in the inspector.');
        }
    }

    /**
     * Called when the component is destroyed.
     * Cleans up the event listener to prevent memory leaks.
     */
    protected onDestroy(): void {
        if (this.closeButton) {
            this.closeButton.node.off('click', this.onClick, this);
        }
    }

    /**
     * Handles the click event on the close button.
     * Hides the panel by setting active to false.
     */
    private onClick(): void {
        this.node.active = false;
    }
}