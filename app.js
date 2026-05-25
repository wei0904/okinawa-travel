// === 全域狀態 ===
let currentTab = 'restaurants';
let currentCategory = 'all';
let currentDay = 1;
let totalDays = 5;
let routePlan = {}; // { 1: [item, ...], 2: [...] }

// 初始化路線資料
for (let i = 1; i <= totalDays; i++) routePlan[i] = [];

// === 初始化 ===
document.addEventListener('DOMContentLoaded', () => {
    loadRouteFromStorage();
    renderCards();
    bindNavigation();
    bindSearch();
    bindCategoryTags();
    bindRouteControls();
    bindQA();
    bindModal();
});

// === 導航切換 ===
function bindNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            currentCategory = 'all';
            switchTab();
        });
    });
}

function switchTab() {
    const searchBar = document.getElementById('search-bar');
    const cardContainer = document.getElementById('card-container');
    const routePlanner = document.getElementById('route-planner');
    const qaSection = document.getElementById('qa-section');

    // 隱藏所有分類標籤
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');

    // 重設分類標籤
    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));

    if (currentTab === 'route') {
        searchBar.style.display = 'none';
        cardContainer.style.display = 'none';
        routePlanner.style.display = 'block';
        qaSection.style.display = 'none';
        renderRoute();
    } else if (currentTab === 'qa') {
        searchBar.style.display = 'none';
        cardContainer.style.display = 'none';
        routePlanner.style.display = 'none';
        qaSection.style.display = 'block';
    } else {
        searchBar.style.display = 'flex';
        cardContainer.style.display = 'grid';
        routePlanner.style.display = 'none';
        qaSection.style.display = 'none';

        // 顯示對應分類標籤
        const tagMap = {
            restaurants: 'category-tags',
            attractions: 'attraction-tags',
            shopping: 'shopping-tags'
        };
        const tagEl = document.getElementById(tagMap[currentTab]);
        if (tagEl) {
            tagEl.style.display = 'block';
            tagEl.querySelector('.tag').classList.add('active');
        }

        renderCards();
    }
}

// === 搜尋 ===
function bindSearch() {
    document.getElementById('search-input').addEventListener('input', renderCards);
    document.getElementById('area-filter').addEventListener('change', renderCards);
}

// === 分類標籤 ===
function bindCategoryTags() {
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const container = tag.closest('.tags-container');
            container.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            currentCategory = tag.dataset.category;
            renderCards();
        });
    });
}

// === 渲染卡片 ===
function renderCards() {
    const container = document.getElementById('card-container');
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const areaFilter = document.getElementById('area-filter').value;

    let data = [];
    if (currentTab === 'restaurants') data = restaurants;
    else if (currentTab === 'attractions') data = attractions;
    else if (currentTab === 'shopping') data = shopping;

    let filtered = data.filter(item => {
        const matchCategory = currentCategory === 'all' || item.category === currentCategory;
        const matchSearch = !searchText ||
            item.name.toLowerCase().includes(searchText) ||
            item.desc.toLowerCase().includes(searchText) ||
            item.category.toLowerCase().includes(searchText);
        const matchArea = areaFilter === 'all' || item.area === areaFilter;
        return matchCategory && matchSearch && matchArea;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-results">沒有找到符合條件的結果，請嘗試調整搜尋或篩選條件</div>';
        return;
    }

    container.innerHTML = filtered.map(item => `
        <div class="card" data-id="${item.id}">
            <div class="card-img-wrapper">
                <div class="card-img">${item.icon}</div>
            </div>
            <div class="card-body">
                <h3>${item.name}</h3>
                <span class="card-category">${item.category}</span>
                <span class="card-area">${item.area}</span>
                <p>${item.desc}</p>
                <div class="card-meta">
                    <span class="card-price">${item.price.toString().startsWith('~') || item.price.toString().startsWith('免費') ? item.price : '¥' + item.price}</span>
                    <span class="card-rating">${'★'.repeat(Math.floor(item.rating))}${'☆'.repeat(5 - Math.floor(item.rating))} ${item.rating}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-detail" onclick="showDetail('${item.id}')">詳細資訊</button>
                    <button class="btn-add-route" onclick="event.stopPropagation(); addToRoute('${item.id}')">加入行程</button>
                </div>
            </div>
        </div>
    `).join('');
}

// === 詳細資訊彈窗 ===
function bindModal() {
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal')) closeModal();
    });
}

