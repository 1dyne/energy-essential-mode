/**
 * 에너지 긴축모드 - 유틸리티 함수
 */

const Utils = {
    /**
     * 화면 전환
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
        }
    },

    /**
     * 아이리스 전환 효과
     */
    async irisTransition(callback) {
        const iris = document.getElementById('iris-transition');
        const duration = Constants.ANIMATION_CONFIG.IRIS_DURATION;

        // Close iris (검정 화면으로)
        iris.classList.remove('open');
        iris.classList.add('close');
        await this.delay(duration / 2);

        // 콜백 실행 (화면 전환)
        if (callback) callback();

        // Open iris (화면 표시)
        iris.classList.remove('close');
        iris.classList.add('open');
        await this.delay(duration / 2);

        // 클래스 정리
        iris.classList.remove('open', 'close');
    },

    /**
     * 팝업 표시
     */
    showPopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.classList.remove('hidden');
            // Force reflow
            popup.offsetHeight;
            popup.classList.add('show');
        }
    },

    /**
     * 팝업 숨기기
     */
    hidePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.classList.add('hidden');
            }, 300);
        }
    },

    /**
     * 요소 표시/숨기기
     */
    show(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.classList.remove('hidden');
        }
    },

    hide(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.classList.add('hidden');
        }
    },

    /**
     * 딜레이
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 타이핑 효과
     */
    async typeText(element, text, speed = Constants.ANIMATION_CONFIG.TYPING_SPEED) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        // 말풍선 위치 자동 조정 (부모가 .hana-bubble인 경우)
        const bubble = element.closest('.hana-bubble');
        if (bubble) {
            const lineBreaks = (text.match(/\n/g) || []).length;
            const isLongText = lineBreaks >= 2 || text.length >= 50;

            bubble.classList.remove('short-text', 'long-text');
            bubble.classList.add(isLongText ? 'long-text' : 'short-text');
        }

        element.textContent = '';
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await this.delay(speed);
        }
    },

    /**
     * 시간 포맷팅 (초 -> MM:SS)
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    /**
     * 분 포맷팅 (분 -> Xh Xmin 또는 Xmin)
     */
    formatMinutes(minutes) {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (mins === 0) {
                return `${hours}h`;
            }
            return `${hours}h ${mins}min`;
        }
        return `${minutes}min`;
    },

    /**
     * 오늘 날짜 문자열 (YYYY-MM-DD)
     */
    getTodayString() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    },

    /**
     * 날짜 포맷팅 (YYYY-MM-DD)
     */
    formatDate(date) {
        if (date instanceof Date) {
            return date.toISOString().split('T')[0];
        }
        if (date?.toDate) {
            return date.toDate().toISOString().split('T')[0];
        }
        return date;
    },

    /**
     * 바위 레벨 계산
     */
    calculateRockLevel(totalWorkTime) {
        const thresholds = Constants.ROCK_LEVEL_THRESHOLDS;
        if (totalWorkTime >= thresholds[4]) return 4;
        if (totalWorkTime >= thresholds[3]) return 3;
        if (totalWorkTime >= thresholds[2]) return 2;
        return 1;
    },

    /**
     * 밤 모드 체크 (18시 ~ 6시)
     */
    isNightMode() {
        const hour = new Date().getHours();
        return hour >= 18 || hour < 6;
    },

    /**
     * 랜덤 범위 숫자
     */
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * 랜덤 정수
     */
    randomInt(min, max) {
        return Math.floor(this.randomRange(min, max + 1));
    },

    /**
     * 배열에서 랜덤 선택
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * 한국어 조사 선택 (받침 유무에 따라)
     * @param {string} name - 이름
     * @param {string} type - 조사 타입 ('이/가', '은/는', '을/를', '아/야', '이랑/랑', '으로/로', '와/과')
     * @returns {string} - 이름 + 적절한 조사
     */
    getJosa(name, type) {
        if (!name || name.length === 0) return name;

        const lastChar = name.charCodeAt(name.length - 1);

        // 한글 범위 체크 (가-힣: 0xAC00 ~ 0xD7A3)
        if (lastChar < 0xAC00 || lastChar > 0xD7A3) {
            // 한글이 아닌 경우 기본값 반환
            const defaults = {
                '이/가': '이',
                '은/는': '은',
                '을/를': '을',
                '아/야': '아',
                '이랑/랑': '이랑',
                '으로/로': '으로',
                '와/과': '와'
            };
            return name + (defaults[type] || '');
        }

        // 받침 유무 확인 (28로 나눈 나머지가 0이면 받침 없음)
        const hasBatchim = (lastChar - 0xAC00) % 28 > 0;

        const josaMap = {
            '이/가': hasBatchim ? '이' : '가',
            '은/는': hasBatchim ? '은' : '는',
            '을/를': hasBatchim ? '을' : '를',
            '아/야': hasBatchim ? '아' : '야',
            '이랑/랑': hasBatchim ? '이랑' : '랑',
            '으로/로': hasBatchim ? '으로' : '로',
            '와/과': hasBatchim ? '과' : '와'
        };

        return name + (josaMap[type] || '');
    },

    /**
     * 확률 기반 선택
     */
    weightedRandom(options) {
        // options: [{ value, weight }, ...]
        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let random = Math.random() * totalWeight;

        for (const option of options) {
            random -= option.weight;
            if (random <= 0) {
                return option.value;
            }
        }
        return options[options.length - 1].value;
    },

    /**
     * 에셋 획득 확률 계산
     */
    getAssetByRockLevel(rockLevel, type) {
        const { ASSET_IDS } = Constants;

        if (type === 'sprout') {
            switch (rockLevel) {
                case 1:
                    return ASSET_IDS.ADJ_SPROUT;
                case 2:
                    return this.weightedRandom([
                        { value: ASSET_IDS.ADJ_SPROUT, weight: 0.7 },
                        { value: ASSET_IDS.ACH_SPROUT, weight: 0.3 }
                    ]);
                case 3:
                    return this.weightedRandom([
                        { value: ASSET_IDS.ADJ_SPROUT, weight: 0.5 },
                        { value: ASSET_IDS.ACH_SPROUT, weight: 0.5 }
                    ]);
                case 4:
                    return this.weightedRandom([
                        { value: ASSET_IDS.ADJ_SPROUT, weight: 0.4 },
                        { value: ASSET_IDS.ACH_SPROUT, weight: 0.6 }
                    ]);
            }
        }

        if (type === 'flower') {
            switch (rockLevel) {
                case 1:
                    return null; // Lv.1에서는 꽃 없음
                case 2:
                    return ASSET_IDS.ADJ_FLOWER;
                case 3:
                    return this.weightedRandom([
                        { value: ASSET_IDS.ADJ_FLOWER, weight: 0.6 },
                        { value: ASSET_IDS.ACH_FLOWER, weight: 0.4 }
                    ]);
                case 4:
                    return this.weightedRandom([
                        { value: ASSET_IDS.ADJ_FLOWER, weight: 0.4 },
                        { value: ASSET_IDS.ACH_FLOWER, weight: 0.6 }
                    ]);
            }
        }

        if (type === 'miniHana') {
            switch (rockLevel) {
                case 1:
                case 2:
                    return ASSET_IDS.MINI_GREEN;
                case 3:
                    return this.weightedRandom([
                        { value: ASSET_IDS.MINI_GREEN, weight: 0.8 },
                        { value: ASSET_IDS.MINI_PINK, weight: 0.2 }
                    ]);
                case 4:
                    return this.weightedRandom([
                        { value: ASSET_IDS.MINI_GREEN, weight: 0.6 },
                        { value: ASSET_IDS.MINI_PINK, weight: 0.4 }
                    ]);
            }
        }

        return null;
    },

    /**
     * 에셋 카운트 집계
     */
    countAssets(assets) {
        const counts = {};
        for (const asset of assets) {
            counts[asset] = (counts[asset] || 0) + 1;
        }
        return counts;
    },

    /**
     * 에셋 리스트 HTML 생성
     */
    generateAssetListHTML(assets) {
        const counts = this.countAssets(assets);
        let html = '';

        for (const [assetId, count] of Object.entries(counts)) {
            const emoji = Constants.ASSET_EMOJI[assetId] || '🌱';
            const name = Constants.ASSET_NAMES[assetId] || assetId;
            html += `<div class="asset-list-item">${emoji} ${name} +${count}</div>`;
        }

        return html;
    },

    /**
     * 레벨업 시 에셋 변환 (adj → ach)
     * @param {Array} assets - 현재 에셋 목록
     * @param {number} newLevel - 새로운 레벨
     * @returns {Object} { transformedAssets, transformations }
     */
    transformAssetsOnLevelUp(assets, newLevel) {
        const { ASSET_IDS } = Constants;
        const transformedAssets = [];
        const transformations = [];

        for (const asset of assets) {
            let newAsset = asset;

            // adj_sprout → ach_sprout (Lv.2+ 에서 확률적으로)
            if (asset === ASSET_IDS.ADJ_SPROUT && newLevel >= 2) {
                const shouldTransform = Math.random() < this.getTransformProbability(newLevel, 'sprout');
                if (shouldTransform) {
                    newAsset = ASSET_IDS.ACH_SPROUT;
                    transformations.push({ from: asset, to: newAsset });
                }
            }

            // adj_flower → ach_flower (Lv.3+ 에서 확률적으로)
            if (asset === ASSET_IDS.ADJ_FLOWER && newLevel >= 3) {
                const shouldTransform = Math.random() < this.getTransformProbability(newLevel, 'flower');
                if (shouldTransform) {
                    newAsset = ASSET_IDS.ACH_FLOWER;
                    transformations.push({ from: asset, to: newAsset });
                }
            }

            // mini_green → mini_pink (Lv.3+ 에서 확률적으로)
            if (asset === ASSET_IDS.MINI_GREEN && newLevel >= 3) {
                const shouldTransform = Math.random() < this.getTransformProbability(newLevel, 'miniHana');
                if (shouldTransform) {
                    newAsset = ASSET_IDS.MINI_PINK;
                    transformations.push({ from: asset, to: newAsset });
                }
            }

            transformedAssets.push(newAsset);
        }

        return { transformedAssets, transformations };
    },

    /**
     * 레벨에 따른 변환 확률 계산
     */
    getTransformProbability(level, type) {
        const probabilities = {
            sprout: { 2: 0.2, 3: 0.4, 4: 0.6 },
            flower: { 3: 0.3, 4: 0.5 },
            miniHana: { 3: 0.1, 4: 0.3 }
        };

        return probabilities[type]?.[level] || 0;
    },

    /**
     * 에셋 변환 결과 HTML 생성
     */
    generateTransformationHTML(transformations) {
        if (!transformations || transformations.length === 0) {
            return '';
        }

        let html = '<div class="transformation-list">';
        const grouped = {};

        for (const t of transformations) {
            const key = `${t.from}->${t.to}`;
            grouped[key] = (grouped[key] || 0) + 1;
        }

        for (const [key, count] of Object.entries(grouped)) {
            const [from, to] = key.split('->');
            const fromName = Constants.ASSET_NAMES[from] || from;
            const toName = Constants.ASSET_NAMES[to] || to;
            const toEmoji = Constants.ASSET_EMOJI[to] || '✨';

            html += `<div class="transformation-item">${toEmoji} ${fromName} → ${toName} x${count}</div>`;
        }

        html += '</div>';
        return html;
    },

    /**
     * 에셋 누적 병합 (Firebase 저장용)
     */
    mergeAssets(existingAssets, newAssets) {
        return [...(existingAssets || []), ...(newAssets || [])];
    },

    /**
     * 로딩 오버레이 표시
     */
    showLoading(message = '로딩 중...') {
        let overlay = document.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span>${message}</span>
            `;
            document.body.appendChild(overlay);
        } else {
            overlay.querySelector('span').textContent = message;
            overlay.style.display = 'flex';
        }
    },

    /**
     * 로딩 오버레이 숨기기
     */
    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    /**
     * 에러 메시지 표시
     */
    showError(elementId, message, duration = 3000) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.add('show');
            setTimeout(() => {
                element.classList.remove('show');
            }, duration);
        }
    },

    /**
     * LocalStorage 헬퍼
     */
    storage: {
        get(key, defaultValue = null) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch {
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('LocalStorage 저장 실패:', e);
            }
        },

        remove(key) {
            localStorage.removeItem(key);
        },

        clear() {
            localStorage.clear();
        }
    },

    /**
     * 디바운스
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 쓰로틀
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 더블클릭 감지
     */
    createDoubleClickHandler(singleClickHandler, doubleClickHandler, delay = 500) {
        let clickCount = 0;
        let singleClickTimer;

        return function (e) {
            clickCount++;

            if (clickCount === 1) {
                singleClickTimer = setTimeout(() => {
                    clickCount = 0;
                    if (singleClickHandler) singleClickHandler(e);
                }, delay);
            } else if (clickCount === 2) {
                clearTimeout(singleClickTimer);
                clickCount = 0;
                if (doubleClickHandler) doubleClickHandler(e);
            }
        };
    },

    /**
     * 더블클릭/더블탭 이벤트 등록 헬퍼
     */
    addDoubleClickListener(element, singleClickHandler, doubleClickHandler, delay = 500) {
        const handler = this.createDoubleClickHandler(singleClickHandler, doubleClickHandler, delay);

        // 클릭 이벤트 (PC)
        element.addEventListener('click', handler);
    },

    /**
     * 이미지 프리로드
     */
    async preloadImages(imageUrls) {
        const promises = imageUrls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = url;
            });
        });
        return Promise.all(promises);
    },

    /**
     * 필수 에셋 프리로드
     */
    async preloadCriticalAssets() {
        const criticalAssets = [
            'assets/energy_title.png',
            'assets/hana_look_1.png',
            'assets/hana_look_2.png',
            'assets/hana_look_3.png',
            'assets/hana_look_4.png',
            'assets/new_hana_idle.png',
            'assets/bg_lv1.png'
        ];

        try {
            await this.preloadImages(criticalAssets);
        } catch (e) {
            console.warn('일부 에셋 로드 실패:', e);
        }
    },

    /**
     * Lazy 에셋 프리로드
     */
    preloadLazyAssets() {
        const lazyAssets = [
            'assets/bg_lv2.png',
            'assets/bg_lv3.png',
            'assets/bg_lv4.png',
            'assets/bg_lv4_night.png',
            'assets/hana_jump_1.png',
            'assets/hana_jump_2.png',
            'assets/hana_jump_3.png',
            'assets/hana_jump_4.png',
            'assets/hana_jump_5.png',
            'assets/hana_spore.png',
            'assets/item_Adjustment_sprout.png',
            'assets/item_Adjustment_flower.png',
            'assets/item_Achivement_sprout_1.png',
            'assets/item_Achivement_flower.png',
            'assets/mini_hana_green.png',
            'assets/mini_hana_pink_1.png',
            'assets/mob_hez_1.png',
            'assets/mob_hez_2.png',
            'assets/mob_hez_3.png'
        ];

        // 백그라운드에서 로드
        lazyAssets.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
};

// 전역으로 export
window.Utils = Utils;
