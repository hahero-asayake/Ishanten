// 麻雀牌の定義
const TILES = {
  man: ['1m','2m','3m','4m','5m','6m','7m','8m','9m'], // 萬子
  pin: ['1p','2p','3p','4p','5p','6p','7p','8p','9p'], // 筒子
  sou: ['1s','2s','3s','4s','5s','6s','7s','8s','9s'], // 索子
  honor: ['東','南','西','北','白','發','中'] // 字牌
};

const ALL_TILES = [...TILES.man, ...TILES.pin, ...TILES.sou, ...TILES.honor];

// 牌の表示名
const TILE_NAMES = {
  '1m':'一萬','2m':'二萬','3m':'三萬','4m':'四萬','5m':'五萬',
  '6m':'六萬','7m':'七萬','8m':'八萬','9m':'九萬',
  '1p':'一筒','2p':'二筒','3p':'三筒','4p':'四筒','5p':'五筒',
  '6p':'六筒','7p':'七筒','8p':'八筒','9p':'九筒',
  '1s':'一索','2s':'二索','3s':'三索','4s':'四索','5s':'五索',
  '6s':'六索','7s':'七索','8s':'八索','9s':'九索',
  '東':'東','南':'南','西':'西','北':'北','白':'白','發':'發','中':'中'
};

// 牌文字列 → インデックス
function tileToIndex(tile) {
  if (tile.endsWith('m')) return parseInt(tile) - 1;
  if (tile.endsWith('p')) return parseInt(tile) - 1 + 9;
  if (tile.endsWith('s')) return parseInt(tile) - 1 + 18;
  const honors = ['東','南','西','北','白','發','中'];
  return honors.indexOf(tile) + 27;
}

// インデックス → 牌文字列
function indexToTile(index) {
  if (index < 9) return `${index+1}m`;
  if (index < 18) return `${index-9+1}p`;
  if (index < 27) return `${index-18+1}s`;
  return ['東','南','西','北','白','發','中'][index-27];
}

// 手牌配列 ↔ カウント配列
function handToArray(hand) {
  const arr = Array(34).fill(0);
  hand.forEach(t => arr[tileToIndex(t)]++);
  return arr;
}
function arrayToHand(arr) {
  const hand = [];
  arr.forEach((cnt,i) => { for(let j=0;j<cnt;j++) hand.push(indexToTile(i)); });
  return hand;
}

// ランダム整数
const getRandomInt = max => Math.floor(Math.random()*max);

// 牌プールからランダムに牌を選ぶ（4枚超え禁止）
function getRandomTile(hand, suit = null) {
  let idx;
  if (suit === null) {
    do { idx = getRandomInt(34); } while (hand[idx] >= 4);
  } else {
    const start = suit * 9;
    const end = start + 9;
    do { idx = start + getRandomInt(9); } while (hand[idx] >= 4);
  }
  return idx;
}

// 刻子生成
function generateKoutsu(hand, suit = null) {
  const t = getRandomTile(hand, suit);
  if (hand[t] <= 1) {
    hand[t] += 3;
    return true;
  }
  return false;
}

// 順子生成
function generateShuntsu(hand, suit = null) {
  const s = suit === null ? getRandomInt(3) : suit;
  const start = getRandomInt(7);
  const idx = s*9 + start;
  if (idx+2 < 27 && idx%9 <= 6 && hand[idx]<4 && hand[idx+1]<4 && hand[idx+2]<4) {
    hand[idx]++; hand[idx+1]++; hand[idx+2]++;
    return true;
  }
  return false;
}

// 対子生成
function generateToitsu(hand, suit = null) {
  const t = getRandomTile(hand, suit);
  if (hand[t] <= 2) {
    hand[t] += 2;
    return true;
  }
  return false;
}

