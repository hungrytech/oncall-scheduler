import fs from 'fs';
import path from 'path';
import {fileURLToPath} from "url";
import ky from 'ky';

interface OnCallPair {
    first: string;
    second: string;
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const webhookUrl: string = process.env.WEBHOOK_URL || '';

const members = ['A', 'B', 'C', 'D', 'E'];
const stateFilePath = path.join(__dirname, '../.state.json');

/**
 * 상태 파일에서 현재 인덱스를 읽어오는 함수
 */
function loadState(): OnCallPair {
    console.log(`${stateFilePath}`);
    if (!fs.existsSync(stateFilePath)) {
        throw new Error('state.json 파일이 존재하지 않습니다.');
    }
    const data = fs.readFileSync(stateFilePath, 'utf-8');
    return JSON.parse(data)
}

/**
 * 상태 파일에 현재 인덱스를 저장하는 함수
 */
function saveState(pair: OnCallPair): void {
    fs.writeFileSync(stateFilePath, JSON.stringify(pair), 'utf-8');
}

/**
 * 다음 페어를 가져오는 함수
 */
function getNextPair(currentPair: OnCallPair, windowSize: number = 2): OnCallPair {
    const nextIndex = members.indexOf(currentPair.second) + 1;
    const [first, second] = Array.from({length: windowSize}, (_, i) => members[(nextIndex + i) % members.length]);
    return {first, second};
}

/**
 * Slack으로 메시지를 보내는 함수
 */
async function sendToSlack(): Promise<void> {
    const nextPair = getNextPair(loadState());

    const payload = {
        text: `요번주 페어는: <@${nextPair.first}> & <@${nextPair.second}> 입니다!`,
    };

    try {
        await ky.post(webhookUrl, {json: payload})
        console.log(`메시지 전송 성공: ${nextPair.first} & ${nextPair.second}`);

        saveState(nextPair);
    } catch (error) {
        console.error(`메시지 전송 실패: ${(error as Error).message}`);
        throw error;
    }
}

// 실행
(async () => {
    await sendToSlack();
})();
