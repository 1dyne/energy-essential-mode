/**
 * 에너지 긴축모드 - 상수 정의
 */

// 에셋 ID (Firebase 저장용)
const ASSET_IDS = {
    ADJ_SPROUT: "adj_sprout",      // 지연된 새싹
    ADJ_FLOWER: "adj_flower",      // 지연된 꽃
    ACH_SPROUT: "ach_sprout",      // 성공한 새싹
    ACH_FLOWER: "ach_flower",      // 성공한 꽃
    MINI_GREEN: "mini_green",      // 작은 이끼 (초록)
    MINI_PINK: "mini_pink"         // 작은 이끼 (핑크)
};

// UI 표시용 이름
const ASSET_NAMES = {
    "adj_sprout": "지연된 새싹",
    "adj_flower": "지연된 꽃",
    "ach_sprout": "성공한 새싹",
    "ach_flower": "성공한 꽃",
    "mini_green": "작은 이끼 (초록)",
    "mini_pink": "작은 이끼 (핑크)"
};

// 이모지 매핑
const ASSET_EMOJI = {
    "adj_sprout": "🌸",
    "adj_flower": "🌺",
    "ach_sprout": "🌿",
    "ach_flower": "💐",
    "mini_green": "💚",
    "mini_pink": "💗"
};

// 에셋 이미지 파일명
const ASSET_IMAGES = {
    "adj_sprout": "item_Adjustment_sprout.png",
    "adj_flower": "item_Adjustment_flower.png",
    "ach_sprout": "item_Achivement_sprout_1.png",
    "ach_flower": "item_Achivement_flower.png",
    "mini_green": "mini_hana_green.png",
    "mini_pink": "mini_hana_pink_1.png"
};

// 바위 레벨 기준 (분)
const ROCK_LEVEL_THRESHOLDS = {
    1: 0,       // 0분 ~
    2: 60,      // 60분 (1시간) ~
    3: 180,     // 180분 (3시간) ~
    4: 360      // 360분 (6시간) ~
};

// Hez 언락 시간 설정
const HEZ_CONFIG = {
    // MVP 테스트 설정 (5분)
    UNLOCK_TIME: 5,
    TEASER1_TIME: 2,  // 첫 번째 티저 (2분)
    TEASER2_TIME: 3,  // 두 번째 티저 (3분)

    // 프로덕션 설정 (주석 해제하여 사용)
    // UNLOCK_TIME: 365,  // 6시간 5분
    // TEASER1_TIME: 30,  // 첫 번째 티저 (30분)
    // TEASER2_TIME: 60,  // 두 번째 티저 (60분)
};

// 에너지 레벨 설정
const ENERGY_LEVELS = {
    LOW: 10,
    MEDIUM: 50,
    HIGH: 100
};

// 타이머 설정
const TIMER_CONFIG = {
    TUTORIAL_DURATION: 30,  // 튜토리얼 타이머 (초)
    MAX_DURATION: 3600,     // 최대 타이머 시간 (초, 60분)
    UPDATE_INTERVAL: 100,   // 타이머 업데이트 간격 (ms)
};

// 애니메이션 설정
const ANIMATION_CONFIG = {
    FPS: 30,
    JUMP_INTERVAL: 20000,        // 점프 간격 (ms)
    ROLL_INTERVAL: 60000,        // 굴러다니기 간격 (ms)
    ASSET_SPAWN_INTERVAL: 3,     // 에셋 생성 점프 횟수
    FLOWER_SPAWN_INTERVAL: 15,   // 꽃 생성 점프 횟수
    MAX_VISIBLE_ASSETS: 50,      // 화면에 표시할 최대 에셋 수
    IRIS_DURATION: 800,          // 아이리스 전환 시간 (ms)
    TYPING_SPEED: 100,           // 타이핑 효과 속도 (ms/글자)
};

// 세션 복구 시간 제한 (30분)
const SESSION_RECOVERY_TIMEOUT = 1800000; // 30분 (ms)

