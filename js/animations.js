/**
 * 에너지 긴축모드 - 애니메이션 컨트롤러 (GSAP)
 */

const Animations = {
    // ===================================
    // 위치 상수
    // ===================================
    POSITIONS: {
        // 기본 위치 (바위 꼭대기) - CSS 기준
        TOP: { y: 0, x: 0 },
        // 바닥 위치 (빨간 영역)
        BOTTOM: { y: 120, x: 0 },
        // 바닥 좌우 범위
        BOTTOM_LEFT: -80,
        BOTTOM_RIGHT: 80
    },

    // ===================================
    // 하나씨 상태
    // ===================================
    hanaState: {
        isAnimating: false,
        currentAnimation: null,
        position: 'top',        // 'top' = 기본위치, 'bottom' = 바닥
        currentX: 0,            // 현재 X 위치
        jumpCount: 0,
        cyclePhase: 0,          // 대기 사이클 단계 (0: 위, 1: 내려가기, 2: 구르기, 3: 올라가기)
        eyesOpen: true,
        timerDirection: 1       // 타이머 점프 방향 (1: 오른쪽, -1: 왼쪽)
    },

    // ===================================
    // 타이머
    // ===================================
    timers: {
        lookAnimation: null,
        blinkInterval: null,
        idleCycleTimer: null,
        timerJumpInterval: null
    },

    // ===================================
    // 로그인 화면 - 두리번 애니메이션
    // ===================================
    startLookAnimation(hanaElement) {
        if (!hanaElement) return;

        let frameIndex = 0;
        const frames = [1, 2, 3, 4, 3, 2];

        this.stopLookAnimation();
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

    // ===================================
    // 느낌표 표시 (터치 반응)
    // ===================================
    async hanaLookForward(hanaElement) {
        if (!hanaElement) return;
        this.stopLookAnimation();
        hanaElement.src = 'assets/hana_look_1.png';
        this.showExclamation(hanaElement);
        await Utils.delay(500);
    },

    showExclamation(targetElement) {
        const exclamation = document.createElement('img');
        exclamation.className = 'exclamation';
        exclamation.src = 'assets/exclamation_mark.png';
        exclamation.alt = '!';

        const rect = targetElement.getBoundingClientRect();
        exclamation.style.position = 'absolute';
        exclamation.style.left = `${rect.left + rect.width / 2}px`;
        exclamation.style.top = `${rect.top - 50}px`;
        exclamation.style.zIndex = '9999';

        document.body.appendChild(exclamation);
        setTimeout(() => exclamation.remove(), 500);
    },

    // ===================================
    // 눈 깜빡임 (기본위치에서만)
    // ===================================
    startBlinkAnimation(hanaElement) {
        if (!hanaElement) return;
        this.stopBlinkAnimation();
        this.hanaState.eyesOpen = true;

        const blink = async () => {
            // 기본위치가 아니거나 애니메이션 중이면 스킵
            if (this.hanaState.position !== 'top' || this.hanaState.isAnimating) return;

            hanaElement.src = 'assets/new_hana_close_eyes.png';
            this.hanaState.eyesOpen = false;

            await Utils.delay(100);

            if (this.hanaState.position === 'top' && !this.hanaState.isAnimating) {
                hanaElement.src = 'assets/new_hana_idle.png';
                this.hanaState.eyesOpen = true;
            }
        };

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

    // ===================================
    // 대기 애니메이션 시작 (메인화면)
    // ===================================
    startIdleAnimation(hanaElement) {
        if (!hanaElement) return;

        // 위치 초기화
        gsap.set(hanaElement, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
        hanaElement.src = 'assets/new_hana_idle.png';
        this.hanaState.position = 'top';
        this.hanaState.currentX = 0;
        this.hanaState.isAnimating = false;

        // 눈 깜빡임 시작
        this.startBlinkAnimation(hanaElement);

        // 대기 사이클 시작 (랜덤 phase)
        this.startIdleCycle(hanaElement);
    },

    stopIdleAnimation(hanaElement) {
        this.stopBlinkAnimation();
        this.stopIdleCycle();

        if (hanaElement) {
            gsap.killTweensOf(hanaElement);
        }
    },

    // ===================================
    // 대기 사이클 (내려가기 → 구르기 → 올라가기)
    // ===================================
    startIdleCycle(hanaElement) {
        this.stopIdleCycle();

        // 랜덤 시작 phase (0~2)
        const startPhase = Utils.randomRange(0, 2);
        this.hanaState.cyclePhase = startPhase;

        console.log(`[Idle Cycle] 시작 phase: ${startPhase}`);

        // 첫 사이클까지 대기 시간 (랜덤)
        const initialDelay = Utils.randomRange(3000, 6000);

        this.timers.idleCycleTimer = setTimeout(() => {
            this.runIdleCycle(hanaElement);
        }, initialDelay);
    },

    stopIdleCycle() {
        if (this.timers.idleCycleTimer) {
            clearTimeout(this.timers.idleCycleTimer);
            this.timers.idleCycleTimer = null;
        }
    },

    async runIdleCycle(hanaElement) {
        if (!hanaElement) return;

        const phase = this.hanaState.cyclePhase;

        // phase에 따라 동작 실행
        if (phase === 0 && this.hanaState.position === 'top') {
            // 내려가기
            await this.hanaJumpDown(hanaElement);
            this.hanaState.cyclePhase = 1;
        } else if (phase === 1 && this.hanaState.position === 'bottom') {
            // 구르기
            await this.hanaRoll(hanaElement);
            this.hanaState.cyclePhase = 2;
        } else if (phase === 2 && this.hanaState.position === 'bottom') {
            // 올라가기
            await this.hanaJumpUp(hanaElement);
            this.hanaState.cyclePhase = 0;
        } else {
            // phase와 position이 맞지 않으면 조정
            if (this.hanaState.position === 'top') {
                this.hanaState.cyclePhase = 0;
            } else {
                this.hanaState.cyclePhase = 1;
            }
        }

        // 다음 사이클 예약
        const nextDelay = Utils.randomRange(4000, 8000);
        this.timers.idleCycleTimer = setTimeout(() => {
            this.runIdleCycle(hanaElement);
        }, nextDelay);
    },

    // ===================================
    // (1-1) 점프해서 내려가기: 기본위치 → 바닥
    // 이미지: new_hana_idle → hana_jump_4
    // ===================================
    hanaJumpDown(hanaElement) {
        return new Promise((resolve) => {
            if (!hanaElement || this.hanaState.isAnimating) {
                resolve();
                return;
            }

            this.hanaState.isAnimating = true;
            this.hanaState.currentAnimation = 'jumpDown';
            this.stopBlinkAnimation();

            const targetX = Utils.randomRange(this.POSITIONS.BOTTOM_LEFT, this.POSITIONS.BOTTOM_RIGHT);
            const targetY = this.POSITIONS.BOTTOM.y;

            console.log(`[JumpDown] 내려가기: (0,0) → (${targetX}, ${targetY})`);

            const tl = gsap.timeline({
                onComplete: () => {
                    this.hanaState.isAnimating = false;
                    this.hanaState.currentAnimation = null;
                    this.hanaState.position = 'bottom';
                    this.hanaState.currentX = targetX;
                    resolve();
                }
            });

            // 1. 준비 (살짝 위로)
            tl.to(hanaElement, {
                y: -20,
                scaleY: 1.1,
                scaleX: 0.95,
                duration: 0.15,
                ease: "power2.out"
            })
            // 2. 점프 시작 (이미지 변경)
            .call(() => {
                hanaElement.src = 'assets/hana_jump_4.png';
            })
            // 3. 낙하 (포물선)
            .to(hanaElement, {
                x: targetX,
                y: targetY,
                scaleY: 0.9,
                scaleX: 1.05,
                duration: 0.4,
                ease: "power2.in"
            })
            // 4. 착지 충격
            .to(hanaElement, {
                scaleY: 0.75,
                scaleX: 1.25,
                duration: 0.08,
                ease: "power2.out"
            })
            // 5. 복귀
            .to(hanaElement, {
                scaleY: 1,
                scaleX: 1,
                duration: 0.2,
                ease: "elastic.out(1, 0.6)"
            });
        });
    },

    // ===================================
    // (1-2) 점프해서 올라가기: 바닥 → 기본위치
    // 이미지: hana_jump_1 → hana_jump_2 → hana_jump_3 → new_hana_idle
    // ===================================
    hanaJumpUp(hanaElement) {
        return new Promise((resolve) => {
            if (!hanaElement || this.hanaState.isAnimating) {
                resolve();
                return;
            }

            this.hanaState.isAnimating = true;
            this.hanaState.currentAnimation = 'jumpUp';

            const startX = this.hanaState.currentX;
            const startY = this.POSITIONS.BOTTOM.y;

            console.log(`[JumpUp] 올라가기: (${startX}, ${startY}) → (0, 0)`);

            const tl = gsap.timeline({
                onComplete: () => {
                    hanaElement.src = 'assets/new_hana_idle.png';
                    this.hanaState.isAnimating = false;
                    this.hanaState.currentAnimation = null;
                    this.hanaState.position = 'top';
                    this.hanaState.currentX = 0;
                    this.startBlinkAnimation(hanaElement);
                    resolve();
                }
            });

            // 1. 준비 (웅크림)
            tl.to(hanaElement, {
                scaleY: 0.8,
                scaleX: 1.15,
                duration: 0.12,
                ease: "power2.in",
                onStart: () => {
                    hanaElement.src = 'assets/hana_jump_1.png';
                }
            })
            // 2. 점프 시작
            .to(hanaElement, {
                y: startY - 40,
                scaleY: 1.15,
                scaleX: 0.9,
                duration: 0.15,
                ease: "power2.out",
                onStart: () => {
                    hanaElement.src = 'assets/hana_jump_2.png';
                }
            })
            // 3. 상승
            .to(hanaElement, {
                x: 0,
                y: -30,
                duration: 0.25,
                ease: "power2.out",
                onStart: () => {
                    hanaElement.src = 'assets/hana_jump_3.png';
                }
            })
            // 4. 최고점 → 착지
            .to(hanaElement, {
                y: 0,
                scaleY: 0.85,
                scaleX: 1.1,
                duration: 0.15,
                ease: "power2.in"
            })
            // 5. 착지 복귀
            .to(hanaElement, {
                scaleY: 1,
                scaleX: 1,
                duration: 0.18,
                ease: "elastic.out(1, 0.5)"
            });
        });
    },

    // ===================================
    // 구르기: 바닥에서 좌우 이동
    // ===================================
    hanaRoll(hanaElement) {
        return new Promise((resolve) => {
            if (!hanaElement || this.hanaState.isAnimating) {
                resolve();
                return;
            }

            this.hanaState.isAnimating = true;
            this.hanaState.currentAnimation = 'roll';

            const currentX = this.hanaState.currentX;
            // 현재 위치에서 반대 방향으로 이동
            const direction = currentX > 0 ? -1 : 1;
            const moveDistance = Utils.randomRange(40, 80);
            let targetX = currentX + (direction * moveDistance);

            // 범위 제한
            targetX = Math.max(this.POSITIONS.BOTTOM_LEFT, Math.min(this.POSITIONS.BOTTOM_RIGHT, targetX));

            console.log(`[Roll] 구르기: ${currentX} → ${targetX}`);

            const tl = gsap.timeline({
                onComplete: () => {
                    hanaElement.src = 'assets/hana_jump_4.png';
                    this.hanaState.isAnimating = false;
                    this.hanaState.currentAnimation = null;
                    this.hanaState.currentX = targetX;
                    resolve();
                }
            });

            // 구르면서 이동
            tl.to(hanaElement, {
                x: targetX,
                rotation: direction * 360,
                duration: 0.8,
                ease: "power1.inOut"
            })
            // 회전 복귀
            .to(hanaElement, {
                rotation: 0,
                duration: 0.2,
                ease: "power2.out"
            });
        });
    },

    // ===================================
    // (2) 타이머 점프: 바닥에서 좌우 왕복
    // 이미지: hana_jump_1 ↔ hana_jump_4
    // ===================================
    hanaTimerJump(hanaElement, callback) {
        return new Promise((resolve) => {
            if (!hanaElement || this.hanaState.isAnimating) {
                resolve();
                return;
            }

            this.hanaState.isAnimating = true;
            this.hanaState.currentAnimation = 'timerJump';
            this.hanaState.jumpCount++;

            const currentX = this.hanaState.currentX;
            const direction = this.hanaState.timerDirection;

            // 이동 거리 (랜덤)
            const moveDistance = Utils.randomRange(25, 45);
            let targetX = currentX + (direction * moveDistance);

            // 범위 체크 및 방향 전환
            if (targetX >= this.POSITIONS.BOTTOM_RIGHT) {
                targetX = this.POSITIONS.BOTTOM_RIGHT;
                this.hanaState.timerDirection = -1;
            } else if (targetX <= this.POSITIONS.BOTTOM_LEFT) {
                targetX = this.POSITIONS.BOTTOM_LEFT;
                this.hanaState.timerDirection = 1;
            }

            // 점프 높이 (랜덤 - 쫀득한 느낌)
            const jumpHeight = Utils.randomRange(20, 50);
            const currentY = this.POSITIONS.BOTTOM.y;

            console.log(`[TimerJump] ${currentX} → ${targetX}, 높이: ${jumpHeight}`);

            const tl = gsap.timeline({
                onComplete: () => {
                    this.hanaState.isAnimating = false;
                    this.hanaState.currentAnimation = null;
                    this.hanaState.currentX = targetX;
                    if (callback) callback(this.hanaState.jumpCount);
                    resolve();
                }
            });

            // 1. 웅크림
            tl.to(hanaElement, {
                scaleY: 0.8,
                scaleX: 1.15,
                duration: 0.08,
                ease: "power2.in",
                onStart: () => {
                    hanaElement.src = 'assets/hana_jump_1.png';
                }
            })
            // 2. 점프 (위로 + 옆으로)
            .to(hanaElement, {
                y: currentY - jumpHeight,
                x: (currentX + targetX) / 2, // 중간 지점
                scaleY: 1.1,
                scaleX: 0.92,
                duration: 0.18,
                ease: "power2.out",
                onStart: () => {
                    hanaElement.src = 'assets/hana_jump_4.png';
                }
            })
            // 3. 낙하
            .to(hanaElement, {
                y: currentY,
                x: targetX,
                scaleY: 0.85,
                scaleX: 1.1,
                duration: 0.15,
                ease: "power2.in"
            })
            // 4. 착지
            .to(hanaElement, {
                scaleY: 0.75,
                scaleX: 1.2,
                duration: 0.06,
                ease: "power2.out",
                onStart: () => {
                    hanaElement.src = 'assets/hana_jump_1.png';
                }
            })
            // 5. 복귀
            .to(hanaElement, {
                scaleY: 1,
                scaleX: 1,
                duration: 0.12,
                ease: "elastic.out(1, 0.7)"
            });
        });
    },

    // ===================================
    // 타이머 애니메이션 컨트롤러
    // ===================================
    timerAnimationController: {
        isRunning: false,
        jumpCount: 0,
        assets: [],

        async start(hanaElement, rockElement, assetsContainer, rockLevel, onAssetGenerated) {
            this.isRunning = true;
            this.jumpCount = 0;
            this.assets = [];

            // 하나씨를 바닥 위치로 초기화
            Animations.hanaState.position = 'bottom';
            Animations.hanaState.currentX = 0;
            gsap.set(hanaElement, {
                x: 0,
                y: Animations.POSITIONS.BOTTOM.y,
                scaleX: 1,
                scaleY: 1
            });
            hanaElement.src = 'assets/hana_jump_1.png';

            const jumpLoop = async () => {
                if (!this.isRunning) return;

                // 랜덤 간격 (0.8~1.5초)
                const interval = Utils.randomRange(800, 1500);
                await Utils.delay(interval);

                if (!this.isRunning) return;

                // 점프
                await Animations.hanaTimerJump(hanaElement, (count) => {
                    this.jumpCount = count;

                    // 에셋 생성 (3번마다)
                    if (count % 3 === 0) {
                        const assetId = Utils.getAssetByRockLevel(rockLevel, 'sprout');
                        if (assetId && assetsContainer) {
                            this.generateAsset(assetsContainer, hanaElement, assetId, onAssetGenerated);
                        }
                    }

                    // 꽃 생성 (Lv.2 이상, 6번마다)
                    if (rockLevel >= 2 && count % 6 === 0) {
                        const assetId = Utils.getAssetByRockLevel(rockLevel, 'flower');
                        if (assetId && assetsContainer) {
                            this.generateAsset(assetsContainer, hanaElement, assetId, onAssetGenerated);
                        }
                    }
                });

                // 다음 점프
                if (this.isRunning) {
                    jumpLoop();
                }
            };

            jumpLoop();
        },

        generateAsset(container, hanaElement, assetId, callback) {
            const containerRect = container.getBoundingClientRect();
            const hanaRect = hanaElement.getBoundingClientRect();

            // 하나씨 위치에서 시작
            const startX = hanaRect.left - containerRect.left + hanaRect.width / 2;
            const startY = hanaRect.top - containerRect.top;

            // 파란 영역(에셋 영역)으로 이동
            const endX = Utils.randomRange(containerRect.width * 0.2, containerRect.width * 0.8);
            const endY = Utils.randomRange(containerRect.height * 0.3, containerRect.height * 0.6);

            const asset = Animations.createAsset(container, assetId, startX, startY, endX, endY);
            this.assets.push(assetId);

            if (callback) callback(assetId);

            // 최대 개수 제한
            const assetElements = container.querySelectorAll('.asset-item');
            if (assetElements.length > 30) {
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
    },

    // ===================================
    // 에셋 생성
    // ===================================
    createAsset(container, assetId, startX, startY, endX, endY) {
        const asset = document.createElement('img');
        asset.className = 'asset-item';
        asset.src = `assets/${Constants.ASSET_IMAGES[assetId]}`;
        asset.dataset.assetId = assetId;

        asset.style.left = `${startX}px`;
        asset.style.top = `${startY}px`;
        asset.style.opacity = '0';

        const scale = Utils.randomRange(0.6, 0.8);
        const rotation = Utils.randomRange(-15, 15);

        container.appendChild(asset);

        // GSAP으로 애니메이션
        gsap.to(asset, {
            left: endX,
            top: endY,
            opacity: 1,
            rotation: rotation,
            scale: scale,
            duration: 0.6,
            ease: "power2.out"
        });

        return asset;
    },

    // ===================================
    // 기타 애니메이션 (레벨업, Hez 등)
    // ===================================
    async playLevelUpAnimation(rockElement, oldLevel, newLevel) {
        rockElement.classList.add('level-up-glow');
        await Utils.delay(500);

        // 플래시
        const flash = document.createElement('div');
        flash.className = 'white-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);

        await Utils.delay(300);
        rockElement.src = `assets/bg_lv${newLevel}.png`;
        rockElement.classList.remove('level-up-glow');
    },

    async playHezPeek(hezContainer, hezImg) {
        hezContainer.classList.remove('hidden');
        hezImg.src = 'assets/mob_hez_1.png';

        gsap.fromTo(hezImg,
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
        );

        await Utils.delay(3000);

        gsap.to(hezImg, {
            y: 100,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                hezContainer.classList.add('hidden');
            }
        });
    },

    async playHezPartial(hezContainer, hezImg) {
        hezContainer.classList.remove('hidden');

        gsap.fromTo(hezImg,
            { y: 150, opacity: 0 },
            { y: 50, opacity: 1, duration: 0.8, ease: "power2.out" }
        );

        await Utils.delay(4000);

        gsap.to(hezImg, {
            y: 150,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                hezContainer.classList.add('hidden');
            }
        });
    },

    async playHezSummon(hezContainer, hezImg, mainScreen) {
        mainScreen.classList.add('bg-to-night');
        await Utils.delay(2000);

        hezContainer.classList.remove('hidden');

        gsap.fromTo(hezImg,
            { y: 200, opacity: 0, scale: 0.5 },
            { y: 0, opacity: 1, scale: 1, duration: 1.5, ease: "elastic.out(1, 0.5)" }
        );

        await Utils.delay(6000);

        gsap.to(hezImg, {
            y: -50,
            opacity: 0,
            duration: 0.8,
            ease: "power2.in",
            onComplete: () => {
                hezContainer.classList.add('hidden');
            }
        });

        if (!Utils.isNightMode()) {
            mainScreen.classList.remove('bg-to-night');
        }
    },

    // 터치 피드백
    hanaTap(hanaElement) {
        if (!hanaElement) return;
        gsap.to(hanaElement, {
            scaleY: 0.9,
            scaleX: 1.1,
            duration: 0.1,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
        });
    }
};

// 전역으로 export
window.Animations = Animations;