// ターツ生成
function generateTatsu(hand, suit = null) {
  const s = suit === null ? getRandomInt(3) : suit;
  const type = getRandomInt(3);
  let idx;
  switch(type) {
    case 0: // 両面
      idx = s*9 + 1 + getRandomInt(7);
      if (idx<27 && idx%9<=6 && hand[idx]<4 && hand[idx+1]<4) {
        hand[idx]++; hand[idx+1]++;
        return true;
      }
      break;
    case 1: // 嵌張
      idx = s*9 + getRandomInt(7);
      if (idx<27 && hand[idx]<4 && hand[idx+2]<4) {
        hand[idx]++; hand[idx+2]++;
        return true;
      }
      break;
    case 2: // 辺張
      const side = getRandomInt(2);
      idx = s*9 + (side===0?0:7);
      if (idx<27 && hand[idx]<4 && hand[idx+1]<4) {
        hand[idx]++; hand[idx+1]++;
        return true;
      }
      break;
  }
  return false;
}

// 指定シャンテン数の手牌を生成
function generateHand(targetShanten, isChinitsu) {
  const suit = isChinitsu ? getRandomInt(3) : null; // 0:m, 1:p, 2:s

  while(true) {
    const hand = Array(34).fill(0);
    const mentsuCount = getRandomInt(5);
    const hasJantou = Math.random() < 0.8;
    let tatsuCount = 8 - targetShanten - mentsuCount*2 - (hasJantou?1:0);
    tatsuCount = Math.max(0, Math.min(tatsuCount, 5-mentsuCount));
    if (mentsuCount + tatsuCount > 5) continue;

    // 雀頭
    if (hasJantou) {
      if (!generateToitsu(hand, suit)) continue;
    }
    // 面子
    for (let i=0;i<mentsuCount;i++) {
      if (isChinitsu || Math.random()<0.5) { // 清一色なら刻子優先度はなし
        if (!generateKoutsu(hand, suit)) { i--; continue; }
      } else {
        if (!generateShuntsu(hand, suit)) { i--; continue; }
      }
    }
    // ターツ
    for (let i=0;i<tatsuCount;i++) {
      if (!generateTatsu(hand, suit)) { i--; continue; }
    }
    // 補充
    let count = hand.reduce((a,b)=>a+b,0);
    if (count>13) continue;
    while(count<13) {
      const t = getRandomTile(hand, suit);
      hand[t]++;
      count++;
    }
    if (count===13 && calculateShanten(hand)===targetShanten) return hand;
  }
}

// シャンテン計算（一般/七対子/国士）
function calculateShanten(hand) {
  return Math.min(
    calculateNormalShanten(hand),
    calculateChiitoiShanten(hand),
    calculateKokushiShanten(hand)
  );
}

function calculateNormalShanten(hand) {
  let minShanten = 8;
  // 雀頭なし
  minShanten = Math.min(minShanten, findMentsuTatsu([...hand], false));
  // 各対子を雀頭として固定
  for (let i=0;i<34;i++) {
    if (hand[i]>=2) {
      const tmp = [...hand];
      tmp[i] -= 2;
      minShanten = Math.min(minShanten, findMentsuTatsu(tmp, true));
    }
  }
  return minShanten;
}

function findMentsuTatsu(hand, hasJantou) {
  let minSh = 8;
  function dfs(tiles, mentsu, tatsu, idx) {
    if (idx>=34) {
      let s = 8 - mentsu*2 - tatsu - (hasJantou?1:0);
      if (mentsu + tatsu > 4) s += (mentsu+tatsu-4);
      minSh = Math.min(minSh, s);
      return;
    }
    if (tiles[idx]===0) return dfs(tiles, mentsu, tatsu, idx+1);
    // 孤立牌
    dfs(tiles, mentsu, tatsu, idx+1);
    // 槓子
    if (tiles[idx]>=4) {
      tiles[idx]-=3;
      dfs(tiles, mentsu+1, tatsu, idx);
      tiles[idx]+=3;
    }
    // 刻子
    if (tiles[idx]>=3) {
      tiles[idx]-=3;
      dfs(tiles, mentsu+1, tatsu, idx);
      tiles[idx]+=3;
    }
    // 順子
    if (idx<27 && idx%9<=6 && tiles[idx]>0 && tiles[idx+1]>0 && tiles[idx+2]>0) {
      tiles[idx]--; tiles[idx+1]--; tiles[idx+2]--;
      dfs(tiles, mentsu+1, tatsu, idx);
      tiles[idx]++; tiles[idx+1]++; tiles[idx+2]++;
    }
    // ターツ
    if (mentsu+tatsu<4) {
      // 対子ターツ
      if (tiles[idx]>=2) {
        tiles[idx]-=2;
        dfs(tiles, mentsu, tatsu+1, idx);
        tiles[idx]+=2;
      }
      // 両面ターツ
      if (idx<27 && idx%9<=7 && tiles[idx]>0 && tiles[idx+1]>0) {
        tiles[idx]--; tiles[idx+1]--;
        dfs(tiles, mentsu, tatsu+1, idx);
        tiles[idx]++; tiles[idx+1]++;
      }
      // 嵌張ターツ
      if (idx<27 && idx%9<=6 && tiles[idx]>0 && tiles[idx+2]>0) {
        tiles[idx]--; tiles[idx+2]--;
        dfs(tiles, mentsu, tatsu+1, idx);
        tiles[idx]++; tiles[idx+2]++;
      }
    }
  }
  dfs([...hand],0,0,0);
  return minSh;
}

