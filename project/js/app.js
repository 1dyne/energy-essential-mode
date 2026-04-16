/**
 * 에너지 긴축모드 - 메인 애플리케이션
 */

const App = {
    // 상태
    state: {
        currentUser: null,
        userData: null,
        currentScreen: 'loading',
        tutorialStep: 0,
        isTutorialMode: false,  // 튜토리얼 모드 플래그
        tutorialChatStep: 0,    // chat-screen 내 튜토리얼 단계 (1~4)
        pendingTutorialMainIntro: false, // 메인화면 튜토리얼 안내 대기 플래그
        energyLevel: null,
        currentTask: null,
        currentDuration: null,
        taskList: '',
        timerState: {
            isRunning: false,
            isPaused: false,
            startTime: null,
            duration: 0,
            elapsed: 0,
            intervalId: null
        },
        sessionAssets: [],
        todayWorkTime: 0
    },

    /**
     * 앱 초기화
     */
    async init() {
        console.log('에너지 긴축모드 초기화 중...');

        try {
            // 필수 에셋 프리로드
            await Utils.preloadCriticalAssets();

            // Firebase 인증 상태 감지
            FirebaseService.onAuthStateChanged(async (user) => {
                if (user) {
                    await this.handleUserSignedIn(user);
                } else {
                    this.showLoginScreen();
                }
            });

            // 이벤트 리스너 등록
            this.setupEventListeners();

            // Lazy 에셋 로드
            Utils.preloadLazyAssets();

        } catch (error) {
            console.error('초기화 오류:', error);
            this.showLoginScreen();
        }
    },

    /**
     * 로그인된 사용자 처리
     */
    async handleUserSignedIn(user) {
        this.state.currentUser = user;

        try {
            // 사용자 데이터 가져오기
            const userDoc = await FirebaseService.db.collection('users').doc(user.uid).get();

            if (userDoc.exists) {
                this.state.userData = userDoc.data();

                // 세션 복구 체크
                if (this.state.userData.currentSession) {
                    await this.checkSessionRecovery();
                    return;
                }

                // 튜토리얼 완료 여부에 따라 화면 분기
                if (this.state.userData.tutorialCompleted) {
                    this.showMainScreen();
                } else {
                    this.showTutorialScreen();
                }
            } else {
                // 사용자 데이터가 없으면 로그인 화면으로
                this.showLoginScreen();
            }

        } catch (error) {
            console.error('사용자 데이터 로드 오류:', error);
            this.showLoginScreen();
        }
    },

    /**
     * 세션 복구 체크
     */
    async checkSessionRecovery() {
        const session = this.state.userData.currentSession;
        const now = Date.now();
        const startTime = session.startTime.toMillis();
        const closedDuration = now - startTime;

        // 30분 이내: 복구 팝업 표시
        if (closedDuration < Constants.SESSION_RECOVERY_TIMEOUT) {
            document.getElementById('recovery-task').textContent = session.taskName;
            Utils.showPopup('recovery-popup');
            Utils.showScreen('main-screen');
        } else {
            // 30분 초과: 자동 종료
            await this.endSessionAutomatically(session, closedDuration);
            this.showMainScreen();
        }
    },

    /**
     * 자동 세션 종료
     */
    async endSessionAutomatically(session, closedDuration) {
        const progressedTime = Math.min(closedDuration / 1000 / 60, session.duration / 60);

        try {
            const userRef = FirebaseService.db.collection('users').doc(this.state.currentUser.uid);

            await userRef.update({
                totalWorkTime: firebase.firestore.FieldValue.increment(progressedTime),
                currentSession: firebase.firestore.FieldValue.delete()
            });

            // 로컬 상태 업데이트
            this.state.userData.totalWorkTime += progressedTime;
            delete this.state.userData.currentSession;

        } catch (error) {
            console.error('자동 세션 종료 오류:', error);
        }
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 로그인 화면
        document.getElementById('enter-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('invite-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // 튜토리얼
        document.getElementById('name-submit-btn').addEventListener('click', () => this.handleNameSubmit());
        document.getElementById('name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleNameSubmit();
        });

        // 튜토리얼 하나씨 더블클릭 (모바일 터치 지원)
        Utils.addDoubleClickListener(
            document.getElementById('tutorial-hana'),
            () => Animations.hanaTap(document.getElementById('tutorial-hana')),
            () => this.handleTutorialHanaDoubleClick()
        );

        // 메인 화면
        document.getElementById('hamburger-btn').addEventListener('click', () => this.toggleSidebar());
        Utils.addDoubleClickListener(
            document.getElementById('main-hana'),
            () => Animations.hanaTap(document.getElementById('main-hana')),
            () => this.openChatScreen()
        );

        // 채팅 화면
        document.getElementById('chat-back').addEventListener('click', () => this.goBackToMain());
        document.getElementById('chat-energy-select').addEventListener('click', (e) => {
            const btn = e.target.closest('.energy-btn');
            if (btn) this.handleChatEnergySelect(btn);
        });
        document.getElementById('task-submit-btn').addEventListener('click', () => this.handleTaskSubmit());
        document.getElementById('accept-btn').addEventListener('click', () => this.handleSuggestionAccept());
        document.getElementById('modify-btn').addEventListener('click', () => this.handleSuggestionModify());
        document.getElementById('reject-btn').addEventListener('click', () => this.handleSuggestionReject());

        // 수정 옵션
        document.querySelectorAll('.modify-option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleModifyOption(btn.dataset.type));
        });
        document.getElementById('time-submit-btn').addEventListener('click', () => this.handleTimeSubmit());
        document.getElementById('task-modify-submit-btn').addEventListener('click', () => this.handleTaskModifySubmit());
        document.getElementById('feedback-submit-btn').addEventListener('click', () => this.handleFeedbackSubmit());

        // 타이머 화면
        document.getElementById('timer-start-btn').addEventListener('click', () => this.startTimer());
        document.getElementById('timer-pause-btn').addEventListener('click', () => this.pauseTimer());
        document.getElementById('timer-skip-btn').addEventListener('click', () => this.handleTimerSkip());

        // 팝업들
        document.getElementById('end-day-btn').addEventListener('click', () => this.handleEndDay());
        document.getElementById('one-more-btn').addEventListener('click', () => this.handleOneMore());
        document.getElementById('asset-confirm-btn').addEventListener('click', () => this.handleAssetConfirm());
        document.getElementById('levelup-confirm-btn').addEventListener('click', () => this.handleLevelUpConfirm());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeTimer());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitTimer());
        document.getElementById('recovery-continue-btn').addEventListener('click', () => this.continueRecoverySession());
        document.getElementById('recovery-quit-btn').addEventListener('click', () => this.quitRecoverySession());
        document.getElementById('hez-confirm-btn').addEventListener('click', () => Utils.hidePopup('hez-popup'));
        document.getElementById('quick-start-btn').addEventListener('click', () => this.handleQuickStart());

        // 사이드바
        document.getElementById('sidebar-overlay').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('sidebar-close').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('menu-footprints').addEventListener('click', () => this.showFootprints());
        document.getElementById('menu-guide').addEventListener('click', () => this.showGuide());
        document.getElementById('menu-settings').addEventListener('click', () => this.showSettings());
        document.getElementById('menu-delete').addEventListener('click', () => this.showDeleteConfirm());

        // 발자국 화면
        document.getElementById('footprints-back').addEventListener('click', () => this.showMainScreen());

        // 가이드 팝업
        document.getElementById('guide-close-btn').addEventListener('click', () => Utils.hidePopup('guide-popup'));

        // 설정 화면
        document.getElementById('settings-back').addEventListener('click', () => this.showMainScreen());
        document.getElementById('settings-save-btn').addEventListener('click', () => this.saveSettings());
        document.getElementById('settings-cancel-btn').addEventListener('click', () => this.showMainScreen());

        // 데이터 삭제 팝업
        document.getElementById('delete-cancel-btn').addEventListener('click', () => Utils.hidePopup('delete-popup'));
        document.getElementById('delete-confirm-btn').addEventListener('click', () => this.deleteAllData());
    },

    // ===================================
    // 로그인 관련
    // ===================================

    showLoginScreen() {
        Utils.showScreen('login-screen');
        this.state.currentScreen = 'login';

        // 하나씨 두리번 애니메이션 시작
        Animations.startLookAnimation(document.getElementById('hana-look'));
    },

    async handleLogin() {
        const codeInput = document.getElementById('invite-code-input');
        const code = codeInput.value.trim();

        if (!code) {
            this.showLoginError('코드를 입력해주세요');
            return;
        }

        Utils.showLoading('확인 중...');

        try {
            // 익명 로그인 먼저 (Firestore 접근 권한 획득)
            const user = await FirebaseService.signInAnonymously();

            // 코드 검증 (테스트용 주석 처리)
            const codeRef = FirebaseService.db.collection('inviteCodes').doc(code);
            const codeDoc = await codeRef.get();

            // if (!codeDoc.exists) {
            //     Utils.hideLoading();
            //     await FirebaseService.signOut();
            //     this.showLoginError('잘못된 코드입니다');
            //     return;
            // }

            // if (codeDoc.data().used === true) {
            //     Utils.hideLoading();
            //     await FirebaseService.signOut();
            //     this.showLoginError('이미 사용된 코드입니다');
            //     return;
            // }

            // 하나씨 반응
            Animations.stopLookAnimation();
            await Animations.hanaLookForward(document.getElementById('hana-look'));

            // 코드 사용 처리
            await codeRef.update({
                used: true,
                usedBy: user.uid
            });

            // 사용자 데이터 생성
            await FirebaseService.db.collection('users').doc(user.uid).set({
                inviteCode: code,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                totalWorkTime: 0,
                rockLevel: 1,
                acquiredAssets: [],
                tutorialCompleted: false,
                hezUnlocked: false,
                hezTeaser1Shown: false,
                hezTeaser2Shown: false,
                settings: {
                    timerDisplay: 'progressBar'
                }
            });

            Utils.storage.set('session', user.uid);
            Utils.hideLoading();

            // 튜토리얼로 이동
            await Utils.irisTransition(() => {
                this.state.userData = {
                    inviteCode: code,
                    totalWorkTime: 0,
                    rockLevel: 1,
                    acquiredAssets: [],
                    tutorialCompleted: false
                };
                this.showTutorialScreen();
            });

        } catch (error) {
            Utils.hideLoading();
            console.error('로그인 오류:', error);
            this.showLoginError('오류가 발생했습니다');
        }
    },

    showLoginError(message) {
        const input = document.getElementById('invite-code-input');
        input.classList.add('error');
        Utils.showError('login-error', message);

        setTimeout(() => {
            input.classList.remove('error');
        }, 500);
    },

    // ===================================
    // 튜토리얼 관련
    // ===================================

    showTutorialScreen() {
        Utils.showScreen('tutorial-screen');
        this.state.currentScreen = 'tutorial';
        this.state.tutorialStep = 1;

        // 이름 입력 단계
        this.showTutorialStep1();
    },

    async showTutorialStep1() {
        const bubble = document.getElementById('tutorial-bubble');
        const bubbleText = bubble.querySelector('.bubble-text');

        // 화면 전환 후 3초 대기
        await Utils.delay(3000);

        Utils.show('tutorial-bubble');

        // 첫 번째 부분 표시
        await Utils.typeText(
            bubbleText,
            Constants.HANA_DIALOGUES.TUTORIAL.INTRO_PART1
        );

        // 1.5초 대기 후 두 번째 부분 이어서 타이핑
        await Utils.delay(1500);
        bubbleText.textContent += '\n\n';
        const part2 = Constants.HANA_DIALOGUES.TUTORIAL.INTRO_PART2;
        for (let i = 0; i < part2.length; i++) {
            bubbleText.textContent += part2[i];
            await Utils.delay(Constants.ANIMATION_CONFIG.TYPING_SPEED);
        }

        // 1초 대기 후 입력창 표시
        await Utils.delay(1000);
        Utils.show('name-input-area');
        document.getElementById('name-input').focus();
    },

    async handleNameSubmit() {
        const nameInput = document.getElementById('name-input');
        const name = nameInput.value.trim();

        if (!name) return;

        // 이름 저장
        try {
            await FirebaseService.db.collection('users').doc(this.state.currentUser.uid).update({
                userName: name
            });
            this.state.userData.userName = name;
        } catch (error) {
            console.error('이름 저장 오류:', error);
        }

        Utils.hide('name-input-area');

        // 반응 표시
        const bubble = document.getElementById('tutorial-bubble');
        await Utils.typeText(
            bubble.querySelector('.bubble-text'),
            Constants.HANA_DIALOGUES.TUTORIAL.NAME_RESPONSE(name)
        );

        await Utils.delay(500);

        // 터치 유도 단계
        this.showTutorialStep2();
    },

    async showTutorialStep2() {
        const bubble = document.getElementById('tutorial-bubble');
        await Utils.typeText(
            bubble.querySelector('.bubble-text'),
            Constants.HANA_DIALOGUES.TUTORIAL.TOUCH_PROMPT
        );

        Utils.show('touch-guide');
        this.state.tutorialStep = 2;
    },

    async handleTutorialHanaDoubleClick() {
        if (this.state.tutorialStep !== 2) return;

        Utils.hide('touch-guide');

        // 하나씨 반응 (new_hana_idle 유지, 느낌표만 표시)
        const tutorialHana = document.getElementById('tutorial-hana');
        Animations.showExclamation(tutorialHana);
        Animations.hanaTap(tutorialHana);
        await Utils.delay(500);

        // chat-screen으로 전환 (튜토리얼 모드)
        await Utils.irisTransition(async () => {
            this.openTutorialChatScreen();
        });
    },

    /**
     * 튜토리얼 모드로 chat-screen 열기
     */
    async openTutorialChatScreen() {
        this.state.isTutorialMode = true;
        this.state.tutorialChatStep = 1;
        this.state.currentScreen = 'chat';

        // chat-screen 표시
        Utils.showScreen('chat-screen');

        // 채팅 UI 초기화
        document.getElementById('hana-chat-text').textContent = '';
        document.getElementById('task-input').value = '';
        Utils.hide('chat-energy-select');
        Utils.hide('task-input-area');
        Utils.hide('ai-suggestion');
        Utils.hide('modify-options');
        Utils.hide('time-input-area');
        Utils.hide('task-modify-input-area');
        Utils.hide('feedback-input-area');
        Utils.hide('chat-tutorial-bubble');

        // 튜토리얼 모드 UI 활성화
        const chatScreen = document.getElementById('chat-screen');
        chatScreen.classList.add('tutorial-mode');

        // 바위 업데이트
        document.getElementById('chat-rock').src = 'assets/bg_lv1.png';

        // 진행 점 표시
        Utils.show('tutorial-progress-dots');
        this.updateTutorialProgressDots(1);

        // 에너지 선택 흐름 시작
        await this.startTutorialChatFlow();
    },

    /**
     * 튜토리얼 chat-screen 흐름 시작
     */
    async startTutorialChatFlow() {
        const userName = this.state.userData.userName || '유저';

        // 에너지 선택 대사
        await Utils.typeText(
            document.getElementById('hana-chat-text'),
            Constants.HANA_DIALOGUES.TUTORIAL_CHAT.ENERGY_ASK(userName)
        );

        // 에너지 선택 표시 + 툴팁
        Utils.show('chat-energy-select');
        this.showTutorialTooltip(
            document.getElementById('chat-energy-select'),
            Constants.HANA_DIALOGUES.TUTORIAL_TOOLTIPS.ENERGY_SELECT,
            'top'
        );
    },

    /**
     * 튜토리얼 진행 점 업데이트
     */
    updateTutorialProgressDots(currentStep) {
        const dots = document.querySelectorAll('.progress-dot');
        dots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            if (index + 1 < currentStep) {
                dot.classList.add('completed');
            } else if (index + 1 === currentStep) {
                dot.classList.add('active');
            }
        });
    },

    /**
     * 튜토리얼 가이드 툴팁 표시
     */
    showTutorialTooltip(targetElement, message, arrowPosition = 'bottom') {
        const tooltip = document.getElementById('tutorial-tooltip');
        const tooltipText = tooltip.querySelector('.tooltip-text');
        const tooltipArrow = tooltip.querySelector('.tooltip-arrow');

        tooltipText.textContent = message;

        // 화살표 방향 설정
        tooltipArrow.className = 'tooltip-arrow ' + arrowPosition;

        // 위치 계산
        const targetRect = targetElement.getBoundingClientRect();

        if (arrowPosition === 'bottom') {
            // 툴팁이 대상 위에 표시
            tooltip.style.left = `${targetRect.left + targetRect.width / 2}px`;
            tooltip.style.top = `${targetRect.top - 20}px`;
            tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
        } else {
            // 툴팁이 대상 아래에 표시
            tooltip.style.left = `${targetRect.left + targetRect.width / 2}px`;
            tooltip.style.top = `${targetRect.bottom + 20}px`;
            tooltip.style.transform = 'translateX(-50%)';
        }

        Utils.show(tooltip);

        // 닫기 버튼 이벤트
        const closeBtn = tooltip.querySelector('.tooltip-close');
        closeBtn.onclick = () => Utils.hide(tooltip);
    },

    /**
     * 튜토리얼 툴팁 숨기기
     */
    hideTutorialTooltip() {
        Utils.hide('tutorial-tooltip');
    },

    // 레거시 함수 (더 이상 사용하지 않음)
    async showTutorialStep3() {
        // chat-screen으로 전환됨
    },

    async handleTutorialEnergySelect(btn) {
        // 레거시: 더 이상 tutorial-screen에서 에너지 선택하지 않음
    },

    async showTutorialStep4() {
        // 레거시: 더 이상 사용하지 않음
    },

    handleTutorialAccept() {
        // 레거시: 더 이상 사용하지 않음 (chat-screen으로 통합됨)
    },

    async handleEndDay() {
        Utils.hidePopup('complete-popup');

        // 튜토리얼 모드에서 완료한 경우
        if (this.state.isTutorialMode || !this.state.userData.tutorialCompleted) {
            await this.completeTutorial();
        } else {
            await this.saveTimerSession();
            // 에셋 획득 팝업 표시
            document.getElementById('popup-username').textContent = this.state.userData.userName || '유저';
            document.getElementById('asset-list').innerHTML = Utils.generateAssetListHTML(this.state.sessionAssets);
            Utils.showPopup('asset-popup');
        }
    },

    async completeTutorial() {
        let assets = this.state.sessionAssets;
        const durationMinutes = this.state.currentDuration || 0.5; // 분 단위

        // 튜토리얼에서는 최소 에셋 1개 보장
        if (!assets || assets.length === 0) {
            const sampleAssets = ['adj_sprout', 'adj_flower'];
            const randomAsset = sampleAssets[Math.floor(Math.random() * sampleAssets.length)];
            assets = [randomAsset];
            this.state.sessionAssets = assets;
        }

        try {
            // 에셋과 작업시간만 먼저 저장 (tutorialCompleted는 메인화면 안내 후 저장)
            await FirebaseService.db.collection('users').doc(this.state.currentUser.uid).update({
                totalWorkTime: durationMinutes,
                acquiredAssets: assets
            });

            this.state.userData.totalWorkTime = durationMinutes;
            this.state.userData.acquiredAssets = assets;
            // 메인화면 안내 대기 플래그 설정
            this.state.pendingTutorialMainIntro = true;
        } catch (error) {
            console.error('튜토리얼 에셋 저장 오류:', error);
        }

        // 에셋 획득 팝업
        document.getElementById('popup-username').textContent = this.state.userData.userName || '유저';
        document.getElementById('asset-list').innerHTML = Utils.generateAssetListHTML(assets);
        Utils.showPopup('asset-popup');
    },

    handleAssetConfirm() {
        Utils.hidePopup('asset-popup');

        // 상태 초기화
        this.resetSessionState();

        Utils.irisTransition(() => {
            this.showMainScreen();
        });
    },

    /**
     * 채팅 화면에서 메인으로 돌아가기
     */
    goBackToMain() {
        this.resetChatState();
        Utils.irisTransition(() => {
            this.showMainScreen();
        });
    },

    /**
     * 채팅 상태 초기화
     */
    resetChatState() {
        this.state.energyLevel = null;
        this.state.currentTask = null;
        this.state.currentDuration = null;
        this.state.taskList = '';
        this.state.isTutorialMode = false;
        this.state.tutorialChatStep = 0;

        // 채팅 UI 초기화
        Utils.hide('chat-energy-select');
        Utils.hide('task-input-area');
        Utils.hide('ai-suggestion');
        Utils.hide('modify-options');
        Utils.hide('time-input-area');
        Utils.hide('task-modify-input-area');
        Utils.hide('feedback-input-area');
        Utils.hide('tutorial-progress-dots');
        Utils.hide('tutorial-tooltip');
        document.getElementById('task-input').value = '';
        document.getElementById('task-modify-input').value = '';
        document.getElementById('hana-chat-text').textContent = '';

        // 튜토리얼 모드 클래스 제거
        const chatScreen = document.getElementById('chat-screen');
        chatScreen.classList.remove('tutorial-mode');
    },

    /**
     * 세션 상태 초기화
     */
    resetSessionState() {
        this.state.energyLevel = null;
        this.state.currentTask = null;
        this.state.currentDuration = null;
        this.state.taskList = '';
        this.state.sessionAssets = [];
        this.state.isTutorialMode = false;
        this.state.tutorialChatStep = 0;

        // 기존 타이머 정리
        const oldTimerState = this.state.timerState;
        if (oldTimerState.intervalId) {
            clearTimeout(oldTimerState.intervalId);
        }
        oldTimerState.isRunning = false;
        Animations.timerAnimationController.stop();

        this.state.timerState = {
            isRunning: false,
            isPaused: false,
            startTime: null,
            duration: 0,
            elapsed: 0,
            intervalId: null
        };
    },

    // ===================================
    // 메인 화면 관련
    // ===================================

    async showMainScreen() {
        Utils.showScreen('main-screen');
        this.state.currentScreen = 'main';

        // 사용자 데이터 새로고침
        await this.refreshUserData();

        // UI 업데이트
        this.updateMainScreenUI();

        // 하나씨 애니메이션 시작
        Animations.startIdleAnimation(document.getElementById('main-hana'));

        // 튜토리얼 메인화면 안내 체크
        if (this.state.pendingTutorialMainIntro) {
            await this.showTutorialMainIntro();
            return; // 안내 완료 후 다른 체크는 건너뜀
        }

        // Hez 티저 체크
        this.checkHezTeaser();

        // 레벨업 체크
        this.checkLevelUp();
    },

    async refreshUserData() {
        try {
            const userDoc = await FirebaseService.db.collection('users').doc(this.state.currentUser.uid).get();
            if (userDoc.exists) {
                this.state.userData = userDoc.data();
            }
        } catch (error) {
            console.error('데이터 새로고침 오류:', error);
        }
    },

    updateMainScreenUI() {
        const userData = this.state.userData;

        // 바위 이미지 업데이트
        const rockLevel = userData.rockLevel || 1;
        const isNight = Utils.isNightMode() && userData.hezUnlocked;
        const rockSrc = isNight ? 'assets/bg_lv4_night.png' : `assets/bg_lv${rockLevel}.png`;
        document.getElementById('main-rock').src = rockSrc;

        // 밤 모드 배경
        const mainScreen = document.getElementById('main-screen');
        if (isNight) {
            mainScreen.classList.add('night-mode');
        } else {
            mainScreen.classList.remove('night-mode');
        }

        // 에너지 레벨 박스 업데이트
        this.updateTodayTime();
        document.getElementById('total-time').textContent = Utils.formatMinutes(Math.floor(userData.totalWorkTime || 0));

        // Hez 진행률 업데이트
        this.updateHezProgress();

        // 에셋 표시
        this.displayAssets(userData.acquiredAssets || []);
    },

    /**
     * Hez 진행률 UI 업데이트
     */
    updateHezProgress() {
        const userData = this.state.userData;
        const hezBox = document.getElementById('hez-progress-box');
        const hezFill = document.getElementById('hez-progress-fill');
        const hezTime = document.getElementById('hez-progress-time');

        // 이미 언락되었으면 숨김
        if (userData.hezUnlocked) {
            Utils.hide(hezBox);
            return;
        }

        // 진행률 계산
        const totalMinutes = userData.totalWorkTime || 0;
        const unlockTime = Constants.HEZ_CONFIG.UNLOCK_TIME;
        const progress = Math.min((totalMinutes / unlockTime) * 100, 100);

        // UI 업데이트
        Utils.show(hezBox);
        hezFill.style.width = `${progress}%`;
        hezTime.textContent = `${Math.floor(totalMinutes)} / ${unlockTime} min`;
    },

    updateTodayTime() {
        // 오늘 작업 시간 계산 (세션에서)
        document.getElementById('today-time').textContent = Utils.formatMinutes(Math.floor(this.state.todayWorkTime));
    },

    displayAssets(assets) {
        const container = document.getElementById('assets-container');
        container.innerHTML = '';

        const rockRect = document.getElementById('main-rock').getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 최대 50개만 표시
        const displayAssets = assets.slice(-Constants.ANIMATION_CONFIG.MAX_VISIBLE_ASSETS);

        displayAssets.forEach((assetId, index) => {
            const asset = document.createElement('img');
            asset.className = 'asset-item';
            asset.src = `assets/${Constants.ASSET_IMAGES[assetId]}`;

            // 바위 주변 랜덤 위치
            const centerX = rockRect.left - containerRect.left + rockRect.width / 2;
            const centerY = rockRect.top - containerRect.top + rockRect.height / 2;

            const x = centerX + Utils.randomRange(-100, 100);
            const y = centerY + Utils.randomRange(-50, 80);

            asset.style.left = `${x}px`;
            asset.style.top = `${y}px`;

            const scale = Utils.randomRange(0.6, 0.8);
            const rotation = Utils.randomRange(-15, 15);
            asset.style.transform = `scale(${scale}) rotate(${rotation}deg)`;

            container.appendChild(asset);
        });
    },

    /**
     * 튜토리얼 메인화면 안내 표시
     */
    async showTutorialMainIntro() {
        const userName = this.state.userData.userName || '유저';
        const bubble = document.getElementById('main-bubble');
        const bubbleText = bubble.querySelector('.bubble-text');

        // 튜토리얼 진행 점 표시 (5단계 활성화)
        Utils.show('tutorial-progress-dots');
        this.updateTutorialProgressDots(5);

        Utils.show('main-bubble');

        const dialogues = [
            Constants.HANA_DIALOGUES.TUTORIAL.MAIN_INTRO_1(userName),
            Constants.HANA_DIALOGUES.TUTORIAL.MAIN_INTRO_2(userName),
            Constants.HANA_DIALOGUES.TUTORIAL.MAIN_INTRO_3(userName),
            Constants.HANA_DIALOGUES.TUTORIAL.MAIN_INTRO_4(userName),
            Constants.HANA_DIALOGUES.TUTORIAL.MAIN_INTRO_5,
            Constants.HANA_DIALOGUES.TUTORIAL.MAIN_INTRO_6,
            Constants.HANA_DIALOGUES.TUTORIAL.MAIN_INTRO_7
        ];

        for (let i = 0; i < dialogues.length; i++) {
            await Utils.typeText(bubbleText, dialogues[i]);

            // 마지막 대사가 아니면 터치 대기
            if (i < dialogues.length - 1) {
                await this.waitForTap();
            }
        }

        // 마지막 대사 후 잠시 대기
        await Utils.delay(2000);
        Utils.hide('main-bubble');

        // 튜토리얼 완료 처리
        await this.finishTutorial();
    },

    /**
     * 터치/클릭 대기
     */
    waitForTap() {
        return new Promise(resolve => {
            const handler = () => {
                document.removeEventListener('click', handler);
                document.removeEventListener('touchend', handler);
                resolve();
            };
            document.addEventListener('click', handler);
            document.addEventListener('touchend', handler);
        });
    },

    /**
     * 튜토리얼 최종 완료
     */
    async finishTutorial() {
        // 튜토리얼 진행 점 숨기기
        Utils.hide('tutorial-progress-dots');

        try {
            await FirebaseService.db.collection('users').doc(this.state.currentUser.uid).update({
                tutorialCompleted: true
            });

            this.state.userData.tutorialCompleted = true;
            this.state.pendingTutorialMainIntro = false;
            this.state.isTutorialMode = false;
        } catch (error) {
            console.error('튜토리얼 완료 저장 오류:', error);
        }
    },

    async checkHezTeaser() {
        const userData = this.state.userData;
        const totalMinutes = userData.totalWorkTime || 0;
        const { HEZ_CONFIG } = Constants;

        if (totalMinutes >= HEZ_CONFIG.TEASER1_TIME && totalMinutes < HEZ_CONFIG.UNLOCK_TIME && !userData.hezTeaser1Shown) {
            await this.showHezTeaser('peek');
            await this.updateUserField('hezTeaser1Shown', true);
        } else if (totalMinutes >= HEZ_CONFIG.TEASER2_TIME && totalMinutes < HEZ_CONFIG.UNLOCK_TIME && !userData.hezTeaser2Shown) {
            await this.showHezTeaser('partial');
            await this.updateUserField('hezTeaser2Shown', true);
        }
    },

    async showHezTeaser(type) {
        const hezContainer = document.getElementById('hez-teaser');
        const hezImg = document.getElementById('hez-img');

        if (type === 'peek') {
            await Animations.playHezPeek(hezContainer, hezImg);

            // 하나씨 말풍선
            const bubble = document.getElementById('main-bubble');
            Utils.show(bubble);
            await Utils.typeText(
                bubble.querySelector('.bubble-text'),
                Constants.HANA_DIALOGUES.MAIN.HEZ_TEASER1
            );
            setTimeout(() => Utils.hide(bubble), 3000);
        } else if (type === 'partial') {
            await Animations.playHezPartial(hezContainer, hezImg);

            const bubble = document.getElementById('main-bubble');
            Utils.show(bubble);
            await Utils.typeText(
                bubble.querySelector('.bubble-text'),
                Constants.HANA_DIALOGUES.MAIN.HEZ_TEASER2
            );
            setTimeout(() => Utils.hide(bubble), 3000);
        }
    },

    checkLevelUp() {
        const userData = this.state.userData;
        const currentLevel = userData.rockLevel || 1;
        const calculatedLevel = Utils.calculateRockLevel(userData.totalWorkTime || 0);

        if (calculatedLevel > currentLevel) {
            this.showLevelUpPopup(currentLevel, calculatedLevel);
        }
    },

    async showLevelUpPopup(oldLevel, newLevel) {
        document.getElementById('old-level').textContent = oldLevel;
        document.getElementById('new-level').textContent = newLevel;

        // 레벨업 애니메이션
        await Animations.playLevelUpAnimation(
            document.getElementById('main-rock'),
            oldLevel,
            newLevel
        );

        Utils.showPopup('levelup-popup');
    },

    async handleLevelUpConfirm() {
        Utils.hidePopup('levelup-popup');

        const newLevel = parseInt(document.getElementById('new-level').textContent);
        const currentAssets = this.state.userData.acquiredAssets || [];

        // 에셋 변환 (adj → ach)
        const { transformedAssets, transformations } = Utils.transformAssetsOnLevelUp(currentAssets, newLevel);

        try {
            await FirebaseService.db.collection('users').doc(this.state.currentUser.uid).update({
                rockLevel: newLevel,
                acquiredAssets: transformedAssets
            });

            this.state.userData.rockLevel = newLevel;
            this.state.userData.acquiredAssets = transformedAssets;

            // 변환 결과가 있으면 표시
            if (transformations.length > 0) {
                console.log('에셋 변환:', transformations);
                // TODO: 변환 팝업 표시
            }

            this.updateMainScreenUI();
        } catch (error) {
            console.error('레벨업 저장 오류:', error);
        }
    },

    // ===================================
    // 채팅 화면 관련
    // ===================================

    async openChatScreen() {
        Animations.stopIdleAnimation(document.getElementById('main-hana'));

        await Utils.irisTransition(() => {
            Utils.showScreen('chat-screen');
            this.state.currentScreen = 'chat';

            // 채팅 UI 초기화
            document.getElementById('hana-chat-text').textContent = '';
            document.getElementById('task-input').value = '';
            Utils.hide('chat-energy-select');
            Utils.hide('task-input-area');
            Utils.hide('ai-suggestion');
            Utils.hide('modify-options');
            Utils.hide('time-input-area');
            Utils.hide('task-modify-input-area');
            Utils.hide('feedback-input-area');
            Utils.hide('chat-tutorial-bubble');

            // 바위 업데이트
            document.getElementById('chat-rock').src = `assets/bg_lv${this.state.userData.rockLevel || 1}.png`;

            this.startChatFlow();
        });
    },

    async startChatFlow() {
        const userName = this.state.userData.userName || '유저';

        // 에너지 레벨 질문
        await Utils.typeText(
            document.getElementById('hana-chat-text'),
            `안녕 ${userName}! 표정이 좀 지쳐보이네...\n지금 남은 에너지를 알려줄래?`
        );

        Utils.show('chat-energy-select');
    },

    async handleChatEnergySelect(btn) {
        // 툴팁 숨기기
        this.hideTutorialTooltip();

        // 모든 버튼 선택 해제
        document.querySelectorAll('#chat-energy-select .energy-btn').forEach(b => {
            b.classList.remove('selected');
        });

        btn.classList.add('selected');
        this.state.energyLevel = parseInt(btn.dataset.level);

        await Utils.delay(300);
        Utils.hide('chat-energy-select');

        // 튜토리얼 모드 처리
        if (this.state.isTutorialMode) {
            this.state.tutorialChatStep = 2;
            this.updateTutorialProgressDots(2);

            const userName = this.state.userData.userName || '유저';
            const bubbleText = document.getElementById('chat-tutorial-bubble-text');
            const chatTopArea = document.getElementById('chat-screen').querySelector('.chat-top-area');

            // 말풍선에 설명 표시 + 상단 영역 확대
            Utils.show('chat-tutorial-bubble');
            chatTopArea.classList.add('bubble-active');

            // 1단계: 에너지 선택 칭찬
            await Utils.typeText(
                bubbleText,
                Constants.HANA_DIALOGUES.TUTORIAL_CHAT.ENERGY_EXPLAIN_1(userName)
            );

            // 2단계: 채팅 입력 설명
            await Utils.delay(1500);
            await Utils.typeText(
                bubbleText,
                Constants.HANA_DIALOGUES.TUTORIAL_CHAT.ENERGY_EXPLAIN_2(userName)
            );

            // 3단계: 직접 해보기 유도
            await Utils.delay(1500);
            await Utils.typeText(
                bubbleText,
                Constants.HANA_DIALOGUES.TUTORIAL_CHAT.ENERGY_EXPLAIN_3
            );

            await Utils.delay(800);
            Utils.hide('chat-tutorial-bubble');
            chatTopArea.classList.remove('bubble-active');
            Utils.show('task-input-area');
            document.getElementById('task-input').focus();
            return;
        }

        // 일반 모드
        const response = Constants.HANA_DIALOGUES.ENERGY_RESPONSE[this.state.energyLevel];
        await Utils.typeText(
            document.getElementById('hana-chat-text'),
            response(this.state.userData.userName || '유저')
        );

        Utils.show('task-input-area');
        document.getElementById('task-input').focus();
    },

    async handleTaskSubmit() {
        // 툴팁 숨기기
        this.hideTutorialTooltip();

        const taskInput = document.getElementById('task-input');
        const taskList = taskInput.value.trim();

        if (!taskList) return;

        this.state.taskList = taskList;
        Utils.hide('task-input-area');

        // 튜토리얼 모드: 진행 점 업데이트
        if (this.state.isTutorialMode) {
            this.state.tutorialChatStep = 3;
            this.updateTutorialProgressDots(3);
        }

        // 로딩 표시
        await Utils.typeText(
            document.getElementById('hana-chat-text'),
            '하나씨가 생각 중...'
        );

        Utils.showLoading('하나씨가 생각 중...');

        try {
            // AI 추천 요청 (실제 Gemini API 호출)
            const suggestion = await GeminiAPI.getTaskSuggestion(
                this.state.energyLevel,
                taskList,
                this.state.userData.userName || '유저'
            );

            Utils.hideLoading();

            this.state.currentTask = suggestion.task;
            this.state.currentDuration = suggestion.duration;

            // 제안 표시
            await Utils.typeText(
                document.getElementById('hana-chat-text'),
                Constants.HANA_DIALOGUES.SUGGESTION.INTRO(suggestion.task, suggestion.duration)
            );

            document.getElementById('suggestion-task').textContent = `"${suggestion.task}"`;
            document.getElementById('suggestion-duration').textContent = `소요 시간: ${suggestion.duration}분`;

            // 튜토리얼 모드: 버튼 설명을 말풍선에 표시
            if (this.state.isTutorialMode) {
                const userName = this.state.userData.userName || '유저';
                const bubbleText = document.getElementById('chat-tutorial-bubble-text');
                const chatTopArea = document.getElementById('chat-screen').querySelector('.chat-top-area');

                // 말풍선에 설명 표시 + 상단 영역 확대
                Utils.show('chat-tutorial-bubble');
                chatTopArea.classList.add('bubble-active');

                // 1단계: 인트로
                await Utils.delay(800);
                await Utils.typeText(
                    bubbleText,
                    Constants.HANA_DIALOGUES.TUTORIAL_CHAT.BUTTON_INTRO(userName)
                );

                // 2단계: 버튼 설명
                await Utils.delay(1500);
                await Utils.typeText(
                    bubbleText,
                    Constants.HANA_DIALOGUES.TUTORIAL_CHAT.BUTTON_EXPLAIN(userName)
                );

                // 3단계: 추가 팁
                await Utils.delay(2000);
                await Utils.typeText(
                    bubbleText,
                    Constants.HANA_DIALOGUES.TUTORIAL_CHAT.BUTTON_TIP
                );

                await Utils.delay(1000);
                Utils.hide('chat-tutorial-bubble');
                chatTopArea.classList.remove('bubble-active');
            }

            Utils.show('ai-suggestion');

        } catch (error) {
            Utils.hideLoading();
            console.error('AI 추천 오류:', error);

            await Utils.typeText(
                document.getElementById('hana-chat-text'),
                GeminiAPI.getErrorMessage(error)
            );

            Utils.show('task-input-area');
        }
    },

    async handleSuggestionAccept() {
        // 툴팁 숨기기
        this.hideTutorialTooltip();

        // 튜토리얼 모드: 첫 번째 수락 시 숨쉬기로 변경
        if (this.state.isTutorialMode && this.state.currentTask !== '숨쉬기') {
            const userName = this.state.userData.userName || '유저';
            const chatBox = document.getElementById('chat-box');
            const bubbleText = document.getElementById('chat-tutorial-bubble-text');

            // 채팅창 trembling 애니메이션 (0.5초)
            chatBox.classList.add('trembling');
            await Utils.delay(500);
            chatBox.classList.remove('trembling');

            // 말풍선에 하나씨 대사 표시
            const chatTopArea = document.querySelector('.chat-top-area');
            Utils.show('chat-tutorial-bubble');
            chatTopArea.classList.add('bubble-active');
            await Utils.typeText(
                bubbleText,
                Constants.HANA_DIALOGUES.TUTORIAL_CHAT.BREATHING_SUGGEST(userName)
            );

            await Utils.delay(1500);
            Utils.hide('chat-tutorial-bubble');
            chatTopArea.classList.remove('bubble-active');

            // 숨쉬기 30초로 변경
            this.state.currentTask = '숨쉬기';
            this.state.currentDuration = 0.5; // 30초

            // 제안 표시 업데이트
            document.getElementById('suggestion-task').textContent = '"숨쉬기"';
            document.getElementById('suggestion-duration').textContent = '소요 시간: 0.5분 (30초)';

            return; // 두 번째 수락 대기
        }

        Utils.hide('ai-suggestion');

        // 튜토리얼 모드: 진행 점 완료
        if (this.state.isTutorialMode) {
            this.state.tutorialChatStep = 4;
            this.updateTutorialProgressDots(4);

            // 튜토리얼 UI 정리
            Utils.hide('tutorial-progress-dots');
            const chatScreen = document.getElementById('chat-screen');
            chatScreen.classList.remove('tutorial-mode');
        }

        this.openTimerScreen();
    },

    handleSuggestionModify() {
        Utils.hide('ai-suggestion');

        Utils.typeText(
            document.getElementById('hana-chat-text'),
            Constants.HANA_DIALOGUES.SUGGESTION.MODIFY_ASK
        );

        Utils.show('modify-options');
    },

    handleModifyOption(type) {
        Utils.hide('modify-options');

        if (type === 'task') {
            Utils.typeText(
                document.getElementById('hana-chat-text'),
                Constants.HANA_DIALOGUES.SUGGESTION.MODIFY_TASK
            );
            // 현재 작업명을 기본값으로 설정
            document.getElementById('task-modify-input').value = this.state.currentTask || '';
            Utils.show('task-modify-input-area');
            document.getElementById('task-modify-input').focus();
        } else if (type === 'time') {
            Utils.typeText(
                document.getElementById('hana-chat-text'),
                Constants.HANA_DIALOGUES.SUGGESTION.MODIFY_TIME
            );
            Utils.show('time-input-area');
        }
    },

    async handleTaskModifySubmit() {
        const taskModifyInput = document.getElementById('task-modify-input');
        const newTask = taskModifyInput.value.trim();

        if (!newTask) return;

        Utils.hide('task-modify-input-area');
        this.state.currentTask = newTask;

        // 새 제안 표시
        await Utils.typeText(
            document.getElementById('hana-chat-text'),
            Constants.HANA_DIALOGUES.SUGGESTION.RETRY(newTask, this.state.currentDuration)
        );

        document.getElementById('suggestion-task').textContent = `"${newTask}"`;
        document.getElementById('suggestion-duration').textContent = `소요 시간: ${this.state.currentDuration}분`;
        Utils.show('ai-suggestion');

        taskModifyInput.value = '';
    },

    async handleTimeSubmit() {
        const timeInput = document.getElementById('time-input');
        const newDuration = parseInt(timeInput.value);

        if (!newDuration || newDuration < 1) return;

        Utils.hide('time-input-area');
        this.state.currentDuration = newDuration;

        // 새 제안 표시
        await Utils.typeText(
            document.getElementById('hana-chat-text'),
            Constants.HANA_DIALOGUES.SUGGESTION.RETRY(this.state.currentTask, newDuration)
        );

        document.getElementById('suggestion-task').textContent = `"${this.state.currentTask}"`;
        document.getElementById('suggestion-duration').textContent = `소요 시간: ${newDuration}분`;
        Utils.show('ai-suggestion');
    },

    handleSuggestionReject() {
        Utils.hide('ai-suggestion');

        Utils.typeText(
            document.getElementById('hana-chat-text'),
            Constants.HANA_DIALOGUES.SUGGESTION.REJECT_ASK
        );

        Utils.show('feedback-input-area');
    },

    async handleFeedbackSubmit() {
        const feedbackInput = document.getElementById('feedback-input');
        const feedback = feedbackInput.value.trim();

        if (!feedback) return;

        Utils.hide('feedback-input-area');
        Utils.showLoading('하나씨가 다시 생각 중...');

        try {
            const suggestion = await GeminiAPI.getRetryTaskSuggestion(
                this.state.energyLevel,
                this.state.taskList,
                this.state.currentTask,
                feedback,
                this.state.userData.userName || '유저'
            );

            Utils.hideLoading();

            this.state.currentTask = suggestion.task;
            this.state.currentDuration = suggestion.duration;

            await Utils.typeText(
                document.getElementById('hana-chat-text'),
                Constants.HANA_DIALOGUES.SUGGESTION.RETRY(suggestion.task, suggestion.duration)
            );

            document.getElementById('suggestion-task').textContent = `"${suggestion.task}"`;
            document.getElementById('suggestion-duration').textContent = `소요 시간: ${suggestion.duration}분`;
            Utils.show('ai-suggestion');

        } catch (error) {
            Utils.hideLoading();
            await Utils.typeText(
                document.getElementById('hana-chat-text'),
                GeminiAPI.getErrorMessage(error)
            );
            Utils.show('feedback-input-area');
        }

        feedbackInput.value = '';
    },

    // ===================================
    // 타이머 화면 관련
    // ===================================

    async openTimerScreen() {
        const settings = this.state.userData.settings || {};
        const timerDisplay = settings.timerDisplay || 'progressBar';
        const autoStart = settings.autoStart || false;

        await Utils.irisTransition(() => {
            Utils.showScreen('timer-screen');
            this.state.currentScreen = 'timer';

            // 타이머 초기화
            const durationInSeconds = this.state.currentDuration * 60;
            document.getElementById('timer-text').textContent = Utils.formatTime(durationInSeconds);
            document.getElementById('timer-progress').style.width = '0%';
            document.getElementById('current-task').textContent = this.state.currentTask;

            // 타이머 표시 설정 적용
            const timerContainer = document.getElementById('timer-display-container');
            const progressContainer = document.getElementById('progress-bar-container');

            if (timerDisplay === 'timer') {
                Utils.show('timer-display-container');
                Utils.hide('progress-bar-container');
            } else if (timerDisplay === 'progressBar') {
                Utils.hide('timer-display-container');
                Utils.show('progress-bar-container');
            } else {
                // both
                Utils.show('timer-display-container');
                Utils.show('progress-bar-container');
            }

            // 바위 업데이트
            document.getElementById('timer-rock').src = `assets/bg_lv${this.state.userData.rockLevel || 1}.png`;

            // 에셋 컨테이너 초기화
            document.getElementById('timer-assets-container').innerHTML = '';

            // 버튼 상태
            Utils.show('timer-start-btn');
            Utils.hide('timer-pause-btn');

            this.state.timerState = {
                isRunning: false,
                isPaused: false,
                startTime: null,
                duration: durationInSeconds,
                elapsed: 0,
                intervalId: null
            };
            this.state.sessionAssets = [];

            // 튜토리얼 모드: 툴팁 숨김 초기화
            Utils.hide('timer-display-tooltip');
            Utils.hide('timer-start-tooltip');
        });

        // 튜토리얼 모드: 타이머 화면 툴팁 + 건너뛰기 버튼 표시
        if (this.state.isTutorialMode) {
            const userName = this.state.userData.userName || '유저';

            // 타이머 표시 설정 툴팁
            const displayTooltip = document.getElementById('timer-display-tooltip');
            displayTooltip.textContent = Constants.HANA_DIALOGUES.TUTORIAL_TOOLTIPS.TIMER_DISPLAY(userName);
            Utils.show('timer-display-tooltip');

            // 시작 버튼 설정 툴팁
            const startTooltip = document.getElementById('timer-start-tooltip');
            startTooltip.textContent = Constants.HANA_DIALOGUES.TUTORIAL_TOOLTIPS.TIMER_START;
            Utils.show('timer-start-tooltip');

            // 건너뛰기 버튼 표시
            Utils.show('timer-skip-btn');

            return; // 자동 시작 안 함
        }

        // 일반 모드: 건너뛰기 버튼 숨김
        Utils.hide('timer-skip-btn');

        // 자동 시작 설정인 경우
        if (autoStart) {
            await Utils.delay(500);
            this.startTimer();
        }
    },

    async startTimer() {
        // 튜토리얼 툴팁 숨기기
        Utils.hide('timer-display-tooltip');
        Utils.hide('timer-start-tooltip');

        Utils.hide('timer-start-btn');
        Utils.show('timer-pause-btn');

        const timerState = this.state.timerState;
        timerState.isRunning = true;
        timerState.startTime = Date.now();

        // Firebase에 현재 세션 저장
        await this.saveCurrentSession();

        // 하나씨 애니메이션 시작
        const hana = document.getElementById('timer-hana');
        const rock = document.getElementById('timer-rock');
        const assetsContainer = document.getElementById('timer-assets-container');

        Animations.timerAnimationController.start(
            hana,
            rock,
            assetsContainer,
            this.state.userData.rockLevel || 1,
            (assetId) => {
                this.state.sessionAssets.push(assetId);
            }
        );

        // 타이머 업데이트
        this.updateTimerLoop();
    },

    updateTimerLoop() {
        const timerState = this.state.timerState;

        const update = () => {
            if (!timerState.isRunning) return;

            const now = Date.now();
            const elapsed = Math.floor((now - timerState.startTime) / 1000) + timerState.elapsed;
            const remaining = Math.max(0, timerState.duration - elapsed);

            document.getElementById('timer-text').textContent = Utils.formatTime(remaining);
            document.getElementById('timer-progress').style.width = `${(elapsed / timerState.duration) * 100}%`;

            if (remaining <= 0) {
                this.completeTimer();
                return;
            }

            timerState.intervalId = setTimeout(update, 100);
        };

        update();
    },

    pauseTimer() {
        const timerState = this.state.timerState;

        timerState.isRunning = false;
        timerState.isPaused = true;
        timerState.elapsed += Math.floor((Date.now() - timerState.startTime) / 1000);

        if (timerState.intervalId) {
            clearTimeout(timerState.intervalId);
        }

        Animations.timerAnimationController.stop();

        Utils.showPopup('pause-popup');
    },

    resumeTimer() {
        Utils.hidePopup('pause-popup');

        const timerState = this.state.timerState;
        timerState.isRunning = true;
        timerState.isPaused = false;
        timerState.startTime = Date.now();

        const hana = document.getElementById('timer-hana');
        const rock = document.getElementById('timer-rock');
        const assetsContainer = document.getElementById('timer-assets-container');

        Animations.timerAnimationController.start(
            hana,
            rock,
            assetsContainer,
            this.state.userData.rockLevel || 1,
            (assetId) => {
                this.state.sessionAssets.push(assetId);
            }
        );

        this.updateTimerLoop();
    },

    async handleTimerSkip() {
        // 튜토리얼 툴팁 및 건너뛰기 버튼 숨기기
        Utils.hide('timer-display-tooltip');
        Utils.hide('timer-start-tooltip');
        Utils.hide('timer-skip-btn');
        Utils.hide('timer-start-btn');

        // 타이머가 실행 중이었다면 정리
        const timerState = this.state.timerState;
        timerState.isRunning = false;
        if (timerState.intervalId) {
            clearTimeout(timerState.intervalId);
            timerState.intervalId = null;
        }
        Animations.timerAnimationController.stop();

        // 튜토리얼용 샘플 에셋 추가
        const sampleAssets = ['adj_sprout', 'adj_flower'];
        const randomAsset = sampleAssets[Math.floor(Math.random() * sampleAssets.length)];
        this.state.sessionAssets = [randomAsset];

        // 완료 팝업 표시 (일반 흐름으로 진행)
        Utils.showPopup('complete-popup');
    },

    async quitTimer() {
        Utils.hidePopup('pause-popup');

        Animations.timerAnimationController.stop();

        // 진행 시간만 저장
        const timerState = this.state.timerState;
        const progressedMinutes = timerState.elapsed / 60;

        try {
            await FirebaseService.db.collection('users').doc(this.state.currentUser.uid).update({
                totalWorkTime: firebase.firestore.FieldValue.increment(progressedMinutes),
                currentSession: firebase.firestore.FieldValue.delete()
            });
        } catch (error) {
            console.error('타이머 종료 저장 오류:', error);
        }

        // 상태 초기화 후 메인으로
        this.resetSessionState();
        this.showMainScreen();
    },

    async completeTimer() {
        const timerState = this.state.timerState;
        timerState.isRunning = false;

        if (timerState.intervalId) {
            clearTimeout(timerState.intervalId);
        }

        Animations.timerAnimationController.stop();

        // Hez 소환 체크
        const userData = this.state.userData;
        const totalAfter = (userData.totalWorkTime || 0) + timerState.duration / 60;

        if (totalAfter >= Constants.HEZ_CONFIG.UNLOCK_TIME && !userData.hezUnlocked) {
            await this.summonHez();
        }

        Utils.showPopup('complete-popup');
    },

    async summonHez() {
        const hezContainer = document.getElementById('hez-teaser');
        const hezImg = document.getElementById('hez-img');
        const mainScreen = document.getElementById('timer-screen');

        await Animations.playHezSummon(hezContainer, hezImg, mainScreen);

        Utils.showPopup('hez-popup');

        await this.updateUserField('hezUnlocked', true);
    },

    handleOneMore() {
        Utils.hidePopup('complete-popup');
        Utils.showPopup('one-more-popup');
    },

    async handleQuickStart() {
        const taskInput = document.getElementById('quick-task-input');
        const timeInput = document.getElementById('quick-time-input');

        const task = taskInput.value.trim();
        const duration = parseInt(timeInput.value);

        if (!task || !duration) return;

        Utils.hidePopup('one-more-popup');

        // 이전 세션 저장
        await this.saveTimerSession();

        // 새 타이머 시작
        this.state.currentTask = task;
        this.state.currentDuration = duration;

        // 입력 초기화
        taskInput.value = '';
        timeInput.value = '';

        this.openTimerScreen();
    },

    async saveTimerSession() {
        const timerState = this.state.timerState;
        const durationMinutes = timerState.duration / 60;
        const assets = this.state.sessionAssets;

        try {
            const userRef = FirebaseService.db.collection('users').doc(this.state.currentUser.uid);

            // 세션 기록 저장
            await userRef.collection('sessions').add({
                date: Utils.getTodayString(),
                taskName: this.state.currentTask,
                duration: durationMinutes,
                energyLevel: this.state.energyLevel,
                acquiredAssets: assets,
                completed: true,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 총 시간 업데이트
            await userRef.update({
                totalWorkTime: firebase.firestore.FieldValue.increment(durationMinutes),
                acquiredAssets: firebase.firestore.FieldValue.arrayUnion(...assets),
                currentSession: firebase.firestore.FieldValue.delete()
            });

            this.state.userData.totalWorkTime += durationMinutes;
            this.state.todayWorkTime += durationMinutes;

        } catch (error) {
            console.error('세션 저장 오류:', error);
        }
    },

    async saveCurrentSession() {
        try {
            await FirebaseService.db.collection('users').doc(this.state.currentUser.uid).update({
                currentSession: {
                    taskName: this.state.currentTask,
                    startTime: firebase.firestore.FieldValue.serverTimestamp(),
                    duration: this.state.timerState.duration,
                    energyLevel: this.state.energyLevel
                }
            });
        } catch (error) {
            console.error('현재 세션 저장 오류:', error);
        }
    },

    async continueRecoverySession() {
        Utils.hidePopup('recovery-popup');

        const session = this.state.userData.currentSession;
        const now = Date.now();
        const startTime = session.startTime.toMillis();
        const closedDuration = Math.floor((now - startTime) / 1000);
        const remaining = session.duration - closedDuration;

        if (remaining > 0) {
            this.state.currentTask = session.taskName;
            this.state.currentDuration = Math.ceil(remaining / 60);
            this.state.energyLevel = session.energyLevel;

            this.openTimerScreen();
        } else {
            await this.endSessionAutomatically(session, now - startTime);
            this.showMainScreen();
        }
    },

    async quitRecoverySession() {
        Utils.hidePopup('recovery-popup');

        const session = this.state.userData.currentSession;
        await this.endSessionAutomatically(session, Date.now() - session.startTime.toMillis());
        this.showMainScreen();
    },

    // ===================================
    // 사이드바 관련
    // ===================================

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('show');
        sidebar.classList.toggle('hidden');
    },

    async showFootprints() {
        this.toggleSidebar();

        Utils.showScreen('footprints-screen');
        this.state.currentScreen = 'footprints';

        // 세션 기록 로드
        try {
            const sessionsRef = FirebaseService.db
                .collection('users')
                .doc(this.state.currentUser.uid)
                .collection('sessions')
                .orderBy('completedAt', 'desc')
                .limit(50);

            const snapshot = await sessionsRef.get();
            const list = document.getElementById('footprints-list');
            list.innerHTML = '';

            if (snapshot.empty) {
                list.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">아직 기록이 없어요</p>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const item = document.createElement('div');
                item.className = 'footprint-item';

                item.innerHTML = `
                    <div class="footprint-date">📅 ${data.date}</div>
                    <div class="footprint-task">"${data.taskName}"</div>
                    <div class="footprint-duration">⏱ ${data.duration}분</div>
                    <div class="footprint-assets">획득: ${Utils.generateAssetListHTML(data.acquiredAssets || [])}</div>
                `;

                list.appendChild(item);
            });

        } catch (error) {
            console.error('세션 기록 로드 오류:', error);
        }
    },

    showGuide() {
        this.toggleSidebar();
        Utils.showPopup('guide-popup');
    },

    showSettings() {
        this.toggleSidebar();

        Utils.showScreen('settings-screen');
        this.state.currentScreen = 'settings';

        // 현재 설정 로드
        const settings = this.state.userData.settings || {};
        const timerDisplay = settings.timerDisplay || 'progressBar';
        const autoStart = settings.autoStart || false;

        document.querySelector(`input[name="timerDisplay"][value="${timerDisplay}"]`).checked = true;
        document.querySelector(`input[name="autoStart"][value="${autoStart}"]`).checked = true;
    },

    async saveSettings() {
        const timerDisplay = document.querySelector('input[name="timerDisplay"]:checked').value;
        const autoStart = document.querySelector('input[name="autoStart"]:checked').value === 'true';

        try {
            await FirebaseService.db.collection('users').doc(this.state.currentUser.uid).update({
                'settings.timerDisplay': timerDisplay,
                'settings.autoStart': autoStart
            });

            this.state.userData.settings = { timerDisplay, autoStart };
            this.showMainScreen();

        } catch (error) {
            console.error('설정 저장 오류:', error);
        }
    },

    showDeleteConfirm() {
        this.toggleSidebar();
        Utils.showPopup('delete-popup');
    },

    async deleteAllData() {
        Utils.hidePopup('delete-popup');
        Utils.showLoading('삭제 중...');

        try {
            const uid = this.state.currentUser.uid;
            const inviteCode = this.state.userData.inviteCode;

            // 세션 기록 삭제
            const sessionsRef = FirebaseService.db.collection('users').doc(uid).collection('sessions');
            const sessions = await sessionsRef.get();
            const batch = FirebaseService.db.batch();

            sessions.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            // 사용자 문서 삭제
            await FirebaseService.db.collection('users').doc(uid).delete();

            // 초대 코드 재사용 가능하게
            if (inviteCode) {
                await FirebaseService.db.collection('inviteCodes').doc(inviteCode).update({
                    used: false,
                    usedBy: ''
                });
            }

            // 로컬 세션 삭제
            Utils.storage.remove('session');

            // 로그아웃
            await FirebaseService.signOut();

            Utils.hideLoading();

            // 로그인 화면으로
            this.state = {
                currentUser: null,
                userData: null,
                currentScreen: 'loading',
                tutorialStep: 0,
                energyLevel: null,
                currentTask: null,
                currentDuration: null,
                taskList: '',
                timerState: {
                    isRunning: false,
                    isPaused: false,
                    startTime: null,
                    duration: 0,
                    elapsed: 0,
                    intervalId: null
                },
                sessionAssets: [],
                todayWorkTime: 0
            };

            this.showLoginScreen();

        } catch (error) {
            Utils.hideLoading();
            console.error('데이터 삭제 오류:', error);
        }
    },

    // ===================================
    // 유틸리티
    // ===================================

    async updateUserField(field, value) {
        try {
            await FirebaseService.db.collection('users').doc(this.state.currentUser.uid).update({
                [field]: value
            });
            this.state.userData[field] = value;
        } catch (error) {
            console.error(`${field} 업데이트 오류:`, error);
        }
    }
};

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 전역으로 export
window.App = App;