function showDetail(id) {
    const item = findItemById(id);
    if (!item) return;

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery || item.name + ' 沖繩')}`;
    const jpSearchName = item.jpName || item.name;
    const tabelogUrl = `https://tabelog.com/okinawa/rstLst/?vs=1&sk=${encodeURIComponent(jpSearchName)}`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(jpSearchName + ' 沖縄 口コミ')}`;
    const igUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(jpSearchName.replace(/\s+/g, ''))}/`;

    const priceDisplay = item.price.toString().startsWith('~') || item.price.toString().startsWith('免費') || item.price.toString().includes('依') ? item.price : '¥' + item.price;

    // 判斷是否為餐廳（顯示Tabelog連結）
    const isRestaurant = restaurants.some(r => r.id === id);

    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center; font-size:4em; margin-bottom:15px;">${item.icon}</div>
        <h2>${item.name}</h2>
        ${item.jpName ? `<p style="color:#888; font-size:0.9em; margin-bottom:8px;">${item.jpName}</p>` : ''}
        <span class="detail-category">${item.category}</span>
        <span class="detail-area">${item.area}</span>

        <div class="detail-section">
            <h4>介紹</h4>
            <p>${item.desc}</p>
        </div>

        <div class="detail-section">
            <h4>地址</h4>
            <p>${item.address}</p>
        </div>

        <div class="detail-section">
            <h4>營業時間</h4>
            <p>${item.hours}</p>
        </div>

        <div class="detail-section">
            <h4>價格</h4>
            <p>${priceDisplay}</p>
        </div>

        <div class="detail-section">
            <h4>小提醒</h4>
            <p>${item.tips}</p>
        </div>

        <div class="detail-links">
            <h4>外部連結</h4>
            <div class="link-buttons">
                <a href="${mapUrl}" target="_blank" class="link-btn link-maps">Google Maps</a>
                ${isRestaurant ? `<a href="${tabelogUrl}" target="_blank" class="link-btn link-tabelog">Tabelog 食べログ</a>` : ''}
                <a href="${googleUrl}" target="_blank" class="link-btn link-google">Google 搜尋評價</a>
                <a href="${igUrl}" target="_blank" class="link-btn link-ig">Instagram</a>
            </div>
        </div>

        <button class="modal-add-route" onclick="addToRoute('${item.id}');">加入行程</button>
    `;

    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// === 路線規劃 ===
function bindRouteControls() {
    // 天數標籤
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentDay = parseInt(tab.dataset.day);
            renderRoute();
        });
    });

    // 新增天數
    document.getElementById('add-day').addEventListener('click', () => {
        totalDays++;
        routePlan[totalDays] = [];
        const newTab = document.createElement('button');
        newTab.className = 'day-tab';
        newTab.dataset.day = totalDays;
        newTab.textContent = `Day ${totalDays}`;
        newTab.addEventListener('click', () => {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            newTab.classList.add('active');
            currentDay = totalDays;
            renderRoute();
        });
        document.getElementById('add-day').before(newTab);
    });

    // 匯出行程
    document.getElementById('export-route').addEventListener('click', exportRoute);
}

function addToRoute(id, day) {
    const item = findItemById(id);
    if (!item) return;

    // 如果沒指定天數，彈出選擇器
    if (!day) {
        showDayPicker(id);
        return;
    }

    if (!routePlan[day]) routePlan[day] = [];

    // 檢查是否已存在
    if (routePlan[day].find(i => i.id === id)) {
        showToast(`${item.name} 已在 Day ${day} 行程中`);
        return;
    }

    routePlan[day].push(item);
    saveRouteToStorage();
    showToast(`已將 ${item.name} 加入 Day ${day}`);
    closeDayPicker();
}