function calculateChiitoiShanten(hand) {
  let pairs = 0;
  let kinds = 0;
  for (let i = 0; i < 34; i++) {
    if (hand[i] > 0) kinds++;
    if (hand[i] >= 2) pairs++;
  }

  // 例外処理：牌種6＆対子6 → イーシャンテン
  if (pairs === 6 && kinds === 6) return 1;

  return 6 - pairs;
}

function calculateKokushiShanten(hand) {
  const yaochu = [0,8,9,17,18,26,27,28,29,30,31,32,33];
  let unique=0, hasPair=false;
  yaochu.forEach(i => {
    if (hand[i]>0) unique++;
    if (hand[i]>=2) hasPair=true;
  });
  return 13 - unique - (hasPair?1:0);
}

// 受け入れ計算
function calculateUkeire(hand) {
  const ukeire = {};
  const orig = calculateShanten(hand);
  if (orig>6) return ukeire;
  for(let i=0;i<34;i++) {
    const before = hand[i];
    if (before>=4) continue;
    hand[i]++;
    if (calculateShanten(hand)<orig) {
      const tile = indexToTile(i);
      const remain = 4 - before;
      if (remain>0) ukeire[tile] = remain;
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
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // 遊び方モーダルの表示
    helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'flex';
    });

    // 遊び方モーダルの非表示
    closeModalBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });

    // ブックマーク一覧モーダル（help-modalと同じ開閉パターン）
    // SW更新過渡期の旧HTML+新JS混成では要素が無い＝ガードで初期化全体を止めない
    const bookmarkListBtn = document.getElementById('bookmark-list-btn');
    const bookmarkModal = document.getElementById('bookmark-modal');
    const closeBookmarkModalBtn = document.getElementById('close-bookmark-modal-btn');
    if (bookmarkListBtn && bookmarkModal && closeBookmarkModalBtn) {
        bookmarkListBtn.addEventListener('click', () => {
            const error = document.getElementById('bookmark-add-error');
            if (error) error.textContent = '';
            renderBookmarkList();
            bookmarkModal.style.display = 'flex';
        });
        closeBookmarkModalBtn.addEventListener('click', () => {
            bookmarkModal.style.display = 'none';
        });
        bookmarkModal.addEventListener('click', (e) => {
            if (e.target === bookmarkModal) {
                bookmarkModal.style.display = 'none';
            }
        });
        const bookmarkAddBtn = document.getElementById('bookmark-add-btn');
        const bookmarkAddInput = document.getElementById('bookmark-add-input');
        if (bookmarkAddBtn && bookmarkAddInput) {
            bookmarkAddBtn.addEventListener('click', registerBookmarkFromInput);
            bookmarkAddInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.isComposing) registerBookmarkFromInput(); // IME変換確定のEnterでは発火させない
            });
        }
    }

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

    // 初回問題生成（?q= 付きなら共有URLから復元）
    if (!loadProblemFromQuery()) generateNewProblem();
    
    // 設定変更時に新しい問題を生成
    document.getElementById('shanten-select').addEventListener('change', generateNewProblem);
    document.getElementById('min-ukeire').addEventListener('change', generateNewProblem);
    document.getElementById('max-ukeire').addEventListener('change', generateNewProblem);
    document.getElementById('chinitsu-checkbox').addEventListener('change', generateNewProblem);

    // 中断ボタンのイベントリスナー
    document.getElementById('cancel-generation-btn').addEventListener('click', () => {
        generationCancelled = true;
    });
});