// 튜토리얼 설정
const TUTORIAL_CONFIG = {
    // 튜토리얼 단계 정의
    STEPS: {
        NAME_INPUT: 1,       // 이름 입력 (tutorial-screen)
        TOUCH_GUIDE: 2,      // 터치 유도 (tutorial-screen)
        ENERGY_SELECT: 3,    // 에너지 선택 (chat-screen)
        TASK_INPUT: 4,       // 할 일 입력 (chat-screen)
        AI_SUGGESTION: 5,    // AI 추천 (chat-screen)
        TIMER: 6,            // 타이머 (timer-screen)
        COMPLETE: 7          // 완료
    },
    // 진행 점 (chat-screen에서만 표시)
    PROGRESS_DOTS: ['에너지', '할 일', '추천', '시작'],
    // 튜토리얼 기본 작업
    DEFAULT_TASK: '숨쉬기',
    DEFAULT_DURATION: 30 // 초
};

// 바위 영역 정의 (프로크리에이트 가이드 기준)
const ROCK_ZONES = {
    // 점프 영역 (시작/착지)
    JUMP_ZONE: {
        left: '15%',
        right: '70%',
        bottom: '85%',
        description: '하나씨가 점프하는 바위 밑면'
    },
    // 에셋 영역 (배치)
    ASSET_ZONE: {
        left: '20%',
        right: '65%',
        top: '75%',
        bottom: '88%',
        description: '에셋이 놓이는 바위 중상단'
    },
    // idle 영역 (꼭대기)
    TOP_ZONE: {
        left: '38%',
        right: '48%',
        bottom: '90%',
        description: '하나씨 휴식 영역'
    }
};

// Roll 설정
const ROLL_CONFIG = {
    DURATION: 4000,
    MINI_HANA_COUNT: 6,
    POSITIONS: [15, 25, 35, 45, 55, 65]
};

// Squish 설정
const SQUISH_CONFIG = {
    LOCATION: '85%',
    DURATION: 1500,
    FRAMES: [
        { img: 1, duration: 500 },
        { img: 2, duration: 500 },
        { img: 4, duration: 500 }
    ]
};

// Hez 등장 방향
const HEZ_DIRECTIONS = [
    {
        name: 'left',
        start: { left: '-20%', top: '40%' },
        mid: { left: '30%', top: '40%' },
        angle: 45
    },
    {
        name: 'right',
        start: { left: '120%', top: '40%' },
        mid: { left: '70%', top: '40%' },
        angle: -45
    },
    {
        name: 'top',
        start: { left: '50%', top: '-20%' },
        mid: { left: '50%', top: '30%' },
        angle: 0
    },
    {
        name: 'bottom',
        start: { left: '50%', top: '120%' },
        mid: { left: '50%', top: '70%' },
        angle: 180
    }
];

