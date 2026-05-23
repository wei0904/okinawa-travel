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

        <button class="modal-add-route" onclick="addToRoute('${item.id}'); closeModal();">加入行程 Day ${currentDay}</button>
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

function addToRoute(id) {
    const item = findItemById(id);
    if (!item) return;

    if (!routePlan[currentDay]) routePlan[currentDay] = [];

    // 檢查是否已存在
    if (routePlan[currentDay].find(i => i.id === id)) {
        showToast(`${item.name} 已在 Day ${currentDay} 行程中`);
        return;
    }

    routePlan[currentDay].push(item);
    saveRouteToStorage();
    showToast(`已將 ${item.name} 加入 Day ${currentDay}`);
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

    // 關鍵字匹配
    if (q.includes('季節') || q.includes('什麼時候') || q.includes('幾月'))
        return qaKnowledge['最佳旅遊季節'];
    if (q.includes('自駕') || q.includes('開車') || q.includes('租車') || q.includes('駕照'))
        return qaKnowledge['自駕注意事項'];
    if (q.includes('伴手禮') || q.includes('必買') || q.includes('紀念品') || q.includes('土產'))
        return qaKnowledge['必買伴手禮'];
    if (q.includes('親子') || q.includes('小孩') || q.includes('兒童') || q.includes('小朋友'))
        return qaKnowledge['親子旅遊推薦'];
    if (q.includes('美食') || q.includes('必吃') || q.includes('吃什麼') || q.includes('好吃'))
        return qaKnowledge['必吃美食'];
    if (q.includes('機場') || q.includes('交通') || q.includes('市區') || q.includes('電車') || q.includes('單軌'))
        return qaKnowledge['機場交通'];
    if (q.includes('住宿') || q.includes('飯店') || q.includes('旅館') || q.includes('住哪'))
        return qaKnowledge['住宿推薦'];
    if (q.includes('預算') || q.includes('花費') || q.includes('多少錢') || q.includes('費用'))
        return qaKnowledge['預算規劃'];

    // 搜尋餐廳
    if (q.includes('餐廳') || q.includes('推薦吃')) {
        let results = restaurants;
        if (q.includes('燒肉')) results = restaurants.filter(r => r.category === '燒肉');
        else if (q.includes('拉麵') || q.includes('沖繩麵')) results = restaurants.filter(r => r.category === '拉麵/沖繩麵');
        else if (q.includes('海鮮') || q.includes('壽司')) results = restaurants.filter(r => r.category === '壽司/海鮮');
        else if (q.includes('咖啡')) results = restaurants.filter(r => r.category === '咖啡廳');
        else if (q.includes('牛排')) results = restaurants.filter(r => r.category === '牛排');

        if (results.length > 0) {
            let answer = '推薦以下餐廳：\n\n';
            results.slice(0, 5).forEach(r => {
                answer += `【${r.name}】\n${r.desc}\n區域：${r.area} | 價格：${r.price}\n\n`;
            });
            return answer;
        }
    }

    // 搜尋景點
    if (q.includes('景點') || q.includes('去哪') || q.includes('玩什麼')) {
        let results = attractions;
        if (q.includes('海灘') || q.includes('海邊')) results = attractions.filter(a => a.category === '海灘');
        else if (q.includes('歷史') || q.includes('文化')) results = attractions.filter(a => a.category === '歷史文化');

        let answer = '推薦以下景點：\n\n';
        results.slice(0, 5).forEach(a => {
            answer += `【${a.name}】\n${a.desc}\n區域：${a.area} | 費用：${a.price}\n\n`;
        });
        return answer;
    }

    // 特定區域查詢
    const areas = ['那霸', '北谷', '恩納', '名護', '本部', '讀谷', '南城', '糸滿', '今歸仁'];
    for (const area of areas) {
        if (q.includes(area)) {
            const allItems = [...restaurants, ...attractions, ...shopping].filter(i => i.area === area);
            if (allItems.length > 0) {
                let answer = `${area}地區推薦：\n\n`;
                allItems.slice(0, 8).forEach(item => {
                    answer += `【${item.name}】${item.category}\n${item.desc}\n\n`;
                });
                return answer;
            }
        }
    }

    // 預設回答
    return `關於「${question}」的問題，以下是一些建議：\n\n沖繩是個非常適合自由行的地方，建議：\n1. 自駕是最方便的交通方式\n2. 行程安排由南到北或由北到南較順\n3. 每天安排2-3個景點不會太趕\n4. 記得防曬和多喝水\n\n你可以試著問我更具體的問題，例如：\n- 沖繩有哪些必吃美食？\n- 推薦燒肉餐廳\n- 北谷有什麼好玩的？\n- 親子旅遊推薦行程`;
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
