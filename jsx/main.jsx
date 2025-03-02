
function getExtensionRootFolder() {
    return File($.fileName).parent.fsName + '\\CEP\\extensions\\scene-render';
}

// Hàm lấy danh sách các clip video đang được chọn
function getSelectedVideo() {
    var selected = [];
    var seq = app.project.activeSequence;
    if (!seq) {
        alert("Không tìm thấy sequence hoạt động!");
        return selected;
    }
    
    var videoTracks = seq.videoTracks;
    for (var i = 0; i < videoTracks.numTracks; i++) {
        var videoTrack = videoTracks[i];
        var videoClips = videoTrack.clips;
        for (var j = 0; j < videoClips.numItems; j++) {
            var videoClip = videoClips[j];
            if (videoClip.isSelected()) {
                selected.push(videoClip);
            }
        }
    }
    return selected;
}

// Hàm xuất frame tại thời điểm bắt đầu của mỗi clip đã chọn
function exportSelectedFrames() {
    var selectedClips = getSelectedVideo();
    if (selectedClips.length === 0) {
        alert("Không có scene nào được chọn!");
        return false;
    }
    // Chọn thư mục lưu file
    var outputFolder = Folder.selectDialog("Chọn thư mục lưu ảnh xuất");
    if (!outputFolder) {
        alert("Chưa chọn thư mục lưu!");
        return false;
    }
    
    var seq = app.project.activeSequence;
    var seqSettings = seq.getSettings();
    
    // Lặp qua từng clip đã chọn
    for (var i = 0; i < selectedClips.length; i++) {
        var clip = selectedClips[i];

        // Lấy thời điểm bắt đầu của clip (là một đối tượng Time)
        var startTime = clip.start;
        
        // Chuyển đổi sang chuỗi timecode theo định dạng "HH:MM:SS:FF"
        var timeStr = startTime.getFormatted(seqSettings.videoFrameRate, seq.videoDisplayFormat);
        
        // Tạo tên file đầu ra (ví dụ: scene_1.png, scene_2.png, ...)
        var sep = Folder.fs === "Windows" ? "\\" : "/";
        var outputFile = outputFolder.fsName + sep + seq.name + "_" + (i + 1) + ".png";
        
        // Gọi hàm exportFramePNG của QE DOM để xuất frame
        var result = qe.project.getActiveSequence().exportFramePNG(timeStr, outputFile);
        
        if (result) {
            $.writeln("Xuất frame thành công tại " + timeStr + " -> " + outputFile);
        } else {
            $.writeln("Lỗi khi xuất frame tại " + timeStr);
        }
        
    }
    
    alert("Xuất ảnh cho " + selectedClips.length + " scene hoàn tất!");
    return true;
}

function exportSelectedScenesAudio() {
    var selectedClips = getSelectedVideo();
    if (selectedClips.length === 0) {
        alert("Không có scene nào được chọn!");
        return "[]";
    }
    
    var outputFolder = Folder.selectDialog("Chọn thư mục lưu âm thanh xuất");
    if (!outputFolder) {
        alert("Chưa chọn thư mục lưu!");
        return "[]";
    }

    var seq = app.project.activeSequence;
    var audioFiles = [];
    
    var extensionRoot = getExtensionRootFolder();
    var presetAudioPath = extensionRoot + "\\config\\WavPreset.epr";
    var workAreaType = 1;
    // Giả sử ta sử dụng encodeSequence để xuất audio cho mỗi scene
    for (var i = 0; i < selectedClips.length; i++) {
        var clip = selectedClips[i];
        
        var inPoint = clip.start.seconds;
        var outPoint = clip.end.seconds;
        
        seq.setInPoint(inPoint);
        seq.setOutPoint(outPoint);

        var sep = Folder.fs === "Windows" ? "\\" : "/";
        var outputPath = outputFolder.fsName + sep + "scene_" + (i + 1) + ".wav";
        // workAreaType Description
        // 0 Renders the entire sequence.
        // 1 Renders between the in and out point of the sequence.
        // 2 Renders the work area of the sequence.
        // Gọi hàm xuất file với preset đã định: wav 16kHz 16bit mono
        
        var result = seq.exportAsMediaDirect(outputPath, presetAudioPath, workAreaType);
        if (result) {
            audioFiles.push(outputPath);
            $.writeln("Xuất âm thanh cho scene " + i + " thành công -> " + outputPath);
        } else {
            $.writeln("Lỗi khi xuất âm thanh cho scene " + i);
        }
    
    }
    // Trả về mảng file âm thanh dưới dạng JSON string để CEP JS xử lý
    return JSON.stringify(audioFiles);
}



function isDuplicate(newImagePath, index) {
    // Nếu là ảnh đầu tiên, không có ảnh để so sánh nên không phải duplicate
    if (index === 0) return false;
    
    // Xác định đường dẫn của ảnh trước đó đã được lưu
    var prevImagePath = Folder.userData.fsName + "/SceneRender/scene_" + (index - 1) + ".png";
    var prevFile = new File(prevImagePath);
    var newFile = new File(newImagePath);
    
    // Nếu ảnh trước không tồn tại, không thể so sánh => không duplicate
    if (!prevFile.exists) return false;
    
    // So sánh kích thước file như một cách kiểm tra sơ bộ (có thể tinh chỉnh thêm nếu cần so sánh pixel chi tiết hơn)
    var prevSize = prevFile.length;
    var newSize = newFile.length;
    
    // Tính phần trăm khác biệt giữa kích thước (threshold 5%)
    var diff = Math.abs(prevSize - newSize) / Math.max(prevSize, newSize);
    return diff < 0.05;
}