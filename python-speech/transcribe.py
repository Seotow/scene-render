# python-speech/transcribe.py

import sys
import json
import os
import whisper


def main():
    if len(sys.argv) < 3:
        print("Usage: python transcribe.py <audio_file1|audiofile2|audiofile..> <output_txt_path> <model_type>")
        sys.exit(1)
    
    audio_files = sys.argv[1]
    output_txt_path = sys.argv[2]
    model_type = sys.argv[3]

    # audio_files = '["E:/Footage/scene_1.wav","E:/Footage/scene_2.wav","E:/Footage/scene_3.wav","E:/Footage/scene_4.wav"]'
    # output_txt_path = 'E:/transcripts.txt'

    # Xử lý chuỗi
    audio_files = [path.strip("'") for path in audio_files.split("|")]
    
    # try:
    #     audio_files = json.loads(audio_files)
    # except Exception as e:
    #     print("Error parsing JSON:", str(e))
    #     sys.exit(1)
    
    # Load model Whisper (model 'base' có thể thay đổi theo nhu cầu)
    model = whisper.load_model(model_type)
    
    transcripts = []
    
    for index, audio_file in enumerate(audio_files, start=1):
        try:
            result = model.transcribe(audio_file)
            transcript_line = result.get("text", "").strip()
        except Exception as e:
            transcript_line = "Error processing file"
            print(f"Error transcribing {audio_file}: {e}", file=sys.stderr)
        transcript_line = f"{index}: {transcript_line}"
        transcripts.append(transcript_line)

        # Xóa file âm thanh sau khi xử lý
        try:
            os.remove(audio_file)
        except Exception as e:
            print(f"Error deleting file {audio_file}: {e}", file=sys.stderr)
    
    # Ghi transcript vào file TXT: mỗi file âm thanh là một dòng
    try:
        with open(output_txt_path, "w", encoding="utf-8") as f:
            for line in transcripts:
                f.write(line + "\n\n")
        print("Transcript saved to:", output_txt_path)
    except Exception as e:
        print("Error writing transcript file:", e)
    
    # In transcript ra stdout (để CEP hiển thị)
    # for line in transcripts:
    #     print(line)


if __name__ == '__main__':
    main()
