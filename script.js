// 麻雀牌の定義
const TILES = {
  man: ['1m','2m','3m','4m','5m','6m','7m','8m','9m'],
  pin: ['1p','2p','3p','4p','5p','6p','7p','8p','9p'],
  sou: ['1s','2s','3s','4s','5s','6s','7s','8s','9s'],
  honor: ['東','南','西','北','白','發','中']
};

const ALL_TILES = [...TILES.man, ...TILES.pin, ...TILES.sou, ...TILES.honor];

// 牌を文字列→インデックスに変換
function tileToIndex(tile) {
  if (tile.endsWith('m')) return parseInt(tile)-1;
  if (tile.endsWith('p')) return parseInt(tile)-1 + 9;
  if (tile.endsWith('s')) return parseInt(tile)-1 + 18;
  const honors = ['東','南','西','北','白','發','中'];
  return honors.indexOf(tile) + 27;
}

// インデックス→牌文字列
function indexToTile(i) {
  if (i<9)   return (i+1)+'m';
  if (i<18)  return (i-9+1)+'p';
  if (i<27)  return (i-18+1)+'s';
  return ['東','南','西','北','白','發','中'][i-27];
}

// 手牌配列化／逆変換
function handToArray(hand) {
  const arr = Array(34).fill(0);
  hand.forEach(t => arr[tileToIndex(t)]++);
  return arr;
}
function arrayToHand(arr) {
  const hand = [];
  arr.forEach((c,i) => {
    for(let k=0;k<c;k++) hand.push(indexToTile(i));
  });
  return hand;
}

// 乱数・タイル選択
const getRandomInt = max => Math.floor(Math.random()*max);
function getRandomTile(hand) {
  let t;
  do { t = getRandomInt(34); }
  while(hand[t] >= 4);
  return t;
}

// 刻子生成：手に 0 or 1 枚の時のみ
function generateKoutsu(hand) {
  const t = getRandomTile(hand);
  if (hand[t] <= 1) {
    hand[t] += 3;
    return true;
  }
  return false;
}

// 順子生成（字牌を避ける）
function generateShuntsu(hand) {
  const suit = getRandomInt(3);
  const start = suit*9 + getRandomInt(7);
  if (start >= 27) return false;
  if (hand[start]<4 && hand[start+1]<4 && hand[start+2]<4) {
    hand[start]++; hand[start+1]++; hand[start+2]++;
    return true;
  }
  return false;
}

// 対子生成
function generateToitsu(hand) {
  const t = getRandomTile(hand);
  if (hand[t] <= 2) {
    hand[t] += 2;
    return true;
  }
  return false;
}

// ターツ生成（字牌を避ける）
function generateTatsu(hand) {
  const type = getRandomInt(3), suit = getRandomInt(3);
  let start;
  switch(type) {
    case 0: // 両面
      start = suit*9 + 1 + getRandomInt(6);
      if (start>=27) return false;
      if (hand[start]<4 && hand[start+1]<4) {
        hand[start]++; hand[start+1]++; return true;
      }
      break;
    case 1: // 嵌張
      start = suit*9 + getRandomInt(7);
      if (start>=27) return false;
      if (hand[start]<4 && hand[start+2]<4) {
        hand[start]++; hand[start+2]++; return true;
      }
      break;
    case 2: // 辺張
      const side = getRandomInt(2);
      start = suit*9 + (side===0?0:7);
      if (start>=27) return false;
      if (hand[start]<4 && hand[start+1]<4) {
        hand[start]++; hand[start+1]++; return true;
      }
      break;
  }
  return false;
}

