// 麻雀牌の定義
const TILES = {
    man: ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m'], // 萬子
    pin: ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'], // 筒子
    sou: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s'], // 索子
    honor: ['東', '南', '西', '北', '白', '發', '中'] // 字牌
};

const ALL_TILES = [...TILES.man, ...TILES.pin, ...TILES.sou, ...TILES.honor];

// 牌の表示名
const TILE_NAMES = {
    '1m': '一萬', '2m': '二萬', '3m': '三萬', '4m': '四萬', '5m': '五萬', 
    '6m': '六萬', '7m': '七萬', '8m': '八萬', '9m': '九萬',
    '1p': '一筒', '2p': '二筒', '3p': '三筒', '4p': '四筒', '5p': '五筒',
    '6p': '六筒', '7p': '七筒', '8p': '八筒', '9p': '九筒',
    '1s': '一索', '2s': '二索', '3s': '三索', '4s': '四索', '5s': '五索',
    '6s': '六索', '7s': '七索', '8s': '八索', '9s': '九索',
    '東': '東', '南': '南', '西': '西', '北': '北', '白': '白', '發': '發', '中': '中'
};

// 牌を文字列からインデックスに変換
function tileToIndex(tile) {
    if (tile.endsWith('m')) return parseInt(tile) - 1; // 0-8: 萬子
    if (tile.endsWith('p')) return parseInt(tile) - 1 + 9; // 9-17: 筒子
    if (tile.endsWith('s')) return parseInt(tile) - 1 + 18; // 18-26: 索子
    const honors = ['東', '南', '西', '北', '白', '發', '中'];
    return honors.indexOf(tile) + 27; // 27-33: 字牌
}

// インデックスから牌文字列に変換
function indexToTile(index) {
    if (index < 9) return (index + 1) + 'm';
    if (index < 18) return (index - 9 + 1) + 'p';
    if (index < 27) return (index - 18 + 1) + 's';
    return ['東', '南', '西', '北', '白', '發', '中'][index - 27];
}

// 手牌を配列形式に変換
function handToArray(hand) {
    const handArray = Array(34).fill(0);
    hand.forEach(tile => {
        const index = tileToIndex(tile);
        handArray[index]++;
    });
    return handArray;
}

// 配列形式から手牌に変換
function arrayToHand(handArray) {
    const hand = [];
    handArray.forEach((count, index) => {
        for (let i = 0; i < count; i++) {
            hand.push(indexToTile(index));
        }
    });
    return hand;
}

// ランダムな整数を生成
const getRandomInt = (max) => Math.floor(Math.random() * max);

// 牌プールからランダムに牌を選ぶ
function getRandomTile(hand) {
    let tile;
    do {
        tile = getRandomInt(34);
    } while (hand[tile] >= 4);
    return tile;
}

// 刻子を生成
function generateKoutsu(hand) {
    const tile = getRandomTile(hand);
    // FIXED: 対子(2枚)からでも刻子を生成できるように拡張
    if (hand[tile] <= 2) {
        hand[tile] += 3;
        return true;
    }
    return false;
}

// 順子を生成
function generateShuntsu(hand) {
    const suit = getRandomInt(3); // 0:m, 1:p, 2:s
    const startNum = getRandomInt(7); // 1-7
    const startIndex = suit * 9 + startNum;
    if (startIndex >= 27) return false;  // FIXED: 字牌はスキップ
    if (hand[startIndex] < 4 && hand[startIndex + 1] < 4 && hand[startIndex + 2] < 4) {
        hand[startIndex]++;
        hand[startIndex + 1]++;
        hand[startIndex + 2]++;
        return true;
    }
    return false;
}

// 対子を生成
function generateToitsu(hand) {
    const tile = getRandomTile(hand);
    if (hand[tile] <= 2) {
        hand[tile] += 2;
        return true;
    }
    return false;
}

