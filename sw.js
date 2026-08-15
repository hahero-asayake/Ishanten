const CACHE_NAME = 'nanikiru-cache-v6';
// キャッシュするファイルのリスト（?v= は index.html の参照と必ず一致させる）
const urlsToCache = [
  '.',
  'index.html',
  'style.css?v=6',
  'script.js?v=6',
  'manifest.json',
  // 言語別ページ（オフライン時も日本語版と同じ体験にする。3ページ分＝数十KB程度で増分は小さい）
  'en/',
  'en/index.html',
  'zh-Hant/',
  'zh-Hant/index.html',
  'zh-Hans/',
  'zh-Hans/index.html'
  // 画像は動的にキャッシュするため、ここには含めない
];

// インストールイベント
self.addEventListener('install', event => {
  self.skipWaiting(); // 新SWを待機なしで即時有効化
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // cache:'reload' でブラウザHTTPキャッシュを迂回（CDNエッジ(max-age=600)は迂回不可＝push後10分の窓は運用で吸収）
        return cache.addAll(urlsToCache.map(u => new Request(u, { cache: 'reload' })));
      })
  );
});

// フェッチイベント
self.addEventListener('fetch', event => {
  // ページ遷移（?q= 付き共有URL含む）はキャッシュ済み index.html を返す
  // 言語別ページ（/en/ /zh-Hant/ /zh-Hans/）はそれぞれの index.html を返す（無条件に日本語版へフォールバックしない）
  // ※全requestへの ignoreSearch は禁止（style.css?v=6 が旧 style.css にマッチしてバスト無効化するため）
  if (event.request.mode === 'navigate') {
    const langMatch = new URL(event.request.url).pathname.match(/\/(en|zh-Hant|zh-Hans)(?:\/|$)/);
    const cacheKey = langMatch ? `./${langMatch[1]}/index.html` : './index.html';
    event.respondWith(
      caches.match(cacheKey).then(r => r || fetch(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにヒットすれば、それを返す
        if (response) {
          return response;
        }

        // キャッシュになければ、ネットワークからフェッチする
        return fetch(event.request).then(
          response => {
            // レスポンスが有効かチェック
            if(!response || response.status !== 200 || response.type !== 'basic' && !event.request.url.includes('pai-images')) {
              return response;
            }

            // レスポンスをクローンして、片方をキャッシュに保存
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// アクティベートイベント
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // 古いキャッシュを削除
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 開いている既存タブも新SWの管理下へ
  );
});
