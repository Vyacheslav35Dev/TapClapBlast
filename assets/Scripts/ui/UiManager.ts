import WinPanel from "./WinPanel";
import LosePanel from "./LosePanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UiManager extends cc.Component {
    // UI Elements
    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    movesLabel: cc.Label = null;

    @property(cc.Label)
    bombCountLabel: cc.Label = null;

    @property(cc.Label)
    swapCountLabel: cc.Label = null;

    @property(WinPanel)
    private winPanel: WinPanel = null;

    @property(LosePanel)
    private losePanel: LosePanel = null;

    @property(cc.Button)
    private swapButton: cc.Button = null;

    @property(cc.Button)
    private bombButton: cc.Button = null;

    @property(cc.Button)
    private winCloseButton: cc.Button = null;

    @property(cc.Button)
    private loseCloseButton: cc.Button = null;

    // Callbacks for booster activation and game restart
    public onSwapBoosterActivate: () => void = null;
    public onBombBoosterActivate: () => void = null;
    public onRestartGame: () => void = null;

    /**
     * Called when the component is loaded.
     * Sets up button click event listeners.
     */
    protected onLoad(): void {
        if (this.swapButton) {
            this.swapButton.node.on('click', this.onSwapClick, this);
        }
        if (this.bombButton) {
            this.bombButton.node.on('click', this.onBombClick, this);
        }
        if (this.winCloseButton) {
            this.winCloseButton.node.on('click', this.onClickRestart, this);
        }
        if (this.loseCloseButton) {
            this.loseCloseButton.node.on('click', this.onClickRestart, this);
        }
    }

    /**
     * Called when the component is destroyed.
     * Cleans up event listeners to prevent memory leaks.
     */
    protected onDestroy(): void {
        if (this.swapButton) {
            this.swapButton.node.off('click', this.onSwapClick, this);
        }
        if (this.bombButton) {
            this.bombButton.node.off('click', this.onBombClick, this);
        }
        if (this.winCloseButton) {
            this.winCloseButton.node.off('click', this.onClickRestart, this);
        }
        if (this.loseCloseButton) {
            this.loseCloseButton.node.off('click', this.onClickRestart, this);
        }
    }

    /**
     * Handles restart button click.
     * Invokes the restart callback if assigned.
     */
    private onClickRestart(): void {
        if (this.onRestartGame) {
            this.onRestartGame();
        } else {
            console.log("Restart callback not assigned");
        }
    }

    /**
     * Handles swap booster button click.
     * Invokes the swap booster callback if assigned.
     */
    private onSwapClick(): void {
        if (this.onSwapBoosterActivate) {
            this.onSwapBoosterActivate();
        }
    }

    /**
     * Handles bomb booster button click.
     * Invokes the bomb booster callback if assigned.
     */
    private onBombClick(): void {
        if (this.onBombBoosterActivate) {
            this.onBombBoosterActivate();
        }
    }

    /**
     * Visual feedback for swap button activation.
     * Shakes and highlights the button based on state.
     */
    public onSwapButtonActivated(state: boolean): void {
        if (!this.swapButton || !this.swapButton.node) return;

        // Shake animation always runs
        this.shakeButton(this.swapButton.node);

        // Highlight only when activated
        if (state) {
            this.highlightButton(this.swapButton.node);
        }
    }

    /**
     * Visual feedback for bomb button activation.
     * Shakes and highlights the button based on state.
     */
    public onBombButtonActivated(state: boolean): void {
        if (!this.bombButton || !this.bombButton.node) return;

        // Shake animation always runs
        this.shakeButton(this.bombButton.node);

        // Highlight only when activated
        if (state) {
            this.highlightButton(this.bombButton.node);
        }
    }

    /**
     * Animates a button to highlight it by scaling up briefly.
     */
    private highlightButton(buttonNode: cc.Node): void {
        buttonNode.runAction(
            cc.sequence(
                cc.scaleTo(0.1, 1.2),
                cc.scaleTo(0.1, 1.0)
            )
        );
    }

    /**
     * Animates a button to shake horizontally.
     */
    private shakeButton(buttonNode: cc.Node): void {
        buttonNode.runAction(
            cc.sequence(
                cc.moveBy(0.05, cc.v2(5, 0)),
                cc.moveBy(0.05, cc.v2(-10, 0)),
                cc.moveBy(0.05, cc.v2(10, 0)),
                cc.moveBy(0.05, cc.v2(-5, 0))
            )
        );
    }

    /**
     * Updates the swap booster count display.
     */
    public setSwapBoosterCount(count: number): void {
        if (this.swapCountLabel) {
            this.swapCountLabel.string = `${count}`;
        }
    }

    /**
     * Updates the bomb booster count display.
     */
    public setBombBoosterCount(count: number): void {
        if (this.bombCountLabel) {
            this.bombCountLabel.string = `${count}`;
        }
    }

    /**
     * Updates the score display with current and max score.
     */
    public setScoreCount(count: number, maxCount: number): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `${count}/${maxCount}`;
        }
    }

    /**
     * Updates the moves count display.
     */
    public setMoves(count: number): void {
        if (this.movesLabel) {
            this.movesLabel.string = `${count}`;
        }
    }

    /**
     * Displays the win panel with an animated scale effect.
     */
    public showWinPanel(): void {
        if (!this.winPanel || !this.winPanel.node) return;

        const panelNode = this.winPanel.node;

        panelNode.active = true;
        panelNode.scale = 0.5; // Start small

        // Animate to full size with easing
        cc.tween(panelNode)
            .to(0.5, { scale: 1 }, { easing: 'backOut' })
            .call(() => { /* Optional callback after animation */ })
            .start();
    }

    /**
     * Displays the lose panel with fade-in and scale animation.
     */
    public showLosePanel(): void {
        if (!this.losePanel || !this.losePanel.node) return;

        const panelNode = this.losePanel.node;

        panelNode.active = true;
        panelNode.scale = 0.5; // Start small
        panelNode.opacity = 0; // Start transparent

        // Animate opacity and scale for a smooth appearance
        cc.tween(panelNode)
            .to(0.3, { opacity: 255 })
            .to(0.5, { scale: 1 }, { easing: 'backOut' })
            .call(() => { /* Optional callback after animation */ })
            .start();
    }
}