// ターツを生成
function generateTatsu(hand) {
    const type = getRandomInt(3); // 0:両面, 1:嵌張, 2:辺張
    const suit = getRandomInt(3);
    let startIndex;

    switch (type) {
        case 0: // 両面
            startIndex = suit * 9 + 1 + getRandomInt(6); // 2-7
            if (startIndex >= 27) return false; // FIXED: 字牌はスキップ
            if (hand[startIndex] < 4 && hand[startIndex + 1] < 4) {
                hand[startIndex]++;
                hand[startIndex + 1]++;
                return true;
            }
            break;
        case 1: // 嵌張
            startIndex = suit * 9 + getRandomInt(7); // 1-7
            if (startIndex >= 27) return false; // FIXED: 字牌はスキップ
             if (hand[startIndex] < 4 && hand[startIndex + 2] < 4) {
                hand[startIndex]++;
                hand[startIndex + 2]++;
                return true;
            }
            break;
        case 2: // 辺張
             const side = getRandomInt(2); // 0: 1-2, 1: 8-9
             if (side === 0) startIndex = suit * 9;
             else startIndex = suit * 9 + 7;
            if (startIndex >= 27) return false; // FIXED: 字牌はスキップ
             if (hand[startIndex] < 4 && hand[startIndex + 1] < 4) {
                hand[startIndex]++;
                hand[startIndex + 1]++;
                return true;
            }
            break;
    }
    return false;
}


// 指定されたシャンテン数の手牌を生成する
function generateHand(targetShanten) {
    while (true) {
        let hand = Array(34).fill(0);
        let tileCount = 0;

        // 1. 構造をランダムに決定
        const mentsuCount = getRandomInt(5); // 0-4面子
        const hasJantou = Math.random() < 0.8; // 80%の確率で雀頭あり
        
        // 目標シャンテン数から必要なターツ数を逆算
        // S = 8 - 2M - T - J  => T = 8 - S - 2M - J
        let tatsuCount = 8 - targetShanten - (mentsuCount * 2) - (hasJantou ? 1 : 0);
        tatsuCount = Math.max(0, Math.min(tatsuCount, 5 - mentsuCount));

        if (mentsuCount + tatsuCount > 5) continue;

        // 2. ブロックを生成
        // 雀頭
        if (hasJantou) {
            if (!generateToitsu(hand)) continue;
        }
        // 面子
        for (let i = 0; i < mentsuCount; i++) {
            if (Math.random() < 0.5) { // 50%で刻子
                if (!generateKoutsu(hand)) { i--; continue; }
            } else {
                if (!generateShuntsu(hand)) { i--; continue; }
            }
        }
        // ターツ
        for (let i = 0; i < tatsuCount; i++) {
            if (!generateTatsu(hand)) { i--; continue; }
        }
        
        // 3. 13枚になるまでランダムに補充
        tileCount = hand.reduce((a, b) => a + b, 0);
        if (tileCount > 13) continue;
        while (tileCount < 13) {
            const tile = getRandomTile(hand);
            hand[tile]++;
            tileCount++;
        }
        
        // 4. 最終チェック
        if (tileCount === 13 && calculateShanten(hand) === targetShanten) {
            return hand;
        }
    }
}


// シャンテン数（テンパイまで何枚足りないか）を計算
function calculateShanten(hand) {
    return Math.min(
        calculateNormalShanten(hand),
        calculateChiitoiShanten(hand),
        calculateKokushiShanten(hand)
    );
}

// 一般形（4面子＋1雀頭）のシャンテン数を計算する
function calculateNormalShanten(hand) {
    let minShanten = 8;

    // 雀頭を固定しない場合の探索
    let handWithoutJantou = [...hand];
    minShanten = Math.min(minShanten, findMentsuTatsu(handWithoutJantou, false));

    // 各対子を雀頭候補として固定して探索
    for (let i = 0; i < 34; i++) {
        if (hand[i] >= 2) {
            let handWithJantou = [...hand];
            handWithJantou[i] -= 2;
            minShanten = Math.min(minShanten, findMentsuTatsu(handWithJantou, true));
        }
    }
    return minShanten;
}

