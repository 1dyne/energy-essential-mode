/**
 * 에너지 긴축모드 - 애니메이션 컨트롤러
 */

const Animations = {
    // 하나씨 상태
    hanaState: {
        isAnimating: false,
        currentAnimation: null,
        jumpCount: 0,
        rollDistance: 0,
        lookFrame: 1,
        eyesOpen: true,  // 눈 깜빡임 상태
        idleLoopPhase: 0 // Idle Loop 단계
    },

    // 타이머
    timers: {
        lookAnimation: null,
        idleAnimation: null,
        jumpInterval: null,
        rollInterval: null,
        blinkInterval: null,   // 눈 깜빡임 타이머
        idleLoopTimer: null    // Idle Loop 타이머
    },

    /**
     * 하나씨 두리번 애니메이션 (로그인 화면)
     * 순서: 1 → 2 → 3 → 4 → 3 → 2 → 1 → 2 → ... (핑퐁 반복)
     */
    startLookAnimation(hanaElement) {
        if (!hanaElement) return;

        let frameIndex = 0;
        const frames = [1, 2, 3, 4, 3, 2];  // 핑퐁 패턴

        this.stopLookAnimation();

        // 초기 프레임 설정
        hanaElement.src = `assets/hana_look_${frames[frameIndex]}.png`;

        this.timers.lookAnimation = setInterval(() => {
            frameIndex = (frameIndex + 1) % frames.length;
            hanaElement.src = `assets/hana_look_${frames[frameIndex]}.png`;
        }, 500);
    },

    stopLookAnimation() {
        if (this.timers.lookAnimation) {
            clearInterval(this.timers.lookAnimation);
            this.timers.lookAnimation = null;
        }
    },

    /**
     * 하나씨 정면 보기 (터치 반응)
     */
    async hanaLookForward(hanaElement) {
        if (!hanaElement) return;

        this.stopLookAnimation();
        hanaElement.src = 'assets/hana_look_1.png';

        // 느낌표 표시
        this.showExclamation(hanaElement);

        await Utils.delay(500);
    },

    /**
     * 느낌표 아이콘 표시
     */
    showExclamation(targetElement) {
        const exclamation = document.createElement('img');
        exclamation.className = 'exclamation';
        exclamation.src = 'assets/exclamation_mark.png';
        exclamation.alt = '!';

        const rect = targetElement.getBoundingClientRect();
        exclamation.style.position = 'absolute';
        exclamation.style.left = `${rect.left + rect.width / 2}px`;
        exclamation.style.top = `${rect.top - 50}px`;

        document.body.appendChild(exclamation);

        setTimeout(() => {
            exclamation.remove();
        }, 500);
    },

    /**
     * 하나씨 대기 애니메이션 시작 (Idle Loop 포함)
     */
    startIdleAnimation(hanaElement) {
        if (!hanaElement) return;

        hanaElement.src = 'assets/new_hana_idle.png';
        hanaElement.classList.add('idle');

        // 눈 깜빡임 시작
        this.startBlinkAnimation(hanaElement);

        // 랜덤 액션 시작
        this.startRandomActions(hanaElement);
    },

    stopIdleAnimation(hanaElement) {
        if (hanaElement) {
            hanaElement.classList.remove('idle', 'jumping', 'rolling', 'squish');
        }
        this.stopRandomActions();
        this.stopBlinkAnimation();
    },

    /**
     * 눈 깜빡임 애니메이션 (Idle Loop)
     * idle → close_eyes (0.1초) → idle 반복
     */
    startBlinkAnimation(hanaElement) {
        if (!hanaElement) return;

        this.stopBlinkAnimation();
        this.hanaState.eyesOpen = true;

        const blink = async () => {
            if (this.hanaState.isAnimating) return; // 다른 애니메이션 중이면 스킵

            // 눈 감기
            hanaElement.src = 'assets/new_hana_close_eyes.png';
            this.hanaState.eyesOpen = false;

            await Utils.delay(100);

            // 눈 뜨기
            if (!this.hanaState.isAnimating) {
                hanaElement.src = 'assets/new_hana_idle.png';
                this.hanaState.eyesOpen = true;
            }
        };

        // 3~5초 간격으로 깜빡임
        const scheduleNextBlink = () => {
            const interval = Utils.randomRange(3000, 5000);
            this.timers.blinkInterval = setTimeout(() => {
                blink();
                scheduleNextBlink();
            }, interval);
        };

        scheduleNextBlink();
    },

    stopBlinkAnimation() {
        if (this.timers.blinkInterval) {
            clearTimeout(this.timers.blinkInterval);
            this.timers.blinkInterval = null;
        }
    },

    /**
     * 랜덤 액션 (점프, 굴러다니기, 납작)
     */
    startRandomActions(hanaElement) {
        this.stopRandomActions();

        // 점프 간격
        this.timers.jumpInterval = setInterval(() => {
            if (!this.hanaState.isAnimating) {
                this.hanaJump(hanaElement);
            }
        }, Constants.ANIMATION_CONFIG.JUMP_INTERVAL);

        // 굴러다니기 간격
        this.timers.rollInterval = setInterval(() => {
            if (!this.hanaState.isAnimating) {
                this.hanaRoll(hanaElement);
            }
        }, Constants.ANIMATION_CONFIG.ROLL_INTERVAL);
    },

    stopRandomActions() {
        if (this.timers.jumpInterval) {
            clearInterval(this.timers.jumpInterval);
            this.timers.jumpInterval = null;
        }
        if (this.timers.rollInterval) {
            clearInterval(this.timers.rollInterval);
            this.timers.rollInterval = null;
        }
    },

    /**
     * 하나씨 점프 애니메이션
     */
    async hanaJump(hanaElement, callback) {
        if (!hanaElement || this.hanaState.isAnimating) return;

        this.hanaState.isAnimating = true;
        this.hanaState.currentAnimation = 'jump';
        this.hanaState.jumpCount++;

        // 점프 프레임 애니메이션
        const frames = [1, 2, 3, 4, 5, 4, 3, 2, 1];
        for (const frame of frames) {
            hanaElement.src = `assets/hana_jump_${frame}.png`;
            await Utils.delay(60);
        }

        // idle로 복귀
        hanaElement.src = 'assets/new_hana_idle.png';

        this.hanaState.isAnimating = false;
        this.hanaState.currentAnimation = null;

        if (callback) callback(this.hanaState.jumpCount);
    },

    /**
     * 하나씨 굴러다니기 애니메이션 (미니 하나씨 트레일 포함)
     */
    async hanaRoll(hanaElement, rockLevel = 1) {
        if (!hanaElement || this.hanaState.isAnimating) return;

        this.hanaState.isAnimating = true;
        this.hanaState.currentAnimation = 'roll';

        const config = Constants.ROLL_CONFIG || { DURATION: 4000, MINI_HANA_COUNT: 6, POSITIONS: [15, 25, 35, 45, 55, 65] };

        hanaElement.classList.add('rolling');

        // 미니 하나씨 트레일 생성
        const miniHanas = [];
        const container = hanaElement.parentElement;

        for (let i = 0; i < config.MINI_HANA_COUNT; i++) {
            await Utils.delay(config.DURATION / config.MINI_HANA_COUNT / 2);

            const miniHana = document.createElement('img');
            const miniType = Utils.getAssetByRockLevel(rockLevel, 'miniHana');
            miniHana.src = `assets/${Constants.ASSET_IMAGES[miniType] || 'mini_hana_green.png'}`;
            miniHana.className = 'mini-hana-trail';
            miniHana.style.left = `${config.POSITIONS[i]}%`;
            miniHana.style.bottom = '85%';
            container.appendChild(miniHana);
            miniHanas.push(miniHana);

            // 등장 애니메이션
            miniHana.classList.add('mini-hana-spawn');
        }

        await Utils.delay(config.DURATION / 2);

        hanaElement.classList.remove('rolling');
        this.hanaState.rollDistance += 100;

        // 미니 하나씨 페이드 아웃
        await Utils.delay(500);
        miniHanas.forEach(mini => {
            mini.classList.add('mini-hana-fadeout');
            setTimeout(() => mini.remove(), 500);
        });

        this.hanaState.isAnimating = false;
        this.hanaState.currentAnimation = null;
    },

    /**
     * 하나씨 납작 애니메이션 (프레임 시퀀스)
     * 1 → 2 → 4 순서로 프레임 전환
     */
    async hanaSquish(hanaElement) {
        if (!hanaElement || this.hanaState.isAnimating) return;

        this.hanaState.isAnimating = true;
        this.hanaState.currentAnimation = 'squish';

        const config = Constants.SQUISH_CONFIG || {
            DURATION: 1500,
            FRAMES: [
                { img: 1, duration: 500 },
                { img: 2, duration: 500 },
                { img: 4, duration: 500 }
            ]
        };

        hanaElement.classList.add('squish');

        // 프레임 시퀀스 재생
        for (const frame of config.FRAMES) {
            hanaElement.src = `assets/hana_jump_${frame.img}.png`;
            await Utils.delay(frame.duration);
        }

        // idle로 복귀
        hanaElement.src = 'assets/new_hana_idle.png';
        hanaElement.classList.remove('squish');

        this.hanaState.isAnimating = false;
        this.hanaState.currentAnimation = null;
    },

    /**
     * 하나씨 포자 애니메이션 (개선된 버전)
     * 1. 땀방울 + 떨림
     * 2. 포자 이미지로 전환 + 팽창
     * 3. 포자 파티클 폭발 + 화면 흔들림
     * 4. 복귀
     */
    async hanaSpore(hanaElement, onComplete) {
        if (!hanaElement) return;

        this.hanaState.isAnimating = true;
        this.hanaState.currentAnimation = 'spore';

        // 1단계: 땀방울 + 떨림 (긴장 고조)
        hanaElement.classList.add('spore-shake');
        for (let i = 0; i < 5; i++) {
            this.createSweatDrop(hanaElement);
            await Utils.delay(300);
        }
        hanaElement.classList.remove('spore-shake');

        // 2단계: 포자 이미지로 변경 + 팽창
        hanaElement.src = 'assets/hana_spore.png';
        hanaElement.classList.add('spore', 'spore-expand');
        await Utils.delay(800);

        // 3단계: 화면 흔들림 + 포자 폭발
        this.shakeScreen();
        this.createSporeParticles(hanaElement, 30); // 더 많은 파티클
        this.createSporeRing(hanaElement); // 원형 링 이펙트

        await Utils.delay(500);
        hanaElement.classList.remove('spore-expand');

        // 4단계: 포자 상태 유지 (숨쉬기 효과)
        for (let i = 0; i < 3; i++) {
            hanaElement.classList.add('spore-breathe');
            await Utils.delay(1000);
            hanaElement.classList.remove('spore-breathe');
            await Utils.delay(500);
        }

        // 5단계: 복귀
        hanaElement.classList.remove('spore');
        hanaElement.src = 'assets/new_hana_idle.png';

        this.hanaState.isAnimating = false;
        this.hanaState.currentAnimation = null;

        if (onComplete) onComplete();
    },

    /**
     * 화면 흔들림 효과
     */
    shakeScreen() {
        const container = document.querySelector('.timer-container') || document.body;
        container.classList.add('screen-shake');
        setTimeout(() => {
            container.classList.remove('screen-shake');
        }, 500);
    },

    /**
     * 포자 원형 링 이펙트
     */
    createSporeRing(targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const ring = document.createElement('div');
        ring.className = 'spore-ring';
        ring.style.left = `${centerX}px`;
        ring.style.top = `${centerY}px`;

        document.body.appendChild(ring);

        setTimeout(() => {
            ring.remove();
        }, 1000);
    },

    /**
     * 땀방울 생성
     */
    createSweatDrop(targetElement) {
        const drop = document.createElement('div');
        drop.className = 'sweat-drop';

        const rect = targetElement.getBoundingClientRect();
        drop.style.left = `${rect.left + rect.width / 2 + Utils.randomRange(-20, 20)}px`;
        drop.style.top = `${rect.top}px`;

        document.body.appendChild(drop);

        setTimeout(() => {
            drop.remove();
        }, 1000);
    },

    /**
     * 포자 파티클 생성
     */
    createSporeParticles(targetElement, count = 20) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'spore-particle';

            const angle = (Math.PI * 2 * i) / count;
            const distance = Utils.randomRange(80, 180);
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            // 랜덤 크기
            const size = Utils.randomRange(4, 10);

            particle.style.cssText = `
                left: ${centerX}px;
                top: ${centerY}px;
                width: ${size}px;
                height: ${size}px;
                --tx: ${tx}px;
                --ty: ${ty}px;
            `;

            document.body.appendChild(particle);

            // 랜덤 딜레이로 애니메이션 시작
            setTimeout(() => {
                particle.classList.add('animate');
            }, Utils.randomRange(0, 100));

            // 제거
            setTimeout(() => {
                particle.remove();
            }, 1500);
        }
    },

    /**
     * 에셋 생성 애니메이션
     */
    createAsset(container, assetId, startX, startY, endX, endY) {
        const asset = document.createElement('img');
        asset.className = 'asset-item';
        asset.src = `assets/${Constants.ASSET_IMAGES[assetId]}`;
        asset.dataset.assetId = assetId;

        // 시작 위치
        asset.style.left = `${startX}px`;
        asset.style.top = `${startY}px`;

        // 랜덤 크기와 회전
        const scale = Utils.randomRange(0.6, 0.8);
        const rotation = Utils.randomRange(-15, 15);
        asset.style.transform = `scale(${scale}) rotate(${rotation}deg)`;

        container.appendChild(asset);

        // 스폰 애니메이션
        asset.classList.add('asset-spawning');

        // 이동 애니메이션
        setTimeout(() => {
            asset.style.transition = 'left 0.5s ease-out, top 0.5s ease-out';
            asset.style.left = `${endX}px`;
            asset.style.top = `${endY}px`;
        }, 300);

        // 바운스 효과
        setTimeout(() => {
            asset.classList.remove('asset-spawning');
            asset.classList.add('asset-bounce');
            setTimeout(() => {
                asset.classList.remove('asset-bounce');
            }, 200);
        }, 800);

        return asset;
    },

    /**
     * 레벨업 애니메이션
     */
    async playLevelUpAnimation(rockElement, oldLevel, newLevel) {
        // 1. 글로우 효과
        rockElement.classList.add('level-up-glow');

        // 2. 파티클
        await Utils.delay(500);
        this.createLevelUpParticles(rockElement);

        // 3. 화이트 플래시
        await Utils.delay(500);
        const flash = document.createElement('div');
        flash.className = 'white-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);

        // 4. 바위 이미지 교체
        await Utils.delay(300);
        rockElement.classList.add('rock-fade-out');
        await Utils.delay(500);
        rockElement.src = `assets/bg_lv${newLevel}.png`;
        rockElement.classList.remove('rock-fade-out', 'level-up-glow');
        rockElement.classList.add('rock-fade-in');
        await Utils.delay(500);
        rockElement.classList.remove('rock-fade-in');
    },

    /**
     * 레벨업 파티클 생성
     */
    createLevelUpParticles(targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const angle = (Math.PI * 2 * i) / 30;
            const distance = Utils.randomRange(100, 200);
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            particle.style.cssText = `
                left: ${centerX}px;
                top: ${centerY}px;
                --tx: ${tx}px;
                --ty: ${ty}px;
            `;

            document.body.appendChild(particle);

            setTimeout(() => {
                particle.classList.add('animate');
            }, i * 30);

            setTimeout(() => {
                particle.remove();
            }, 1000 + i * 30);
        }
    },

    /**
     * Hez 티저 애니메이션 (30분)
     */
    async playHezPeek(hezContainer, hezImg) {
        hezContainer.classList.remove('hidden');
        hezImg.src = 'assets/mob_hez_1.png';
        hezImg.classList.add('hez-peek');

        await Utils.delay(3000);

        hezImg.classList.remove('hez-peek');
        hezContainer.classList.add('hidden');
    },

    /**
     * Hez 티저 애니메이션 (60분)
     */
    async playHezPartial(hezContainer, hezImg) {
        hezContainer.classList.remove('hidden');
        hezImg.classList.add('hez-animated', 'hez-partial');

        await Utils.delay(4000);

        hezImg.classList.remove('hez-animated', 'hez-partial');
        hezContainer.classList.add('hidden');
    },

    /**
     * Hez 소환 애니메이션 (365분)
     */
    async playHezSummon(hezContainer, hezImg, mainScreen) {
        // 배경 라벤더로 전환
        mainScreen.classList.add('bg-to-night');

        await Utils.delay(2000);

        // Hez 등장
        hezContainer.classList.remove('hidden');
        hezImg.classList.add('hez-animated', 'hez-summon');

        await Utils.delay(6000);

        hezImg.classList.remove('hez-animated', 'hez-summon');
        hezContainer.classList.add('hidden');

        // 배경 복원 (밤 모드가 아닌 경우)
        if (!Utils.isNightMode()) {
            mainScreen.classList.remove('bg-to-night');
            mainScreen.classList.add('bg-to-day');
            await Utils.delay(2000);
            mainScreen.classList.remove('bg-to-day');
        }
    },

    /**
     * 터치 피드백
     */
    hanaTap(hanaElement) {
        if (!hanaElement) return;
        hanaElement.classList.add('tap');
        setTimeout(() => {
            hanaElement.classList.remove('tap');
        }, 200);
    },

    /**
     * 버튼 누르기 효과
     */
    buttonPress(button) {
        if (!button) return;
        button.classList.add('btn-press');
        setTimeout(() => {
            button.classList.remove('btn-press');
        }, 200);
    },

    /**
     * 타이머용 애니메이션 컨트롤러
     */
    timerAnimationController: {
        isRunning: false,
        jumpCount: 0,
        assets: [],

        start(hanaElement, rockElement, assetsContainer, rockLevel, onAssetGenerated) {
            this.isRunning = true;
            this.jumpCount = 0;
            this.assets = [];

            const jumpLoop = async () => {
                if (!this.isRunning) return;

                // 랜덤 간격 (15-25초)
                const interval = Utils.randomRange(15000, 25000);

                await Utils.delay(interval);

                if (!this.isRunning) return;

                // 점프 애니메이션
                await Animations.hanaJump(hanaElement, (count) => {
                    this.jumpCount = count;

                    // 에셋 생성 체크
                    if (count % Constants.ANIMATION_CONFIG.ASSET_SPAWN_INTERVAL === 0) {
                        const assetId = Utils.getAssetByRockLevel(rockLevel, 'sprout');
                        if (assetId) {
                            this.generateAsset(assetsContainer, hanaElement, assetId, onAssetGenerated);
                        }
                    }

                    // 꽃 생성 체크 (Lv.2 이상)
                    if (rockLevel >= 2 && count % Constants.ANIMATION_CONFIG.FLOWER_SPAWN_INTERVAL === 0) {
                        const assetId = Utils.getAssetByRockLevel(rockLevel, 'flower');
                        if (assetId) {
                            this.generateAsset(assetsContainer, hanaElement, assetId, onAssetGenerated);
                        }
                    }
                });

                jumpLoop();
            };

            jumpLoop();
        },

        generateAsset(container, hanaElement, assetId, callback) {
            const containerRect = container.getBoundingClientRect();
            const zones = Constants.ROCK_ZONES || {};

            // 하나씨 위치에서 시작 (JUMP_ZONE 기준)
            const jumpZone = zones.JUMP_ZONE || { left: '15%', right: '70%', bottom: '85%' };
            const startX = containerRect.width * 0.5; // 중앙
            const startY = containerRect.height * (1 - parseFloat(jumpZone.bottom) / 100);

            // ASSET_ZONE 내 랜덤 목적지
            const assetZone = zones.ASSET_ZONE || { left: '20%', right: '65%', top: '75%', bottom: '88%' };
            const zoneLeft = containerRect.width * parseFloat(assetZone.left) / 100;
            const zoneRight = containerRect.width * parseFloat(assetZone.right) / 100;
            const zoneTop = containerRect.height * parseFloat(assetZone.top) / 100;
            const zoneBottom = containerRect.height * parseFloat(assetZone.bottom) / 100;

            const endX = Utils.randomRange(zoneLeft, zoneRight);
            const endY = Utils.randomRange(zoneTop, zoneBottom);

            const asset = Animations.createAsset(container, assetId, startX, startY, endX, endY);
            this.assets.push(assetId);

            if (callback) callback(assetId);

            // 최대 개수 제한
            const assetElements = container.querySelectorAll('.asset-item');
            if (assetElements.length > Constants.ANIMATION_CONFIG.MAX_VISIBLE_ASSETS) {
                assetElements[0].remove();
            }
        },

        stop() {
            this.isRunning = false;
        },

        getAssets() {
            return [...this.assets];
        },

        reset() {
            this.isRunning = false;
            this.jumpCount = 0;
            this.assets = [];
        }
    }
};

// 전역으로 export
window.Animations = Animations;
