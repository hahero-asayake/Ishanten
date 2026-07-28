const CACHE_NAME = 'nanikiru-cache-v4';
// キャッシュするファイルのリスト（?v= は index.html の参照と必ず一致させる）
const urlsToCache = [
  '.',
  'index.html',
  'style.css?v=4',
  'script.js?v=4',
  'manifest.json'
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
  // ※全requestへの ignoreSearch は禁止（style.css?v=4 が旧 style.css にマッチしてバスト無効化するため）
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(r => r || fetch(event.request))
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
