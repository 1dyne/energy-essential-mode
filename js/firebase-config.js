/**
 * 에너지 긴축모드 - Firebase 설정
 *
 * ⚠️ 중요: 실제 사용 전에 아래 firebaseConfig를
 *    본인의 Firebase 프로젝트 설정으로 교체하세요!
 */

// Firebase 설정 (본인의 Firebase Console에서 가져오기)
const firebaseConfig = {
    apiKey: "AIzaSyChciTbYl0PM9y8Y90XCSk8GQfbJpQUBmc",
    authDomain: "energy-essential-mode.firebaseapp.com",
    projectId: "energy-essential-mode",
    storageBucket: "energy-essential-mode.firebasestorage.app",
    messagingSenderId: "542293198938",
    appId: "1:542293198938:web:39f716b92980257f277063",
    measurementId: "G-Z28F8DBH9E"
  };

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firebase 서비스 참조
const auth = firebase.auth();
const db = firebase.firestore();

// Firestore 설정 (오프라인 캐시 활성화)
db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('여러 탭이 열려 있어 오프라인 캐시를 사용할 수 없습니다.');
        } else if (err.code === 'unimplemented') {
            console.warn('브라우저가 오프라인 캐시를 지원하지 않습니다.');
        }
    });

/**
 * Gemini API 설정
 *
 * ⚠️ 보안 주의사항 (MVP):
 * 현재 클라이언트에서 직접 API 키를 사용하고 있습니다.
 * 프로덕션 배포 시에는 Cloud Functions로 전환해야 합니다.
 *
 * MVP 완화 방안:
 * 1. Google Cloud Console에서 API 키 제한 설정
 *    - Application restrictions → HTTP referrers
 *    - 허용 도메인: localhost:*, 127.0.0.1:*
 * 2. Quota 제한 설정 (하루 1,000 requests)
 */
const GEMINI_API_KEY = "AIzaSyCl86XIWYu2TxGdIeTeI2K0llA793qHoZw";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// API 설정
const API_CONFIG = {
    timeout: 10000,              // 10초
    retries: 3,                  // 3회 재시도
    retryDelay: [1000, 2000, 4000]  // Exponential backoff
};

/**
 * Firebase Auth 익명 로그인
 */
async function signInAnonymously() {
    try {
        const result = await auth.signInAnonymously();
        return result.user;
    } catch (error) {
        console.error('익명 로그인 실패:', error);
        throw error;
    }
}

/**
 * 현재 로그인된 사용자 가져오기
 */
function getCurrentUser() {
    return auth.currentUser;
}

/**
 * 인증 상태 변경 리스너
 */
function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}

/**
 * 로그아웃
 */
async function signOut() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('로그아웃 실패:', error);
        throw error;
    }
}

// 전역으로 사용 가능하게 export
window.FirebaseService = {
    auth,
    db,
    signInAnonymously,
    getCurrentUser,
    onAuthStateChanged,
    signOut,
    GEMINI_API_KEY,
    GEMINI_API_URL,
    API_CONFIG
};
