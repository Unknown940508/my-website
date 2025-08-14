document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('drawBtn');
    const result = document.getElementById('result');

    // 想要的結果 + 權重（數字越大機率越高）
    // 你可以自行調整：例如把超大吉設更低或更高
    const pool = [
        { label: '超大吉', weight: 5 },   // ~5%
        { label: '中吉', weight: 40 },  // ~40%
        { label: '小吉', weight: 35 },  // ~35%
        { label: '吉', weight: 20 },  // ~20%
    ];

    // 顏色對應（全都是好籤，給不同綠色系）
    const colorMap = {
        '超大吉': '#16a34a', // 深綠
        '中吉': '#22c55e',
        '小吉': '#4ade80',
        '吉': '#86efac'
    };

    // 權重隨機挑選
    function weightedPick(items) {
        const total = items.reduce((sum, it) => sum + it.weight, 0);
        let r = Math.random() * total; // 0 ~ total
        for (const it of items) {
            r -= it.weight;
            if (r <= 0) return it.label;
        }
        // 理論上到不了這行，保險用
        return items[items.length - 1].label;
    }

    btn.addEventListener('click', () => {
        // 抽籤
        const pick = weightedPick(pool);

        // 先清掉前一次的動畫 class
        result.classList.remove('reveal', 'celebrate');

        // 更新文字/顏色
        result.textContent = `今日運勢：${pick}`;
        document.getElementById('noteCard').hidden = false; // 顯示右邊卡片
        document.getElementById('noteText').textContent = '只是機率而已！沒抽到好籤不要難過！';

        result.style.fontWeight = '700';
        result.style.color = colorMap[pick] || '#222';

        // 強制重排，讓同一個 class 可以重新觸發動畫
        //（這行是重點小技巧）
        void result.offsetWidth;

        // 套上動畫
        result.classList.add('reveal');
        if (pick === '超大吉') {
            result.classList.add('celebrate');
        }

        // 防手滑連點：短暫停用按鈕 400ms
        btn.disabled = true;
        setTimeout(() => { btn.disabled = false; }, 400);
    });
});

document.querySelectorAll('.has-sub > a').forEach(link => {
  link.addEventListener('click', function(e) {
    if (window.innerWidth <= 860) { // 手機才啟用
      e.preventDefault(); // 阻止直接跳轉
      const submenu = this.nextElementSibling;
      submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
    }
  });
});

// 手機：點擊「作品/社群」展開/收合子選單（滑動動畫）
// 不影響桌機（桌機仍然用 hover 展開）
(function(){
  const MOBILE_MAX = 860;

  function isMobile(){ return window.innerWidth <= MOBILE_MAX; }

  // 1) 點主選單切換該小選單
  document.querySelectorAll('.nav .has-sub > a').forEach(parentLink => {
    parentLink.addEventListener('click', (e) => {
      if (!isMobile()) return;          // 桌機不攔截
      e.preventDefault();

      const submenu = parentLink.nextElementSibling; // .submenu
      if (!submenu) return;

      const isOpen = submenu.classList.contains('open');

      // 關閉其他已開啟的
      document.querySelectorAll('.nav .submenu.open').forEach(s => {
        if (s !== submenu) s.classList.remove('open');
      });

      // 切換當前
      submenu.classList.toggle('open', !isOpen);

      // 無障礙：標記展開狀態
      parentLink.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // 2) 點頁面其他地方就收合
  document.addEventListener('click', (e) => {
    if (!isMobile()) return;
    const inMenu = e.target.closest('.nav');
    if (!inMenu){
      document.querySelectorAll('.nav .submenu.open').forEach(s => s.classList.remove('open'));
      document.querySelectorAll('.nav .has-sub > a[aria-expanded]').forEach(a => a.removeAttribute('aria-expanded'));
    }
  });

  // 3) 視窗從手機切回桌機時，清理內聯狀態
  window.addEventListener('resize', () => {
    if (!isMobile()){
      document.querySelectorAll('.nav .submenu.open').forEach(s => s.classList.remove('open'));
      document.querySelectorAll('.nav .has-sub > a[aria-expanded]').forEach(a => a.removeAttribute('aria-expanded'));
    }
  });
})();

// === YouTube 磁磚：自動套縮圖、點擊後內嵌播放 ===
(function(){
  const tiles = document.querySelectorAll('.yt-tile');
  tiles.forEach(tile => {
    const vid = tile.getAttribute('data-yt');
    if (!vid) return;

    // 1) 設定縮圖（YouTube 高畫質縮圖）
    const img = tile.querySelector('.thumb');
    if (img && !img.src){
      img.src = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
      img.alt = img.alt || '影片縮圖';
      img.loading = 'lazy';
      img.decoding = 'async';
    }

    // 2) 點擊後替換為 iframe 播放
    tile.addEventListener('click', () => {
      // 只替換一次
      if (tile.dataset.playing === '1') return;
      tile.dataset.playing = '1';

      const iframe = document.createElement('iframe');
      iframe.className = 'yt-embed';
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`;
      iframe.loading = 'lazy';

      // 清掉縮圖（保留時長小標也可以移除）
      tile.innerHTML = '';
      tile.appendChild(iframe);
    });
  });
})();


// === YouTube 磁磚：解析任何分享連結、自動直/橫式、點擊播放 ===
(function(){
  function parseYouTube(url){
    try{
      const u = new URL(url);
      // youtu.be/<id>
      if (u.hostname === 'youtu.be') {
        return { id: u.pathname.slice(1), isShort: false };
      }
      // youtube.com/watch?v=<id>
      if (u.pathname === '/watch' && u.searchParams.get('v')) {
        return { id: u.searchParams.get('v'), isShort: false };
      }
      // youtube.com/shorts/<id>
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2];
        return { id, isShort: true };
      }
      // 其他（例如嵌入連結）
      const m = url.match(/(?:embed|v|shorts)\/([a-zA-Z0-9_-]{6,})/);
      if (m) return { id: m[1], isShort: url.includes('/shorts/') };
    }catch(e){}
    return null;
  }

  document.querySelectorAll('.yt-tile').forEach(tile => {
    const raw = tile.getAttribute('data-url');
    if (!raw) return;
    const info = parseYouTube(raw);
    if (!info) return;

    // 依影片型態切換直/橫式
    tile.classList.toggle('short', !!info.isShort);

    // 設定縮圖（YouTube 縮圖皆橫式，Shorts 也會給橫圖，OK）
    const img = tile.querySelector('.thumb');
    if (img && !img.src) {
      img.src = `https://i.ytimg.com/vi/${info.id}/maxresdefault.jpg`;
      img.alt = img.alt || '影片縮圖';
      img.loading = 'lazy';
      img.decoding = 'async';
    }

    // 點擊播放（只替換一次）
    tile.addEventListener('click', () => {
      if (tile.dataset.playing === '1') return;
      tile.dataset.playing = '1';

      const iframe = document.createElement('iframe');
      iframe.className = 'yt-embed';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.src = `https://www.youtube.com/embed/${info.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

      tile.innerHTML = '';
      tile.appendChild(iframe);
    });
  });
})();
