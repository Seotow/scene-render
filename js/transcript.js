// file: transcribe.js
const fs = require('fs');
const vosk = require('vosk');
const path = require('path');

const MODEL_PATH = "model"; // Thư mục chứa mô hình Vosk
const SAMPLE_RATE = 16000;

if (!fs.existsSync(MODEL_PATH)) {
    console.error("Vui lòng tải mô hình Vosk vào thư mục 'model'.");
    process.exit(1);
}

vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);

// Hàm chuyển đổi file âm thanh thành transcript
function transcribeAudioFile(filePath) {
    return new Promise((resolve, reject) => {
        const wfStream = fs.createReadStream(filePath, { highWaterMark: 4096 });
        const rec = new vosk.Recognizer({ model: model, sampleRate: SAMPLE_RATE });
        wfStream.on('data', (data) => {
            rec.acceptWaveform(data);
        });
        wfStream.on('end', () => {
            const result = rec.finalResult();
            rec.free();
            resolve(result.text);
        });
        wfStream.on('error', (err) => {
            rec.free();
            reject(err);
        });
    });
}

// Lấy đối số từ dòng lệnh (mảng JSON chứa đường dẫn file)
let audioFiles = process.argv[2];
if (!audioFiles) {
    console.error("Chưa truyền danh sách file âm thanh.");
    process.exit(1);
}
audioFiles = JSON.parse(audioFiles);

async function processScenes(files) {
    let transcripts = [];
    for (let i = 0; i < files.length; i++) {
        try {
            const transcript = await transcribeAudioFile(files[i]);
            transcripts.push(`Scene ${i+1}: ${transcript}`);
            console.log(`Scene ${i+1} transcript: ${transcript}`);
        } catch (err) {
            console.error(`Lỗi xử lý ${files[i]}:`, err);
            transcripts.push(`Scene ${i+1}: Error`);
        }
    }
    // Ghi transcript vào file TXT (ví dụ: "transcripts.txt" trong thư mục của file audio đầu tiên)
    let outputPath = path.join(path.dirname(files[0]), "transcripts.txt");
    fs.writeFileSync(outputPath, transcripts.join("\n"), 'utf8');
    console.log(`Transcript saved to: ${outputPath}`);
    // In transcript ra stdout để CEP lấy về
    console.log(transcripts.join("\n"));
}

processScenes(audioFiles).catch(console.error);