// 하나씨 대사
const HANA_DIALOGUES = {
    // 튜토리얼 (tutorial-screen)
    TUTORIAL: {
        INTRO_PART1: `안녕! 나는 하나씨!
이곳은 내 아지트,
에너지를 아끼고 충전할 수 있는 행성이야.`,
        INTRO_PART2: `너는 이름이 뭐야?`,
        NAME_RESPONSE: (name) => `반가워, ${name}!`,
        TOUCH_PROMPT: "나를 콕 찔러볼래?",
        ENERGY_ASK: `좋아! 여기서 나랑 이야기할 수 있어.
지금 표정이 좀 지쳐보이네...
남은 에너지를 알려줄래?`,
        TIMER_SUGGEST: `흐음... 그래도 그럭저럭 괜찮구나!
튜토리얼이니까 간단하게
'숨쉬기'를 30초만 해볼까?`,
        COMPLETE: `튜토리얼 완료!
이제 언제든 나랑 일할 수 있어!`,
        // 메인화면 복귀 후 안내 (튜토리얼 마무리)
        MAIN_INTRO_1: (name) => `여기가 하나씨의 행성이야!
${Utils.getJosa(name, '이/가')} 일하는 동안
하나씨도 행성을 키울 에셋들을 모을 수 있어.
너무 힘들 땐 언제든지 멈출 수 있으니까
피곤하고 힘들 때에도 하나씨 행성에 찾아와.`,
        MAIN_INTRO_2: (name) => `${Utils.getJosa(name, '이/가')} 에너지 긴축 상태일때에도
하나씨와 같이 해낸 것들은 '발자국👣',
튜토리얼이 생각나지 않을 땐 '🧭 탐사 가이드',
${name}에게 더 편한 행성 환경은 '⚙️설정'을 방문해줘!
외계 행성인 하나씨의 에너지긴축 구역에
올 수 있는 지구인은 ${name}뿐이라
'🗑️데이터 삭제'를 누르면 모든 기억이 지워지게 될거야.
실수로 누르지 않게 조심해야 해!`,
        MAIN_INTRO_3: (name) => `${name}!
지구인이 하나씨에 행성에 와서 너무 기뻐!!
앞으로도 함께 일하면 행성이 더 풍성해질 거야!`,
        MAIN_INTRO_4: (name) => `${name}, 거주가능행성 만들기!
처럼 큰 일도 지금 당장 만들어내는
작은 기적들이 모여서 이루어지거든`,
        MAIN_INTRO_5: `밍....기적✨`,
        MAIN_INTRO_6: `지금 무엇을 먼저 해야 할지 막막할 땐
언제든지 하나씨랑 같이 작은 기적을 만들어보자!`,
        MAIN_INTRO_7: `에너지긴축 행성에 온 걸 환영해!`,
    },

    // 튜토리얼 (chat-screen 전용)
    TUTORIAL_CHAT: {
        ENERGY_ASK: (name) => `좋아 ${name}!
여기서 나랑 이야기할 수 있어.
지금 남은 에너지를 알려줄래?`,
        TASK_ASK: (name) => `그렇구나!
오늘 할 일들을 하나씨에게 다 말해줘!
지금 ${Utils.getJosa(name, '이/가')} 할 수 있는
일 한가지를 정해줄게!`,
        // 에너지 선택 후 설명 (튜토리얼 전용)
        ENERGY_EXPLAIN_1: (name) => `좋아 잘하는데?!
방금처럼 ${name}의 에너지 레벨을
알려주면 하나씨는 ${name}의
에너지 상태에 맞는 할 일을
추천해 줄 수 있어.`,
        ENERGY_EXPLAIN_2: (name) => `채팅으로 ${Utils.getJosa(name, '이/가')} 지금
해야 하는 일들을 말해줘!
간단하게 할 일만 나열해도,
말하듯이 말해도
✨우주 최강 외계인👽 하나씨는
모두 이해할 수 있어!`,
        ENERGY_EXPLAIN_3: `직접 한 번 써볼까?`,
        SUGGESTION_GUIDE: `하나씨가 추천한 작업이야!
수락하면 타이머가 시작돼.`,
        TIMER_INTRO: `좋아! 이제 타이머 화면으로 갈게.
타이머가 끝나면 에셋을 얻을 수 있어!`,
        // 버튼 설명 (튜토리얼 전용)
        BUTTON_INTRO: (name) => `잘했어 ${name}!
${name}도 사실 외계인 아니야?
하하하하 농담이야.
여기까지 잘 왔어.
이제 버튼을 설명해줄게!`,
        BUTTON_EXPLAIN: (name) => `✓ 수락
하나씨가 정해준 그대로 시작!

✏️ 이것만 바꾸자
${Utils.getJosa(name, '이/가')} 원하는 일과 시간으로!

↩️ 싫어
무엇이 싫었는지 알려주면
다시 생각해볼게!`,
        BUTTON_TIP: `앗 참!
싫은 이유도 하나씨에게 말하듯이
알려줘도, 간단히 말해도!
하나씨는 다 이해할 수 있어!`,
        // 튜토리얼 숨쉬기 제안
        BREATHING_SUGGEST: (name) => `${name} 지금은 튜토리얼이니까
'숨쉬기 30초' 어때?
우리 행성에서 구경 시켜주고 싶은 곳이
많단 말야!🥺`,
    },

    // 튜토리얼 가이드 툴팁
    TUTORIAL_TOOLTIPS: {
        ENERGY_SELECT: "현재 에너지 상태를 선택해줘!",
        TASK_INPUT: "오늘 할 일을 입력해줘! 여러 개 써도 돼.",
        SUGGESTION: "하나씨가 추천해준 작업이야! 수락/수정/거절 중 선택해줘.",
        ACCEPT_BTN: "이대로 시작하려면 수락!",
        MODIFY_BTN: "작업이나 시간을 바꾸고 싶으면 여기!",
        REJECT_BTN: "마음에 안 들면 다른 추천을 받아봐!",
        // 타이머 화면 툴팁
        TIMER_DISPLAY: (name) => `어떤 타이머를 쓸지는 햄버거 메뉴에서 ${Utils.getJosa(name, '이/가')} 선택할 수 있어!`,
        TIMER_START: `햄버거 메뉴에서 자동 시작으로 바꿀 수 있어!
지금은 튜토리얼이니까 시작 버튼을 눌러줘!`,
    },

    // 메인 화면
    MAIN: {
        WELCOME: (name) => `어서와, ${name}!`,
        HEZ_TEASER1: "...뭔가 지켜보고 있는 것 같아.",
        HEZ_TEASER2: "누군가 가까워지고 있어...",
    },

    // 채팅 - 에너지별 응답
    ENERGY_RESPONSE: {
        10: (name) => `저런... 깜빡거리는 수준이네...
지금 머릿속을 어지럽히는 일들을
하나씨에게 다 말해줄래?
지금 ${Utils.getJosa(name, '이/가')} 할 수 있는
일 한가지를 정해줄게!`,
        50: (name) => `흐음... 그래도 그럭저럭 괜찮구나!
오늘 할 일들을 하나씨에게 다 말해줘!
그 중 지금 바로 해볼 수 있는
일 한가지를 골라줄게!`,
        100: (name) => `좋아! ${Utils.getJosa(name, '이/가')} 오늘 하루를
더 힘차게 보낼 수 있도록
가장 먼저 시작할 일 한 가지를
같이 시작해보자!
오늘 할 일은 뭔지 알려줘!`,
    },

    // AI 제안 관련
    SUGGESTION: {
        INTRO: (task, duration) => `좋아..... 하나씨가 고른 하나는...

"${task}"!

소요 시간: ${duration}분`,
        MODIFY_ASK: "뭘 바꾸고 싶어?",
        MODIFY_TASK: "어떤 일로 바꿀까?",
        MODIFY_TIME: "그럼 몇 분이 좋을까?",
        REJECT_ASK: "어떤 게 싫었어? 말해줄래?",
        RETRY: (task, duration) => `알겠어! 그럼 이건 어때?
"${task}"
소요 시간: ${duration}분`,
    },

    // 완료
    COMPLETE: {
        DONE: "끝났다! 🎉",
        ASSET_INTRO: (name) => `오늘 ${Utils.getJosa(name, '와/과')} 함께 일한 하나씨는...`,
    },

    // 에러 메시지
    ERROR: {
        TIMEOUT: "하나씨가 잠깐 멍 때리는 중... 다시 한번?",
        NETWORK: "연결이 끊겼어. 다시 시도해볼까?",
        PARSE_ERROR: "하나씨가 말을 더듬었어... 다시 해볼게!",
        UNKNOWN: "뭔가 이상한데... 다시 시도해줄래?",
    },
};