// 非同期で手牌を生成するループ
async function generateHandLoop(targetShanten, minUkeire, maxUkeire, isChinitsu) {
    let handArray, ukeire, ukeireCount;
    let attempts = 0;
    while (!generationCancelled) {
        handArray = generateHand(targetShanten, isChinitsu);
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
    // 全生成経路で共有URLのクエリを除去（表示中と別の問題のURLが残る事故防止）
    history.replaceState(null, '', location.pathname);
    const loaderOverlay = document.getElementById('loader-overlay');
    generationCancelled = false;
    
    // 1秒以上かかったらローディング表示を出すタイマー
    const loaderTimeout = setTimeout(() => {
        loaderOverlay.style.display = 'flex';
    }, 1000);

    // UIの更新を待ってから重い処理を開始する
    setTimeout(async () => {
        const targetShanten = parseInt(document.getElementById('shanten-select').value);
        const minUkeire = parseInt(document.getElementById('min-ukeire').value);
        const maxUkeire = parseInt(document.getElementById('max-ukeire').value);
        const isChinitsu = document.getElementById('chinitsu-checkbox').checked;

        const handArray = await generateHandLoop(targetShanten, minUkeire, maxUkeire, isChinitsu);

        // 処理が1秒以内に終わったらタイマーをキャンセル
        clearTimeout(loaderTimeout);
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
    const nextBtn = document.getElementById('next-btn');
    const questionText = document.getElementById('question-text');

    if (userAnswer === currentAnswer) {
        questionText.textContent = '正解！';
        questionText.className = 'correct';
        nextBtn.style.display = 'block';
        gameState = 'answered';
        displayUkeire(currentUkeire);
        disableButtons();
    } else {
        questionText.textContent = `不正解です。再挑戦してください。`;
        questionText.className = 'incorrect';
        nextBtn.style.display = 'none';
    }
}

// あきらめる
function giveUp() {
    if (gameState !== 'playing') return;

    const nextBtn = document.getElementById('next-btn');
    const questionText = document.getElementById('question-text');

    questionText.textContent = `正解は ${currentAnswer} 枚でした。`;
    questionText.className = 'answer';
    nextBtn.style.display = 'block';
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
    const questionText = document.getElementById('question-text');
    questionText.textContent = 'この手牌の受け入れ枚数は？';
    questionText.className = '';
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
    document.getElementById('submit-btn').style.display = 'none';
    document.getElementById('giveup-btn').style.display = 'none';
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.style.display = 'block'; // SW更新過渡期の旧HTML+新JS混成でも既存機能を壊さない
    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (bookmarkBtn) { bookmarkBtn.style.display = 'block'; updateBookmarkBtn(); }
    const calcBtns = document.querySelectorAll('.calc-btn');
    calcBtns.forEach(btn => btn.disabled = true);
}

// ボタンを有効化
function enableButtons() {
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('giveup-btn').disabled = false;
    document.getElementById('submit-btn').style.display = '';
    document.getElementById('giveup-btn').style.display = '';
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.style.display = 'none'; // 同上
    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (bookmarkBtn) bookmarkBtn.style.display = 'none';
    const calcBtns = document.querySelectorAll('.calc-btn');
    calcBtns.forEach(btn => btn.disabled = false);
}

// ===== 共有URL・Xシェア =====

// 手牌13枚(牌文字列配列) → mpsz文字列（正準形＝インデックス昇順・スート順 m→p→s→z）
function encodeHand(hand) {
    const idx = hand.map(tileToIndex).sort((a, b) => a - b);
    const suitOf = i => i < 9 ? 'm' : i < 18 ? 'p' : i < 27 ? 's' : 'z';
    const numOf  = i => i < 27 ? (i % 9) + 1 : i - 26;
    let out = '', cur = '', lastSuit = null;
    idx.forEach(i => {
        const s = suitOf(i);
        if (lastSuit !== null && s !== lastSuit) { out += cur + lastSuit; cur = ''; }
        cur += numOf(i);
        lastSuit = s;
    });
    if (lastSuit !== null) out += cur + lastSuit;
    return out;
}

// mpsz文字列 → 手牌13枚(牌文字列配列)。不正なら null
function decodeHand(q) {
    if (typeof q !== 'string' || q.length === 0 || q.length > 30) return null;
    if (!/^[1-9mpsz]+$/.test(q)) return null;
    const tiles = [];
    let digits = [];
    for (const ch of q) {
        if (ch >= '1' && ch <= '9') { digits.push(parseInt(ch)); continue; }
        if (digits.length === 0) return null;          // スート文字の前に数字がない
        for (const n of digits) {
            if (ch === 'z') {
                if (n > 7) return null;                 // 8z,9zは存在しない
                tiles.push(indexToTile(27 + n - 1));
            } else {
                const base = ch === 'm' ? 0 : ch === 'p' ? 9 : 18;
                tiles.push(indexToTile(base + n - 1));
            }
        }
        digits = [];
    }
    if (digits.length !== 0) return null;               // 末尾にスートなしの数字
    if (tiles.length !== 13) return null;               // 13枚ちょうどのみ
    if (handToArray(tiles).some(c => c > 4)) return null; // 同一牌5枚以上
    return tiles;
}

// クエリから問題を復元。復元したら true
function loadProblemFromQuery() {
    const q = new URLSearchParams(location.search).get('q');
    if (!q) return false;
    const tiles = decodeHand(q);
    if (!tiles) {
        console.warn('不正な共有クエリのためランダム生成にフォールバックします');
        history.replaceState(null, '', location.pathname); // 不正クエリは除去
        return false;
    }
    tiles.sort((a, b) => tileToIndex(a) - tileToIndex(b)); // 理牌
    currentHand = tiles;
    currentUkeire = calculateUkeire(handToArray(tiles));
    currentAnswer = Object.values(currentUkeire).reduce((s, c) => s + c, 0);
    displayHand(currentHand);
    resetUI();
    gameState = 'playing';
    return true;
}

// 手牌 → Unicode麻雀牌絵文字（並びは正準形。字牌はmpsz数字順とUnicode順がズレるため対応表で変換）
function handToEmoji(hand) {
    const HONOR_CP = [0x1F000, 0x1F001, 0x1F002, 0x1F003, 0x1F006, 0x1F005, 0x1F004]; // 東南西北白發中
    return hand.map(tileToIndex).sort((a, b) => a - b).map(i => {
        let cp;
        if (i < 9) cp = 0x1F007 + i;              // 萬子 🀇〜
        else if (i < 18) cp = 0x1F019 + (i - 9);  // 筒子 🀙〜
        else if (i < 27) cp = 0x1F010 + (i - 18); // 索子 🀐〜
        else cp = HONOR_CP[i - 27];
        // 🀄(中)だけ既定がカラー絵文字のため VS15(U+FE0E) でモノクロ字形に統一（2026-07-28 オーナー指定）
        return String.fromCodePoint(cp) + (cp === 0x1F004 ? '\uFE0E' : '');
    }).join('');
}

// Xでシェア（URLは必ず問題画面＝?q= のみ。答えは文面に含めない）
// 改行位置を完全制御するため url/hashtags パラメータは使わず text に4行で集約（2026-07-28 オーナー指定）
function shareToX() {
    if (currentHand.length !== 13) return; // 生成完了前の空手牌ウィンドウで空URLを共有しない
    const hand = encodeHand(currentHand);
    const problemUrl = location.origin + location.pathname + '?q=' + hand;
    const text = 'この手牌の受け入れ枚数は何枚？\n'
        + handToEmoji(currentHand) + '\n'
        + problemUrl + '\n'
        + '#麻雀 #受け入れ枚数練習';
    const intent = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
    window.open(intent, '_blank', 'noopener');
}

// ===== bookmark =====

const BOOKMARK_KEY = 'ishanten.bookmarks.v1';

// 読み書きとも throw しない（ストレージ遮断環境では黙って何もしない）
function getBookmarks() {
    try {
        const v = JSON.parse(localStorage.getItem(BOOKMARK_KEY));
        // 要素も検証（[null]等の汚染でも消費側がthrowしないように）
        return Array.isArray(v) ? v.filter(b => b && typeof b.q === 'string') : [];
    } catch { return []; }
}
function isBookmarked(q) { return getBookmarks().some(b => b.q === q); }
function addBookmark(q) {
    let list = getBookmarks().filter(b => b.q !== q);
    list.unshift({ q, savedAt: Date.now() });
    if (list.length > 50) list = list.slice(0, 50); // 上限50件・最古を落とす
    try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list)); }
    catch { /* ストレージ不可環境では黙って諦める */ }
}
function removeBookmark(q) {
    try {
        localStorage.setItem(BOOKMARK_KEY,
            JSON.stringify(getBookmarks().filter(b => b.q !== q)));
    } catch { /* 同上 */ }
}