// 面子とターツを抜き出す内部関数 (FIXED: 厳密な計算のためDFS:深さ優先探索に書き換え)
function findMentsuTatsu(hand, hasJantou) {
    let minShanten = 8; // 関数スコープで最小値を保持

    function dfs(tiles, mentsu, tatsu, startIndex) {
        // 探索のベースケース: 全ての牌をチェックし終わった
        if (startIndex >= 34) {
            let shanten = 8 - mentsu * 2 - tatsu - (hasJantou ? 1 : 0);
            // 面子＋ターツが4を超える場合は、超えた分だけシャンテン数を増やす
            if (mentsu + tatsu > 4) {
                shanten += (mentsu + tatsu - 4);
            }
            minShanten = Math.min(minShanten, shanten);
            return;
        }

        // 次の牌に移動
        let i = startIndex;
        while (i < 34 && tiles[i] === 0) {
            i++;
        }
        // 牌がなければ終了
        if (i >= 34) {
            dfs(tiles, mentsu, tatsu, i);
            return;
        }

        // --- 分岐 ---

        // 1. この牌を抜き出さない (孤立牌として扱う)
        dfs(tiles, mentsu, tatsu, i + 1);

        // 2. この牌を面子・ターツとして抜き出す
        // FIXED: 槓子対応 → 刻子1組＋孤立牌1枚に分割し、重複処理を避ける
        if (tiles[i] >= 4) {
            tiles[i] -= 3;
            dfs(tiles, mentsu + 1, tatsu, i);
            tiles[i] += 3;
            return; // 通常の刻子としては処理しない
        }
        // 刻子
        if (tiles[i] >= 3) {
            tiles[i] -= 3;
            dfs(tiles, mentsu + 1, tatsu, i);
            tiles[i] += 3;
        }
        // 順子 (字牌は除く)
        if (i < 27 && i % 9 <= 6 && tiles[i] > 0 && tiles[i + 1] > 0 && tiles[i + 2] > 0) {
            tiles[i]--; tiles[i + 1]--; tiles[i + 2]--;
            dfs(tiles, mentsu + 1, tatsu, i);
            tiles[i]++; tiles[i + 1]++; tiles[i + 2]++;
        }
        
        // ターツは面子と合わせて4つまで
        if (mentsu + tatsu < 4) {
            // 対子
            if (tiles[i] >= 2) {
                tiles[i] -= 2;
                dfs(tiles, mentsu, tatsu + 1, i);
                tiles[i] += 2;
            }
            // 順子系ターツ (両面・辺張)
            if (i < 27 && i % 9 <= 7 && tiles[i] > 0 && tiles[i + 1] > 0) {
                tiles[i]--; tiles[i + 1]--;
                dfs(tiles, mentsu, tatsu + 1, i);
                tiles[i]++; tiles[i + 1]++;
            }
            // 順子系ターツ (嵌張)
            if (i < 27 && i % 9 <= 6 && tiles[i] > 0 && tiles[i + 2] > 0) {
                tiles[i]--; tiles[i + 2]--;
                dfs(tiles, mentsu, tatsu + 1, i);
                tiles[i]++; tiles[i + 2]++;
            }
        }
    }

    dfs([...hand], 0, 0, 0);
    return minShanten;
}


// 七対子（同じ牌2枚を7種類）のシャンテン数
function calculateChiitoiShanten(hand) {
    let pairs = 0;
    let kinds = 0;
    for (let i = 0; i < 34; i++) {
        if (hand[i] > 0) {
            kinds++;
        }
        if (hand[i] >= 2) {
            pairs++;
        }
    }
    // 6 - 対子数
    let shanten = 6 - pairs;
    // 対子が7つできても、手牌が13枚に満たない場合はその分シャンテン数を足す
    if (pairs < 7 && kinds < 7) {
         shanten += (7 - kinds);
    }
    return shanten;
}

// 国士無双（幺九牌13種＋そのどれかの対子）のシャンテン数
function calculateKokushiShanten(hand) {
    const yaochu = [0,8,9,17,18,26,27,28,29,30,31,32,33]; // 幺九牌のインデックス
    let unique = 0;
    let hasPair = false;
    
    for (const i of yaochu) {
        if (hand[i] > 0) {
            unique++;
            if (hand[i] >= 2) {
                hasPair = true;
            }
        }
    }
    
    // 13種類の幺九牌のうち何種類持っているか + 対子があるか
    return 13 - unique - (hasPair ? 1 : 0);
}

// 手牌の受け入れ牌とその残り枚数を計算
function calculateUkeire(hand) {
    const ukeire = {};
    const originalShanten = calculateShanten(hand);

    if (originalShanten > 6) { // これ以上は計算しない
        return {};
    }

    for (let i = 0; i < 34; i++) { // 全ての牌を試す
        // FIXED: 槓子を持っていても、理論上の受け入れを計算するためチェックを続ける
        // if (hand[i] >= 4) continue;

        // 牌を1枚加える前の枚数を保持
        const before = hand[i];
        hand[i]++;
        
        // シャンテン数が下がるかチェック
        if (calculateShanten(hand) < originalShanten) {
            const tile = indexToTile(i);
            // FIXED: 山に残っている枚数がない待ち（4枚持ち）は除外
            const remaining = 4 - before;
            if (remaining > 0) {
                ukeire[tile] = remaining;
            }
        }
        
        // 加えた牌を元に戻す
        hand[i]--;
    }

    return ukeire;
}