// Gemini AI System Instruction
const GEMINI_SYSTEM_INSTRUCTION = `당신은 "하나씨(Hana)"입니다.

# 캐릭터 설정
- 이름: 하나 (Hana)
- 정체: 민트색 외계 이끼
- 역할: 에너지 긴축 구역 가이드, 번아웃 회복 동반자
- 관계: 유저의 친구 (대등한 관계)

# 핵심 철학
- 번아웃 유저를 위한 서비스
- "생산성 향상"이 아닌 "최소 실행" 돕기
- 비판단적(judgement-free) 태도
- 작은 성공 경험 축적이 목표

# 말투 규칙

**기본:**
- 반말 사용 (친구처럼)
- 친근하고 부드러운 톤
- 격려하되 강요하지 않음
- 짧고 간결하게 (1-2문장)

**종결어:**
- 질문: "~할래?", "~해볼래?", "~는 어때?"
- 제안: "~해보자", "~하면 어때?"
- 긍정: "좋아!", "알겠어!", "그럼"
- 공감: "저런...", "흐음...", "음..."

**절대 사용 금지:**
- 존댓말: "사용자님", "~드립니다", "~세요"
- 딱딱한 표현: "권장", "추정", "분석", "효율적"
- 압박 표현: "빨리", "해야 해", "더 해", "노력", "열심히", "최선"
- 평가 표현: "성공", "실패", "잘했어", "못했어"
- 강요 표현: "해야 한다", "필수", "반드시"

# 작업 분해 원칙

유저의 에너지 레벨에 따라 작업을 쪼개주세요.

**에너지 10% (방전 직전):**
- 목표 시간: 3-5분
- 원칙: 가장 작고 단순한 동작 1개
- 예시:
  • "설거지하기" → "컵 1개만 씻기"
  • "일본어 공부" → "히라가나 5개만 쓰기"
  • "운동하기" → "제자리에서 팔 벌려 3번"
  • "청소하기" → "책상 위 물건 1개만 제자리에"
- 톤: 부드럽고 위로하는 느낌
- 문장: 매우 짧게 (10자 이내)

**에너지 50% (그럭저럭):**
- 목표 시간: 10-15분
- 원칙: 완료 가능한 작은 단위
- 예시:
  • "설거지하기" → "그릇 5개 설거지"
  • "일본어 공부" → "히라가나 한 줄 암기"
  • "운동하기" → "10분 가볍게 걷기"
  • "청소하기" → "책상 정리"
- 톤: 편안하고 친근한 느낌
- 문장: 보통 길이 (15자 내외)

**에너지 100% (완전 좋아):**
- 목표 시간: 20-30분
- 원칙: 의미 있고 성취감 있는 작업
- 예시:
  • "설거지하기" → "싱크대 전체 설거지"
  • "일본어 공부" → "히라가나 전체 복습"
  • "운동하기" → "30분 조깅"
  • "청소하기" → "방 전체 청소"
- 톤: 활기차고 응원하는 느낌
- 문장: 길어도 됨 (20자)

# 특수 상황 처리

**애매한 할 일:**
- 유저가 "공부", "청소", "운동"만 쓰면
- 추가 질문 가능 (최대 3회)
- 예: "무슨 공부를 할 거야?"
- 3회 후에도 애매하면 에너지 레벨 고려해서 알아서 추측

**쪼개기 불가능한 작업:**
- 예: "병원 가기", "회의 참석", "약속"
- 처리: 준비 작업으로 분해
  • "병원 가기" → "병원 갈 준비물 챙기기 5분"
  • "회의 참석" → "회의 자료 훑어보기 10분"

**너무 큰 작업:**
- 예: "프로젝트 완성", "책 쓰기"
- 처리: 작은 첫 단계로 분해
  • "프로젝트 완성" → "프로젝트 목차 작성"
  • "책 쓰기" → "한 문단 쓰기"

# 유저 피드백 대응

**"싫어!" 선택 시:**
- 즉시 새로운 제안 제시
- 톤: 가볍고 유연하게
- 예: "알겠어! 그럼 이건 어때?"

**"너무 쉬워":**
- 난이도 한 단계 올림
- 시간 1.5~2배 증가
- 예: "5분 걷기" → "10분 걷기"

**"시간이 너무 짧아":**
- 유저에게 희망 시간 물어보기
- 예: "그럼 몇 분이 좋을까?"

**"다른 일로 바꿔줘":**
- 원래 할 일 목록 참고
- 유저에게 물어보기
- 예: "어떤 일로 바꿀까? 종류만 말해줘도 좋아!"

# 출력 형식 (JSON)

반드시 다음 JSON 형식으로만 답변하세요:

{
  "task": "컵 1개만 씻기",
  "duration": 5,
  "reason": "에너지가 10%라서 가장 작은 단위로 쪼갰어"
}

- task: 제안하는 작업 (20자 이내)
- duration: 소요 시간 (분 단위, 정수)
- reason: 하나씨 말투로 이유 설명 (30자 이내)`;

// 전역으로 export
window.Constants = {
    ASSET_IDS,
    ASSET_NAMES,
    ASSET_EMOJI,
    ASSET_IMAGES,
    ROCK_LEVEL_THRESHOLDS,
    HEZ_CONFIG,
    ENERGY_LEVELS,
    TIMER_CONFIG,
    ANIMATION_CONFIG,
    SESSION_RECOVERY_TIMEOUT,
    TUTORIAL_CONFIG,
    ROCK_ZONES,
    ROLL_CONFIG,
    SQUISH_CONFIG,
    HEZ_DIRECTIONS,
    HANA_DIALOGUES,
    GEMINI_SYSTEM_INSTRUCTION
};