// 指定シャンテン手牌生成
function generateHand(targetShanten) {
  while(true) {
    const hand = Array(34).fill(0);
    const mentsu = getRandomInt(5);
    const hasJantou = Math.random()<0.8;
    let tatsu = 8 - targetShanten - 2*mentsu - (hasJantou?1:0);
    tatsu = Math.max(0, Math.min(tatsu,5-mentsu));
    if (mentsu+tatsu>5) continue;

    // 雀頭
    if (hasJantou && !generateToitsu(hand)) continue;

    // 面子
    for(let i=0;i<mentsu;i++){
      if (Math.random()<0.5) {
        if(!generateKoutsu(hand)){ i--; continue; }
      } else {
        if(!generateShuntsu(hand)){ i--; continue; }
      }
    }
    // ターツ
    for(let i=0;i<tatsu;i++){
      if(!generateTatsu(hand)){ i--; continue; }
    }

    // 13枚まで補充
    let cnt = hand.reduce((a,b)=>a+b,0);
    if(cnt>13) continue;
    while(cnt<13){
      const t = getRandomTile(hand);
      hand[t]++; cnt++;
    }

    if(cnt===13 && calculateShanten(hand)===targetShanten){
      return hand;
    }
  }
}

// シャンテン計算（一般形／七対子／国士）
function calculateShanten(h){
  return Math.min(
    calculateNormalShanten(h),
    calculateChiitoiShanten(h),
    calculateKokushiShanten(h)
  );
}

// 一般形シャンテン（DFS版）
function calculateNormalShanten(hand){
  let minSh=8;
  function dfs(tiles, m,t,p,idx){
    if(m>4) return;
    while(idx<34 && tiles[idx]===0) idx++;
    if(idx>=34){
      let sh= (4-m)*2 + (p?0:1) - t;
      minSh = Math.min(minSh, sh);
      return;
    }
    // スキップ
    dfs(tiles,m,t,p,idx+1);
    // 雀頭
    if(!p && tiles[idx]>=2){
      tiles[idx]-=2; dfs(tiles,m,t,true,idx); tiles[idx]+=2;
    }
    // 刻子
    if(tiles[idx]>=3){
      tiles[idx]-=3; dfs(tiles,m+1,t,p,idx); tiles[idx]+=3;
    }
    // 順子
    if(idx<27 && idx%9<=6 && tiles[idx]&&tiles[idx+1]&&tiles[idx+2]){
      tiles[idx]--;tiles[idx+1]--;tiles[idx+2]--;
      dfs(tiles,m+1,t,p,idx);
      tiles[idx]++;tiles[idx+1]++;tiles[idx+2]++;
    }
    // ターツ
    if(m+t<4){
      if(tiles[idx]>=2){
        tiles[idx]-=2; dfs(tiles,m,t+1,p,idx); tiles[idx]+=2;
      }
      if(idx<27 && idx%9<=7 && tiles[idx]&&tiles[idx+1]){
        tiles[idx]--;tiles[idx+1]--;
        dfs(tiles,m,t+1,p,idx);
        tiles[idx]++;tiles[idx+1]++;
      }
      if(idx<27 && idx%9<=6 && tiles[idx]&&tiles[idx+2]){
        tiles[idx]--;tiles[idx+2]--;
        dfs(tiles,m,t+1,p,idx);
        tiles[idx]++;tiles[idx+2]++;
      }
    }
  }
  dfs([...hand],0,0,false,0);
  return minSh;
}

// 七対子シャンテン
function calculateChiitoiShanten(hand){
  let pairs=0, kinds=0;
  for(let i=0;i<34;i++){
    if(hand[i]>0) kinds++;
    if(hand[i]>=2) pairs++;
  }
  let sh=6-pairs;
  if(pairs<7 && kinds<7) sh += (7-kinds);
  return sh;
}

// 国士無双シャンテン
function calculateKokushiShanten(hand){
  const yaochu=[0,8,9,17,18,26,27,28,29,30,31,32,33];
  let uniq=0, pair=false;
  for(const i of yaochu){
    if(hand[i]>0){ uniq++; if(hand[i]>=2) pair=true; }
  }
  return 13-uniq-(pair?1:0);
}

// 受け入れ牌計算
function calculateUkeire(hand){
  const ukeire={}, orig=calculateShanten(hand);
  if(orig>6) return ukeire;
  for(let i=0;i<34;i++){
    const before=hand[i];
    hand[i]++;
    if(calculateShanten(hand)<orig){
      const rem=4-before;
      if(rem>0) ukeire[indexToTile(i)] = rem;
    }
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