function updateBookmarkBtn() {
    const btn = document.getElementById('bookmark-btn');
    if (!btn) return; // SW更新過渡期の旧HTML+新JS混成でも壊さない
    const saved = isBookmarked(encodeHand(currentHand));
    btn.textContent = saved ? '🔖 保存済み' : '🔖 保存';
    btn.classList.toggle('saved', saved);
}
function toggleBookmark() {
    if (currentHand.length !== 13) return; // 生成完了前の空手牌ウィンドウで空エントリを作らない
    const q = encodeHand(currentHand);
    if (isBookmarked(q)) removeBookmark(q); else addBookmark(q);
    updateBookmarkBtn();
}

// 手動登録（mpsz文字列 or 共有URLの貼り付け。正準形で保存）
function registerBookmarkFromInput() {
    const input = document.getElementById('bookmark-add-input');
    const error = document.getElementById('bookmark-add-error');
    if (!input) return;
    let v = input.value.trim();
    const m = v.match(/[?&]q=([1-9mpsz]+)/); // 共有URLなら ?q= を抽出
    if (m) v = m[1];
    const tiles = decodeHand(v);
    if (!tiles) {
        if (error) error.textContent = '形式が正しくありません（例: 123m456p78889s11z か 共有URL）';
        return;
    }
    const q = encodeHand(tiles);
    addBookmark(q);
    if (!isBookmarked(q)) { // ストレージ不可環境（プライベートモード等）では成功に見せない
        if (error) error.textContent = '保存できませんでした（ブラウザのストレージが利用できません）';
        return;
    }
    input.value = '';
    if (error) error.textContent = '';
    renderBookmarkList();
    updateBookmarkBtn(); // 現在の出題手牌を登録した場合、回答画面の保存ボタン表示も同期
}