function showDayPicker(id) {
    closeDayPicker();
    const overlay = document.createElement('div');
    overlay.className = 'day-picker-overlay';
    overlay.onclick = closeDayPicker;

    const picker = document.createElement('div');
    picker.className = 'day-picker';
    picker.onclick = e => e.stopPropagation();

    picker.innerHTML = `
        <p class="day-picker-title">選擇加入哪一天</p>
        <div class="day-picker-buttons">
            ${Array.from({length: totalDays}, (_, i) => i + 1)
                .map(d => `<button class="day-picker-btn${d === currentDay ? ' current' : ''}" onclick="addToRoute('${id}', ${d})">Day ${d}</button>`)
                .join('')}
        </div>
    `;

    overlay.appendChild(picker);
    document.body.appendChild(overlay);
}

function closeDayPicker() {
    const existing = document.querySelector('.day-picker-overlay');
    if (existing) existing.remove();
}

function removeFromRoute(day, id) {
    routePlan[day] = routePlan[day].filter(i => i.id !== id);
    saveRouteToStorage();
    renderRoute();
}

function renderRoute() {
    const list = document.getElementById('route-list');
    const items = routePlan[currentDay] || [];

    if (items.length === 0) {
        list.innerHTML = `
            <div class="empty-route">
                <p>Day ${currentDay} 尚未加入任何地點</p>
                <p>請到餐廳、景點或購物頁面，點擊「加入行程」按鈕</p>
            </div>`;
    } else {
        let html = '';
        items.forEach((item, idx) => {
            if (idx > 0) {
                html += '<div class="route-connector">↓</div>';
            }
            html += `
                <div class="route-item" draggable="true" data-idx="${idx}">
                    <div class="route-order">${idx + 1}</div>
                    <div class="route-info">
                        <h4>${item.icon} ${item.name}</h4>
                        <small>${item.category} · ${item.area} · ${item.price.toString().startsWith('~') || item.price.toString().startsWith('免費') || item.price.toString().includes('依') ? item.price : '¥' + item.price}</small>
                    </div>
                    <button class="route-remove" onclick="removeFromRoute(${currentDay}, '${item.id}')">✕</button>
                </div>`;
        });
        list.innerHTML = html;
        bindDragAndDrop();
    }

    renderRouteSummary();
}

function renderRouteSummary() {
    const summary = document.getElementById('summary-content');
    let html = '';

    for (let d = 1; d <= totalDays; d++) {
        const items = routePlan[d] || [];
        if (items.length === 0) continue;

        html += `<div style="margin-bottom:15px;">
            <strong style="color:#ff7043;">Day ${d}</strong>
            <span style="color:#999; font-size:0.85em;">（${items.length} 個地點）</span>
            <ul style="list-style:none; padding:5px 0;">`;

        items.forEach(item => {
            html += `<li style="padding:3px 0; font-size:0.9em;">${item.icon} ${item.name}</li>`;
        });

        html += '</ul></div>';
    }

    if (!html) {
        html = '<p style="color:#999; text-align:center;">選擇地點後將顯示行程摘要</p>';
    }

    summary.innerHTML = html;
}

// === 拖拽排序 ===
function bindDragAndDrop() {
    const items = document.querySelectorAll('.route-item');
    let dragIdx = null;

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            dragIdx = parseInt(item.dataset.idx);
            item.style.opacity = '0.5';
        });

        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            item.style.background = '#e0f7fa';
        });

        item.addEventListener('dragleave', () => {
            item.style.background = '#f5f5f5';
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropIdx = parseInt(item.dataset.idx);
            if (dragIdx !== null && dragIdx !== dropIdx) {
                const arr = routePlan[currentDay];
                const [moved] = arr.splice(dragIdx, 1);
                arr.splice(dropIdx, 0, moved);
                saveRouteToStorage();
                renderRoute();
            }
        });
    });
}