// ゲーム状態
let currentHand = [];
let currentUkeire = {};
let currentAnswer = 0;
let gameState = 'playing';
let generationCancelled = false;
let generationTimeoutId = null;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    // UI要素の取得
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const tabHand = document.getElementById('tab-hand');
    const tabUkeire = document.getElementById('tab-ukeire');
    const handView = document.getElementById('hand-view');
    const ukeireView = document.getElementById('ukeire-view');

    // 設定のアコーディオン機能
    settingsToggleBtn.addEventListener('click', () => {
        const isHidden = settingsPanel.style.display === 'none';
        settingsPanel.style.display = isHidden ? 'flex' : 'none';
        settingsToggleBtn.textContent = isHidden ? '設定 ▲' : '設定 ▼';
    });

    // タブ切り替え機能
    tabHand.addEventListener('click', () => {
        handView.classList.add('active');
        ukeireView.classList.remove('active');
        tabHand.classList.add('active');
        tabUkeire.classList.remove('active');
    });

    tabUkeire.addEventListener('click', () => {
        ukeireView.classList.add('active');
        handView.classList.remove('active');
        tabUkeire.classList.add('active');
        tabHand.classList.remove('active');
    });

    // 初回問題生成
    generateNewProblem();
    
    // 設定変更時に新しい問題を生成
    document.getElementById('shanten-select').addEventListener('change', generateNewProblem);
    document.getElementById('min-ukeire').addEventListener('change', generateNewProblem);
    document.getElementById('max-ukeire').addEventListener('change', generateNewProblem);

    // 中断ボタンのイベントリスナー
    document.getElementById('cancel-generation-btn').addEventListener('click', () => {
        generationCancelled = true;
    });
});

