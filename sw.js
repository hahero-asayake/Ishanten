const CACHE_NAME = 'nanikiru-cache-v1';
// キャッシュするファイルのリスト
const urlsToCache = [
  '.',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json'
  // 画像は動的にキャッシュするため、ここには含めない
];

// インストールイベント
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// フェッチイベント
self.addEventListener('fetch', event => {
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
    })
  );
});