// === 匯出行程 ===
function exportRoute() {
    let text = '=== 沖繩旅遊行程表 ===\n\n';
    let hasContent = false;

    for (let d = 1; d <= totalDays; d++) {
        const items = routePlan[d] || [];
        if (items.length === 0) continue;
        hasContent = true;

        text += `【Day ${d}】\n`;
        items.forEach((item, idx) => {
            text += `  ${idx + 1}. ${item.name}\n`;
            text += `     類別：${item.category} | 區域：${item.area}\n`;
            text += `     地址：${item.address}\n`;
            text += `     時間：${item.hours}\n`;
            text += `     費用：${item.price}\n`;
            text += `     備註：${item.tips}\n\n`;
        });
        text += '\n';
    }

    if (!hasContent) {
        showToast('行程表是空的，請先加入地點');
        return;
    }

    // 下載文字檔
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '沖繩旅遊行程表.txt';
    a.click();
    URL.revokeObjectURL(url);

    showToast('行程表已匯出！');
}

// === Q&A 問答 ===
function bindQA() {
    const input = document.getElementById('qa-input');
    const sendBtn = document.getElementById('qa-send');

    sendBtn.addEventListener('click', () => sendQuestion());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendQuestion();
    });

    // 快速問題
    document.querySelectorAll('.quick-q').forEach(btn => {
        btn.addEventListener('click', () => {
            input.value = btn.dataset.q;
            sendQuestion();
        });
    });
}

function sendQuestion() {
    const input = document.getElementById('qa-input');
    const question = input.value.trim();
    if (!question) return;

    addChatMessage(question, 'user');
    input.value = '';

    // 查找答案
    setTimeout(() => {
        const answer = findAnswer(question);
        addChatMessage(answer, 'bot');
    }, 500);
}