// 非同期で手牌を生成するループ
async function generateHandLoop(targetShanten, minUkeire, maxUkeire) {
    let handArray, ukeire, ukeireCount;
    let attempts = 0;
    while (!generationCancelled) {
        handArray = generateHand(targetShanten);
        ukeire = calculateUkeire(handArray);
        ukeireCount = Object.values(ukeire).reduce((sum, count) => sum + count, 0);

        if (ukeireCount >= minUkeire && ukeireCount <= maxUkeire) {
            return handArray; // 条件に合う手牌が見つかった
        }
        
        attempts++;
        if (attempts % 100 === 0) { // 100回ごとにメインスレッドを解放
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    return null; // 中断された
}

// 新しい問題を生成
function generateNewProblem() {
    const loaderOverlay = document.getElementById('loader-overlay');
    generationCancelled = false;
    loaderOverlay.style.display = 'flex';

    // UIの更新を待ってから重い処理を開始する
    setTimeout(async () => {
        const targetShanten = parseInt(document.getElementById('shanten-select').value);
        const minUkeire = parseInt(document.getElementById('min-ukeire').value);
        const maxUkeire = parseInt(document.getElementById('max-ukeire').value);

        const handArray = await generateHandLoop(targetShanten, minUkeire, maxUkeire);

        loaderOverlay.style.display = 'none';

        if (generationCancelled || handArray === null) {
            console.log("手牌の生成が中断されました。");
            // もし中断された場合、UIを操作可能な状態に戻すか、何らかのフィードバックをユーザーに与える
            // 例えば、中断メッセージを表示するなど。現状では何もしない。
            return;
        }
        
        const ukeire = calculateUkeire(handArray);
        
        currentHand = arrayToHand(handArray);
        currentUkeire = ukeire;
        currentAnswer = Object.values(ukeire).reduce((sum, count) => sum + count, 0);
        
        // 理牌（ソート）
        currentHand.sort((a, b) => tileToIndex(a) - tileToIndex(b));
        
        displayHand(currentHand);
        resetUI();
        gameState = 'playing';
    }, 10); // わずかな遅延を与える
}

// 牌の文字列から画像ファイル名を取得
function getTileImageFilename(tile) {
    // 赤ドラの場合
    if (tile === '0m') return 'aka3-66-90-l-emb.png';
    if (tile === '0p') return 'aka1-66-90-l-emb.png';
    if (tile === '0s') return 'aka2-66-90-l-emb.png';

    const suit = tile.slice(-1);
    const num = tile.slice(0, -1);

    let suitName;
    switch (suit) {
        case 'm': suitName = 'man'; break;
        case 'p': suitName = 'pin'; break;
        case 's': suitName = 'sou'; break;
        default: // 字牌
            const honors = ['東', '南', '西', '北', '白', '發', '中'];
            const honorIndex = honors.indexOf(tile) + 1;
            return `ji${honorIndex}-66-90-l-emb.png`;
    }
    return `${suitName}${num}-66-90-l-emb.png`;
}

// 手牌を表示
function displayHand(hand) {
    const container = document.getElementById('tiles-container');
    container.innerHTML = '';
    
    hand.forEach(tile => {
        const imgElement = document.createElement('img');
        imgElement.src = `pai-images/${getTileImageFilename(tile)}`;
        imgElement.className = 'tile';
        imgElement.setAttribute('title', TILE_NAMES[tile] || tile);
        container.appendChild(imgElement);
    });
}

// 受け入れ牌を表示
function displayUkeire(ukeire) {
    const container = document.getElementById('ukeire-tiles');
    container.innerHTML = '';

    const sortedUkeire = Object.keys(ukeire).sort((a, b) => tileToIndex(a) - tileToIndex(b));

    sortedUkeire.forEach(tile => {
        const tileWrapper = document.createElement('div');
        tileWrapper.className = 'ukeire-tile-wrapper';

        const imgElement = document.createElement('img');
        imgElement.src = `pai-images/${getTileImageFilename(tile)}`;
        imgElement.className = 'tile';
        imgElement.setAttribute('title', TILE_NAMES[tile] || tile);

        const countElement = document.createElement('span');
        countElement.className = 'ukeire-count';
        countElement.textContent = `${ukeire[tile]}枚`;
        
        tileWrapper.appendChild(imgElement);
        tileWrapper.appendChild(countElement);
        container.appendChild(tileWrapper);
    });

    // 受け入れタブを有効化して表示を切り替える
    document.getElementById('tab-ukeire').disabled = false;
    document.getElementById('tab-ukeire').click();
}

// 電卓機能
function appendNumber(number) {
    const display = document.getElementById('display');
    if (display.textContent === '0') {
        display.textContent = number;
    } else {
        display.textContent += number;
    }
}

function clearDisplay() {
    document.getElementById('display').textContent = '0';
}

function deleteLast() {
    const display = document.getElementById('display');
    if (display.textContent.length > 1) {
        display.textContent = display.textContent.slice(0, -1);
    } else {
        display.textContent = '0';
    }
}

// 回答を提出
function submitAnswer() {
    if (gameState !== 'playing') return;
    
    const userAnswer = parseInt(document.getElementById('display').textContent);
    const resultMessage = document.getElementById('result-message');
    const nextBtn = document.getElementById('next-btn');
    const questionText = document.getElementById('question-text');
    
    if (userAnswer === currentAnswer) {
        resultMessage.textContent = '正解！';
        resultMessage.className = 'result-message correct visible';
        nextBtn.style.display = 'block';
        questionText.style.display = 'none';
        gameState = 'answered';
        displayUkeire(currentUkeire);
        disableButtons();
    } else {
        resultMessage.textContent = `不正解です。もう一度挑戦してください。`;
        resultMessage.className = 'result-message incorrect visible';
        nextBtn.style.display = 'none';
    }
}

// あきらめる
function giveUp() {
    if (gameState !== 'playing') return;
    
    const resultMessage = document.getElementById('result-message');
    const nextBtn = document.getElementById('next-btn');
    const questionText = document.getElementById('question-text');
    
    resultMessage.textContent = `正解は ${currentAnswer} 枚でした。`;
    resultMessage.className = 'result-message answer visible';
    nextBtn.style.display = 'block';
    questionText.style.display = 'none';
    gameState = 'given_up';
    displayUkeire(currentUkeire);
    disableButtons();
}

// 次の問題
function nextProblem() {
    generateNewProblem();
}

// UIをリセット
function resetUI() {
    document.getElementById('display').textContent = '0';
    document.getElementById('result-message').className = 'result-message'; // visibleクラスを削除
    document.getElementById('question-text').style.display = 'block';
    document.getElementById('next-btn').style.display = 'none';
    
    // タブを初期状態に戻す
    document.getElementById('tab-hand').click();
    document.getElementById('tab-ukeire').disabled = true;
    document.getElementById('ukeire-tiles').innerHTML = '';

    enableButtons();
}

// ボタンを無効化
function disableButtons() {
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('giveup-btn').disabled = true;
    const calcBtns = document.querySelectorAll('.calc-btn');
    calcBtns.forEach(btn => btn.disabled = true);
}

// ボタンを有効化
function enableButtons() {
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('giveup-btn').disabled = false;
    const calcBtns = document.querySelectorAll('.calc-btn');
    calcBtns.forEach(btn => btn.disabled = false);
}
