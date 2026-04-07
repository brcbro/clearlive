import os
import subprocess
import argparse
from pathlib import Path

def extract_frames(input_video, output_dir, fps=24, scale=1080, quality=80, format='webp'):
    """
    Extracts frames from a video folder using FFmpeg.
    """
    video_path = Path(input_video)
    video_name = video_path.stem
    target_dir = Path(output_dir) / video_name
    
    # Create target directory if it doesn't exist
    target_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Processing: {video_name}...")
    
    # FFmpeg command
    # -i: input file
    # -vf: video filters (fps and scale)
    # -q:v: quality (v:scale=1080:-1 means width=1080, height auto)
    # -fps: limit frame rate
    
    # Constructing the filter string
    vf_filters = [f"fps={fps}", f"scale={scale}:-1"]
    filter_str = ",".join(vf_filters)
    
    output_pattern = str(target_dir / "frame_%04d") + f".{format}"
    
    # Build command based on format
    if format == 'webp':
        cmd = [
            "ffmpeg",
            "-i", str(video_path),
            "-vf", filter_str,
            "-compression_level", "4",
            "-quality", str(quality),
            "-y",
            output_pattern
        ]
    else:
        cmd = [
            "ffmpeg",
            "-i", str(video_path),
            "-vf", filter_str,
            "-q:v", "2",
            "-y",
            output_pattern
        ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"Successfully exported frames for {video_name} to {target_dir}")
    except subprocess.CalledProcessError as e:
        print(f"Error extracting frames for {video_name}: {e.stderr}")

def main():
    parser = argparse.ArgumentParser(description="Convert videos to a high-performance frame sequence for web.")
    parser.add_argument("--input", default="input_videos", help="Directory containing input videos.")
    parser.add_argument("--output", default="public/assets/frames", help="Base directory for output frames.")
    parser.add_argument("--fps", type=int, default=24, help="Target frame rate (default: 24).")
    parser.add_argument("--scale", type=int, default=1080, help="Target width (default: 1080p).")
    parser.add_argument("--quality", type=int, default=80, help="Compression quality (1-100, default: 80).")
    parser.add_argument("--format", choices=["jpg", "webp"], default="webp", help="Output image format (default: webp).")
    
    args = parser.parse_args()
    
    input_base = Path(args.input)
    output_base = Path(args.output)
    
    if not input_base.exists():
        print(f"Input directory '{input_base}' not found. Please create it and add some videos.")
        # Create it anyway for convenience
        input_base.mkdir(parents=True, exist_ok=True)
        return

    # Supported video extensions
    video_extensions = {".mp4", ".mov", ".avi", ".webm", ".mkv"}
    
    videos = [f for f in input_base.iterdir() if f.suffix.lower() in video_extensions]
    
    if not videos:
        print(f"No video files found in '{input_base}'.")
        return
        
    print(f"Found {len(videos)} videos. Starting extraction...")
    
    for video in videos:
        extract_frames(
            input_video=video,
            output_dir=output_base,
            fps=args.fps,
            scale=args.scale,
            quality=args.quality,
            format=args.format
        )

if __name__ == "__main__":
    main()
