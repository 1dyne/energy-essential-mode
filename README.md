# 에너지 긴축모드 (Energy Essential Mode)

번아웃 방지를 위한 힐링 타이머 & 메타인지 대화 서비스

## 프로젝트 개요

**에너지 긴축모드**는 번아웃이 온 사용자가 캐릭터 "하나씨"와 함께 작은 할 일을 수행하며 무기력을 탈출할 수 있도록 돕는 모바일 최적화 웹 애플리케이션입니다.

### 핵심 기능

- 🌱 **AI 기반 작업 분해**: 사용자의 에너지 레벨에 맞춰 할 일을 작은 단위로 쪼개줍니다
- ⏱️ **힐링 타이머**: 하나씨와 함께 작업하며 에셋을 모읍니다
- 🪨 **바위 레벨 시스템**: 작업 시간에 따라 바위가 진화합니다
- 🎭 **캐릭터 상호작용**: 하나씨의 다양한 애니메이션과 대화

## 설정 방법

### 1. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. **Authentication** > 익명 로그인 활성화
3. **Firestore Database** 생성
4. 프로젝트 설정 > 앱 추가 > 웹 앱 등록
5. `js/firebase-config.js` 파일에 Firebase 설정 입력:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Firestore Security Rules

Firebase Console > Firestore > Rules에 다음 규칙 추가:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 초대 코드: 인증된 사용자만 읽기 가능
    match /inviteCodes/{codeId} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // 유저 데이터: 본인 것만 읽기/쓰기
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 3. 초대 코드 생성

Firestore에서 `inviteCodes` 컬렉션에 문서 추가:

```javascript
// 문서 ID: HANA-v1-001 (원하는 코드)
{
    used: false,
    createdAt: "2025-12-20",
    usedBy: ""
}
```

### 4. Gemini API 설정

1. [Google AI Studio](https://aistudio.google.com/)에서 API 키 발급
2. `js/firebase-config.js`에 API 키 입력:

```javascript
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
```

⚠️ **보안 주의**: MVP 단계에서는 클라이언트에서 직접 API 키를 사용합니다. 프로덕션 배포 시에는 Cloud Functions로 전환하세요.

### 5. 에셋 파일 추가

`assets/` 폴더에 다음 이미지 파일들을 추가해야 합니다:

**바위 (5개)**
- bg_lv1.png ~ bg_lv4.png
- bg_lv4_night.png

**하나씨 (11개)**
- hana_idle.png
- hana_jump_1.png ~ hana_jump_5.png
- hana_look_1.png ~ hana_look_4.png
- hana_spore.png

**에셋 (6개)**
- item_Adjustment_sprout.png
- item_Adjustment_flower.png
- item_Achivement_sprout_1.png
- item_Achivement_flower.png
- mini_hana_green.png
- mini_hana_pink_1.png

**Hez (3개)**
- mob_hez_1.png ~ mob_hez_3.png

**기타 (1개)**
- energy_title.png

## 실행 방법

### 로컬 개발

```bash
# 간단한 HTTP 서버 실행 (Python 3)
python -m http.server 8000

# 또는 Node.js의 http-server
npx http-server
```

http://localhost:8000 에서 확인

### 배포

Firebase Hosting 또는 Netlify, Vercel 등을 통해 배포 가능합니다.

## 프로젝트 구조

```
project/
├── index.html          # 메인 HTML
├── css/
│   ├── style.css       # 메인 스타일
│   └── animations.css  # 애니메이션
├── js/
│   ├── firebase-config.js  # Firebase 설정
│   ├── constants.js        # 상수 정의
│   ├── utils.js            # 유틸리티 함수
│   ├── animations.js       # 애니메이션 컨트롤러
│   ├── gemini.js           # Gemini AI 연동
│   └── app.js              # 메인 애플리케이션
└── assets/             # 이미지 에셋
```

## 테스트 모드 설정

`js/constants.js`에서 Hez 언락 시간 조정:

```javascript
const HEZ_CONFIG = {
    // MVP 테스트 설정 (5분)
    UNLOCK_TIME: 5,
    TEASER1_TIME: 2,
    TEASER2_TIME: 3,

    // 프로덕션 설정 (주석 해제하여 사용)
    // UNLOCK_TIME: 365,  // 6시간 5분
    // TEASER1_TIME: 30,
    // TEASER2_TIME: 60,
};
```

## 주요 화면

1. **로그인 화면**: 초대 코드 입력
2. **튜토리얼**: 이름 입력, 하나씨 소개, 30초 체험 타이머
3. **메인 화면**: 바위, 하나씨, 획득한 에셋 표시
4. **채팅 화면**: AI 작업 추천
5. **타이머 화면**: 실제 작업 수행
6. **설정/발자국**: 기록 확인, 설정 변경

## 라이선스

이 프로젝트는 개인 학습 및 MVP 테스트 목적으로 제작되었습니다.

---

Made with 💚 by 하나씨
