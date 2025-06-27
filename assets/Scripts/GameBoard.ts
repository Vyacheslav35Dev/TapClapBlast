import UiManager from "./UiManager";


const {ccclass, property} = cc._decorator;

@ccclass
export default class GameBoard extends cc.Component {

    @property(cc.Prefab) tilePrefab: cc.Prefab = null;
    @property(cc.Node) rootField: cc.Node = null;
    
    @property(cc.Integer) boardWidth: number = 9;
    @property(cc.Integer) boardHeight: number = 9;
    @property(cc.Integer) tileTypes: number = 5;
    @property(cc.Float) tileSize: number = 80;
    @property(cc.Float) tileSpacing: number = 5;

    // Игровой процесс
    @property(cc.Integer) maxMoves: number = 30;
    @property(cc.Integer) bombRadius: number = 1;

    @property(cc.Component)
    public uiManager: UiManager = null;

    private board: number[][] = [];
    private tiles: cc.Node[][] = [];
    private score: number = 0;
    private movesLeft: number = 0;
    private timeLeft: number = 0;
    private isGameActive: boolean = false;
    //private selectedBooster: BoosterType = BoosterType.NONE;
    private firstSwapTile: cc.Vec2 = null;
    private bombBoosters: number = 3;
    private swapBoosters: number = 3;
    private startX: number = 0;
    private startY: number = 0;

    protected onLoad() {
        this.calculateBoardOffsets();
        this.setupBoosters();
    }

    private calculateBoardOffsets() {
        this.startX = -(this.boardWidth * (this.tileSize + this.tileSpacing)) / 2 + this.tileSize / 2;
        this.startY = (this.boardHeight * (this.tileSize + this.tileSpacing)) / 2 - this.tileSize / 2;
    }

    private setupBoosters() {
        const bombBtn = this.uiManager.bombBoosterButton;
        const swapBtn = this.uiManager.swapBoosterButton;

        /*bombBtn.on(cc.Node.EventType.TOUCH_END, () => this.handleBoosterSelection(BoosterType.BOMB));
        swapBtn.on(cc.Node.EventType.TOUCH_END, () => this.handleBoosterSelection(BoosterType.SWAP));*/
    }
    
    start(){
        this.startGame();
    }

    startGame() {
        this.resetGameState();
        this.updateUI();
        this.initBoard();
        this.createBoard();
    }

    private resetGameState() {
        
        this.score = 0;
        this.movesLeft = this.maxMoves;
        this.bombBoosters = 3;
        this.swapBoosters = 3;
        this.isGameActive = true;
        //this.selectedBooster = BoosterType.NONE;
        this.firstSwapTile = null;

        this.board = [];
        this.tiles = [];
    }

    private updateUI() {
        this.uiManager.SetValues( this.score, this.movesLeft, this.bombBoosters, this.swapBoosters );
    }

    private initBoard() {
        for (let y = 0; y < this.boardHeight; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.boardWidth; x++) {
                this.board[y][x] = this.generateRandomTileType();
            }
        }
    }

    private generateRandomTileType(): number {
        const rand = Math.random();
        return Math.floor(Math.random() * this.tileTypes);
    }

    private createBoard() {
        for (let y = 0; y < this.boardHeight; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.boardWidth; x++) {
                this.createTile(x, y);
            }
        }
    }

    private createTile(x: number, y: number) {
        const tileType = this.board[y][x];
        const prefab = this.getPrefabForTileType(tileType);
        const tile = cc.instantiate(prefab);

        tile.parent = this.rootField;
        tile.setPosition(this.getTilePosition(x, y));

        const tileComp = tile.getComponent('Tile');
        tileComp.init(tileType, x, y);
        tileComp.onClick = this.onTileClick.bind(this);

        this.tiles[y][x] = tile;
    }

    private getPrefabForTileType(tileType: number): cc.Prefab {
        switch (tileType) {
            default: return this.tilePrefab;
        }
    }

    private getTilePosition(x: number, y: number): cc.Vec2 {
        return cc.v2(
            this.startX + x * (this.tileSize + this.tileSpacing),
            this.startY - y * (this.tileSize + this.tileSpacing)
        );
    }

    private onTileClick(x: number, y: number) {
        if (!this.isGameActive) return;

        this.handleNormalTileClick(x, y);
    }

    private handleNormalTileClick(x: number, y: number) {
        /*const matches = this.findMatches(x, y);
        if (matches.length >= 3) {
            this.movesLeft--;
            this.processMatches(matches);
            this.updateUI();

            if (this.movesLeft <= 0) {
                this.endGame();
            }
        }*/
    }
}
