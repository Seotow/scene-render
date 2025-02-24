
var csInterface = new CSInterface();
document.getElementById("export-scene").addEventListener("click", function() {
    csInterface.evalScript("exportSelectedFrames()", function(response) {
        alert(response);
    });
});

// function updateSceneCount(count) {
//     document.getElementById("scene-count").textContent = count;
// }
  
//   // Gọi một lệnh evalScript để lấy số scene được chọn từ ExtendScript
// csInterface.evalScript("getSelectedVideo().length", function(response) {
//     updateSceneCount(response);
// });

// Sự kiện cho nút chuyển âm thanh thành text
document.getElementById("transcribe-audio-button").addEventListener("click", function() {
    csInterface.evalScript("exportSelectedScenesAudio()", function(response) {
        try {
            audioFiles = JSON.parse(response);
        } catch(e) {
            alert("Lỗi phân tích kết quả xuất file âm thanh.");
            return;
        }
        if (audioFiles.length === 0) {
            alert("Không có file âm thanh nào được xuất.");
            return;
        }
        
        // Lấy thư mục của file đầu tiên để lưu transcript.txt
        var firstFile = audioFiles[0];
        var pathParts = firstFile.split("\\");  // giả sử Windows; nếu Mac, dùng "/" thay cho "\\"
        pathParts.pop();
        var audioFolder = pathParts.join("\\");
        var outputTxtPath = audioFolder + "\\transcripts.txt";
        
        // Gọi Python script thông qua child_process
        const { exec } = require("child_process");
        // Xác định đường dẫn đến transcribe.py; từ CEP, chúng ta lấy đường dẫn extension rồi điều hướng tới thư mục python-speech
        var pythonScriptPath = csInterface.getSystemPath(SystemPath.EXTENSION) + "/python-speech/transcribe.py";
        
        // Đổi \\ trong đường dẫn thành / để phù hợp với lệnh chạy python Xây dựng lệnh chạy Python
        audioFiles = audioFiles.map(x => `'${x.replaceAll("\\", "/")}'`).join("|")
        outputTxtPath = outputTxtPath.replaceAll("\\", "/");
        var modelType = document.querySelector('input[name="model-type"]:checked').value;

        var command = `python "${pythonScriptPath}" "${audioFiles}" "${outputTxtPath}" "${modelType}"`;
        console.log("Command:", command);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Lỗi khi chạy Python script:", error);
                alert("Có lỗi trong quá trình chuyển giọng nói thành văn bản.");
                return;
            }
            console.log("Kết quả transcript:", stdout);
            // document.getElementById("transcript").textContent = stdout;
            alert("Chuyển đổi hoàn tất. Transcript được lưu vào: " + outputTxtPath);
        });
    });
});

// document.getElementById("test").addEventListener("click", function() {
//     csInterface.evalScript("getExtensionRootFolder()", function(res) {
//         alert(res);
//     })
// });