function findAnswer(question) {
    const q = question.toLowerCase();

    // ============================
    // 第一步：先偵測有沒有提到具體分類
    // 有的話優先走分類推薦，不會被知識庫攔截
    // ============================

    // === 分類餐廳查詢 ===
    const categoryMap = {
        '燒肉': '燒肉', '烤肉': '燒肉', '和牛': '燒肉',
        '拉麵': '拉麵/沖繩麵', '沖繩麵': '拉麵/沖繩麵', 'そば': '拉麵/沖繩麵', '麵': '拉麵/沖繩麵',
        '海鮮': '壽司/海鮮', '壽司': '壽司/海鮮', '生魚片': '壽司/海鮮', '魚': '壽司/海鮮',
        '咖啡': '咖啡廳', '下午茶': '咖啡廳', '喝茶': '咖啡廳', 'cafe': '咖啡廳',
        '牛排': '牛排', 'steak': '牛排',
        '居酒屋': '居酒屋', '喝酒': '居酒屋', '宵夜': '居酒屋', '泡盛': '居酒屋',
        '甜點': '甜點/冰品', '冰淇淋': '甜點/冰品', '冰': '甜點/冰品', '刨冰': '甜點/冰品', '蛋糕': '甜點/冰品',
        '漢堡': '漢堡/美式', '美式': '漢堡/美式', '塔可': '漢堡/美式',
        '早午餐': '早午餐', '早餐': '早午餐', '鬆餅': '早午餐', 'brunch': '早午餐',
        '沖繩料理': '沖繩料理', '傳統': '沖繩料理', '古民家': '沖繩料理',
    };

    // 判斷有沒有提到特定餐廳種類
    let matchedCategory = null;
    for (const [keyword, cat] of Object.entries(categoryMap)) {
        if (q.includes(keyword)) { matchedCategory = cat; break; }
    }

    // === 景點分類查詢 ===
    const attractionCategoryMap = {
        '海灘': '海灘', '海邊': '海灘', '玩水': '海灘', '游泳': '海灘', '沙灘': '海灘',
        '歷史': '歷史文化', '城跡': '歷史文化', '世界遺產': '歷史文化', '古蹟': '歷史文化',
        '水族館': '主題樂園', '樂園': '主題樂園', '動物園': '主題樂園',
        '浮潛': '體驗活動', '潛水': '體驗活動', '體驗': '體驗活動', '賞鯨': '體驗活動', '陶器': '體驗活動',
        '神社': '神社寺廟', '御嶽': '神社寺廟', '拜拜': '神社寺廟', '御守': '神社寺廟',
    };

    let matchedAttrCat = null;
    for (const [keyword, cat] of Object.entries(attractionCategoryMap)) {
        if (q.includes(keyword)) { matchedAttrCat = cat; break; }
    }

    // === 判斷是否只要「一家」「其中一家」推薦 ===
    const isAskingForOne = q.includes('一家') || q.includes('一間') || q.includes('其中') ||
        q.includes('推薦一') || q.includes('最推') || q.includes('選一') ||
        q.includes('第一名') || q.includes('最好') || q.includes('no.1') || q.includes('冠軍') ||
        q.includes('最愛') || q.includes('最強') || q.includes('哪一家') || q.includes('哪間') ||
        q.includes('選誰') || q.includes('首選') || q.includes('必去') || q.includes('必吃');

    // === 指定分類 + 只要一家 → 給人味推薦語 ===
    if (matchedCategory && isAskingForOne) {
        const pick = personalPicks[matchedCategory];
        if (pick) {
            return pick.reason + '\n\n💰 ' + pick.budget;
        }
    }

    if (matchedAttrCat && isAskingForOne) {
        const pick = personalAttrPicks[matchedAttrCat];
        if (pick) {
            return pick.reason;
        }
    }

    // === 沒指定分類 + 只要一家 → 各類 Top 1 人味版 ===
    if (isAskingForOne) {
        return `如果各只選一家，我的私心推薦：\n\n` +
            `🥩【燒肉】燒肉琉球之牛 北谷店\n→ 邊看海邊吃和牛，沖繩才有的享受。必須預約！\n\n` +
            `🍜【沖繩麵】きしもと食堂（本部）\n→ 百年老店，柴火煮的麵條口感獨特。去水族館那天中午吃。\n\n` +
            `☕【咖啡廳】浜辺の茶屋（南城）\n→ 海水就在腳下的木造咖啡廳，光發呆就值得去。\n\n` +
            `🐠【景點】沖繩美麗海水族館\n→ 站在黑潮之海前面看鯨鯊游過，會感動到起雞皮疙瘩。\n\n` +
            `🌉【自然】古宇利大橋＆古宇利島\n→ 開車過橋的那2公里，兩側的海藍到不真實。\n\n` +
            `🌮【平價美食】キングタコス 金武本店\n→ 塔可飯發源地，份量大到嚇人只要600圓。\n\n` +
            `想聽某一類的詳細推薦嗎？可以問我「燒肉推薦一家」「咖啡廳哪間最好」之類的！`;
    }

    // === 指定分類（不限一家）→ 人味開頭 + 列表 ===
    if (matchedCategory) {
        const pick = personalPicks[matchedCategory];
        const results = restaurants.filter(r => r.category === matchedCategory).sort((a, b) => b.rating - a.rating);
        let answer = '';
        if (pick) {
            const topItem = findItemById(pick.pick);
            answer += `我最推的是「${topItem ? topItem.name : ''}」，不過以下幾家也都很不錯：\n\n`;
        } else {
            answer += `${matchedCategory}推薦：\n\n`;
        }
        results.slice(0, 5).forEach((r, i) => {
            answer += `${i + 1}. 【${r.name}】★${r.rating}\n${r.desc}\n📍${r.area} | 💰${r.price}\n\n`;
        });
        if (pick) answer += `💰 ${pick.budget}`;
        return answer;
    }

    // === 指定景點分類（不限一個）→ 人味開頭 + 列表 ===
    if (matchedAttrCat) {
        const pick = personalAttrPicks[matchedAttrCat];
        const results = attractions.filter(a => a.category === matchedAttrCat).sort((a, b) => b.rating - a.rating);
        let answer = '';
        if (pick) {
            const topItem = findItemById(pick.pick);
            answer += `我最推的是「${topItem ? topItem.name : ''}」，其他也很值得去：\n\n`;
        } else {
            answer += `${matchedAttrCat}推薦：\n\n`;
        }
        results.slice(0, 5).forEach((a, i) => {
            answer += `${i + 1}. 【${a.name}】★${a.rating}\n${a.desc}\n📍${a.area} | 💰${a.price}\n\n`;
        });
        return answer;
    }

    // ============================
    // 第二步：沒有具體分類 → 走知識庫匹配
    // ============================
    if (q.includes('季節') || q.includes('什麼時候') || q.includes('幾月'))
        return qaKnowledge['最佳旅遊季節'];
    if (q.includes('自駕') || q.includes('開車') || q.includes('租車') || q.includes('駕照'))
        return qaKnowledge['自駕注意事項'];
    if (q.includes('伴手禮') || q.includes('必買') || q.includes('紀念品') || q.includes('土產'))
        return qaKnowledge['必買伴手禮'];
    if (q.includes('親子') || q.includes('小孩') || q.includes('兒童') || q.includes('小朋友'))
        return qaKnowledge['親子旅遊推薦'];
    if (q.includes('機場') || q.includes('交通') || q.includes('市區') || q.includes('電車') || q.includes('單軌'))
        return qaKnowledge['機場交通'];
    if (q.includes('住宿') || q.includes('飯店') || q.includes('旅館') || q.includes('住哪'))
        return qaKnowledge['住宿推薦'];
    if (q.includes('預算') || q.includes('花費') || q.includes('多少錢') || q.includes('費用'))
        return qaKnowledge['預算規劃'];
    // 「美食/必吃/好吃」放最後，避免攔截「最好吃的燒肉」這類問題
    if (q.includes('美食') || q.includes('必吃') || q.includes('吃什麼') || q.includes('好吃'))
        return qaKnowledge['必吃美食'];

    // ============================
    // 第三步：一般性搜尋
    // ============================

    // === 搜尋餐廳 ===
    if (q.includes('餐廳') || q.includes('推薦吃') || q.includes('吃') || q.includes('餐')) {
        const top = [...restaurants].sort((a, b) => b.rating - a.rating);
        let answer = '綜合評分最高的餐廳：\n\n';
        top.slice(0, 5).forEach(r => {
            answer += `【${r.name}】★${r.rating} - ${r.category}\n${r.desc}\n📍${r.area} | 💰${r.price}\n\n`;
        });
        return answer;
    }

    // === 景點查詢 ===
    if (q.includes('景點') || q.includes('去哪') || q.includes('玩什麼') || q.includes('好玩') || q.includes('觀光')) {
        const top = [...attractions].sort((a, b) => b.rating - a.rating);
        let answer = '綜合評分最高的景點：\n\n';
        top.slice(0, 5).forEach(a => {
            answer += `【${a.name}】★${a.rating} - ${a.category}\n${a.desc}\n📍${a.area} | 💰${a.price}\n\n`;
        });
        return answer;
    }

    // === 購物查詢 ===
    if (q.includes('購物') || q.includes('逛街') || q.includes('買東西') || q.includes('商店') || q.includes('超市') || q.includes('藥妝')) {
        const results = q.includes('藥妝') ? shopping.filter(s => s.category === '藥妝店') :
                        q.includes('超市') ? shopping.filter(s => s.category === '超市') :
                        [...shopping].sort((a, b) => b.rating - a.rating);
        let answer = '購物推薦：\n\n';
        results.slice(0, 5).forEach(s => {
            answer += `【${s.name}】★${s.rating} - ${s.category}\n${s.desc}\n📍${s.area}\n\n`;
        });
        return answer;
    }

    // === 特定區域查詢 ===
    const areas = ['那霸', '北谷', '恩納', '名護', '本部', '讀谷', '南城', '糸滿', '今歸仁', '浦添', '豐見城', '宜野灣', '國頭', '金武'];
    for (const area of areas) {
        if (q.includes(area)) {
            const areaRestaurants = restaurants.filter(i => i.area === area).sort((a, b) => b.rating - a.rating);
            const areaAttractions = attractions.filter(i => i.area === area).sort((a, b) => b.rating - a.rating);
            const areaShopping = shopping.filter(i => i.area === area).sort((a, b) => b.rating - a.rating);

            let answer = `📍 ${area}地區推薦：\n\n`;

            if (areaRestaurants.length > 0) {
                answer += `【美食】\n`;
                areaRestaurants.slice(0, 3).forEach(item => {
                    answer += `・${item.name}（${item.category}）★${item.rating}\n`;
                });
                answer += '\n';
            }
            if (areaAttractions.length > 0) {
                answer += `【景點】\n`;
                areaAttractions.slice(0, 3).forEach(item => {
                    answer += `・${item.name}（${item.category}）★${item.rating}\n`;
                });
                answer += '\n';
            }
            if (areaShopping.length > 0) {
                answer += `【購物】\n`;
                areaShopping.slice(0, 3).forEach(item => {
                    answer += `・${item.name}（${item.category}）★${item.rating}\n`;
                });
                answer += '\n';
            }

            if (areaRestaurants.length + areaAttractions.length + areaShopping.length === 0) {
                answer += '目前沒有收錄此區域的資訊。';
            }

            return answer;
        }
    }

    // === 模糊搜尋：在所有資料中搜尋關鍵字 ===
    const allItems = [...restaurants, ...attractions, ...shopping];
    const searchResults = allItems.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.tips.toLowerCase().includes(q)
    );

    if (searchResults.length > 0) {
        let answer = `找到以下相關結果：\n\n`;
        searchResults.slice(0, 5).forEach(item => {
            answer += `【${item.name}】${item.category} ★${item.rating}\n${item.desc}\n📍${item.area}\n\n`;
        });
        return answer;
    }

    // === 預設回答 ===
    return `抱歉，我不太確定「${question}」的意思。\n\n你可以試試這樣問我：\n\n` +
        `📌 推薦類：\n・「推薦一家燒肉」「最好的咖啡廳」「推薦一家你會選誰」\n\n` +
        `📌 分類查詢：\n・「燒肉」「沖繩麵」「海灘」「甜點」「居酒屋」\n\n` +
        `📌 區域查詢：\n・「那霸有什麼」「北谷」「恩納」「名護」\n\n` +
        `📌 實用資訊：\n・「自駕注意事項」「必買伴手禮」「預算多少」「住宿推薦」`;
}

function addChatMessage(text, type) {
    const chat = document.getElementById('qa-chat');
    const msg = document.createElement('div');
    msg.className = `chat-message ${type}`;
    msg.innerHTML = `<div class="chat-bubble">${text}</div>`;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

// === 工具函數 ===
function findItemById(id) {
    return [...restaurants, ...attractions, ...shopping].find(i => i.id === id);
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// === LocalStorage 持久化 ===
function saveRouteToStorage() {
    localStorage.setItem('okinawa-route', JSON.stringify(routePlan));
    localStorage.setItem('okinawa-totalDays', totalDays);
}

function loadRouteFromStorage() {
    const saved = localStorage.getItem('okinawa-route');
    const savedDays = localStorage.getItem('okinawa-totalDays');
    if (saved) {
        try {
            routePlan = JSON.parse(saved);
        } catch (e) { /* ignore */ }
    }
    if (savedDays) {
        totalDays = parseInt(savedDays);
    }
}
