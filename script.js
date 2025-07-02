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

// 以下、UI制御やイベントリスナー部分は元のまま…