// ヘッダー🔖モーダルの一覧描画
function renderBookmarkList() {
    const container = document.getElementById('bookmark-list');
    container.innerHTML = '';
    const list = getBookmarks();
    let rendered = 0;
    list.forEach(item => {
        const tiles = decodeHand(item.q);
        if (!tiles) return; // 壊れたエントリはスキップ
        rendered++;
        const row = document.createElement('div');
        row.className = 'bookmark-item';
        const tilesDiv = document.createElement('div');
        tilesDiv.className = 'bm-tiles';
        tiles.forEach(t => {
            const img = document.createElement('img');
            img.src = `pai-images/${getTileImageFilename(t)}`;
            tilesDiv.appendChild(img);
        });
        const openBtn = document.createElement('button');
        openBtn.textContent = '開く';
        openBtn.className = 'bm-open';
        openBtn.onclick = () => { location.href = location.pathname + '?q=' + item.q; };
        const delBtn = document.createElement('button');
        delBtn.textContent = '削除';
        delBtn.className = 'bm-del';
        delBtn.onclick = () => { removeBookmark(item.q); renderBookmarkList(); updateBookmarkBtn(); };
        row.append(tilesDiv, openBtn, delBtn);
        container.appendChild(row);
    });
    if (rendered === 0) {
        container.textContent = 'ブックマークはまだありません'; // 全件壊れエントリでも空白にしない
    }
}
