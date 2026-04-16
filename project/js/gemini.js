/**
 * 에너지 긴축모드 - Gemini AI 연동
 */

const GeminiAPI = {
    /**
     * 작업 추천 요청
     */
    async getTaskSuggestion(energyLevel, taskList, userName) {
        const prompt = `
유저 이름: ${userName}
에너지 레벨: ${energyLevel}%
할 일 목록: ${taskList}

위 정보를 바탕으로 지금 바로 할 수 있는 작업 1개를 추천해줘.
JSON 형식으로 답변해.
`;

        try {
            const response = await this.callGeminiWithRetry(prompt);
            return this.parseResponse(response);
        } catch (error) {
            console.error('Gemini API 오류:', error);
            return this.getFallbackResponse(energyLevel, taskList);
        }
    },

    /**
     * 피드백 기반 재추천
     */
    async getRetryTaskSuggestion(energyLevel, taskList, previousTask, feedback, userName) {
        const prompt = `
유저 이름: ${userName}
에너지 레벨: ${energyLevel}%
할 일 목록: ${taskList}
이전 제안: ${previousTask}
유저 피드백: ${feedback}

유저가 이전 제안을 거부했어. 피드백을 고려해서 새로운 작업을 추천해줘.
JSON 형식으로 답변해.
`;

        try {
            const response = await this.callGeminiWithRetry(prompt);
            return this.parseResponse(response);
        } catch (error) {
            console.error('Gemini API 오류:', error);
            return this.getFallbackResponse(energyLevel, taskList, true);
        }
    },

    /**
     * 시간 조정된 작업
     */
    async getAdjustedTask(task, newDuration, energyLevel) {
        const prompt = `
현재 작업: ${task}
새로운 시간: ${newDuration}분
에너지 레벨: ${energyLevel}%

${newDuration}분에 맞게 작업 범위를 조정해줘.
JSON 형식으로 답변해.
`;

        try {
            const response = await this.callGeminiWithRetry(prompt);
            return this.parseResponse(response);
        } catch (error) {
            console.error('Gemini API 오류:', error);
            return {
                task: task,
                duration: newDuration,
                reason: `${newDuration}분으로 조정했어!`
            };
        }
    },

    /**
     * Gemini API 호출 (재시도 로직 포함)
     */
    async callGeminiWithRetry(prompt, retries = FirebaseService.API_CONFIG.retries) {
        const { GEMINI_API_URL, API_CONFIG } = FirebaseService;

        for (let i = 0; i < retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

                const response = await fetch(GEMINI_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: Constants.GEMINI_SYSTEM_INSTRUCTION + "\n\n" + prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.95,
                            maxOutputTokens: 500
                        }
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error.message);
                }

                return data;

            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);

                if (i === retries - 1) {
                    throw error;
                }

                // Exponential backoff
                const delay = API_CONFIG.retryDelay[i] || 4000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    },

    /**
     * 응답 파싱
     */
    parseResponse(response) {
        try {
            const rawText = response.candidates[0].content.parts[0].text;

            // Markdown 코드블록 제거
            const cleaned = rawText
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            const result = JSON.parse(cleaned);

            // 검증
            if (!result.task || !result.duration || !result.reason) {
                throw new Error('Invalid response format');
            }

            // 타입 강제 및 길이 제한
            result.duration = parseInt(result.duration);
            result.task = result.task.slice(0, 20);
            result.reason = result.reason.slice(0, 30);

            return result;

        } catch (error) {
            console.error('Parse error:', error);
            return {
                task: "잠깐 쉬기",
                duration: 5,
                reason: "하나씨가 멍 때렸어... 다시 해볼래?"
            };
        }
    },

    /**
     * Fallback 응답 (API 실패 시)
     */
    getFallbackResponse(energyLevel, taskList, isRetry = false) {
        const tasks = taskList.split(',').map(t => t.trim());
        const firstTask = tasks[0] || "숨쉬기";

        if (energyLevel === 10) {
            return {
                task: `${firstTask} 3분만`,
                duration: 3,
                reason: isRetry ? "알겠어! 이건 어때?" : "에너지가 낮아서 아주 짧게 해볼까?"
            };
        } else if (energyLevel === 50) {
            return {
                task: firstTask,
                duration: 10,
                reason: isRetry ? "다시 골라봤어!" : "이 정도면 괜찮을 것 같아!"
            };
        } else {
            return {
                task: firstTask,
                duration: 20,
                reason: isRetry ? "좋아, 이건 어때?" : "에너지가 충분하니 이 정도는 할 수 있어!"
            };
        }
    },

    /**
     * 에러 메시지 가져오기
     */
    getErrorMessage(error) {
        if (error.name === 'AbortError') {
            return Constants.HANA_DIALOGUES.ERROR.TIMEOUT;
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return Constants.HANA_DIALOGUES.ERROR.NETWORK;
        }
        if (error.message.includes('parse') || error.message.includes('JSON')) {
            return Constants.HANA_DIALOGUES.ERROR.PARSE_ERROR;
        }
        return Constants.HANA_DIALOGUES.ERROR.UNKNOWN;
    }
};

// 전역으로 export
window.GeminiAPI = GeminiAPI;
