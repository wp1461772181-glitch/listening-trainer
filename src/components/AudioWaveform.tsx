import { useRef, useEffect, useState } from 'react';

interface AudioWaveformProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export default function AudioWaveform({ audioElement, isPlaying }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const source = ctx.createMediaElementSource(audioElement);
    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.8;
    source.connect(analyserNode);
    analyserNode.connect(ctx.destination);

    setAnalyser(analyserNode);

    return () => {
      ctx.close();
    };
  }, [audioElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barCount = 40;
      const barWidth = w / barCount;
      const gap = 2;

      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor((i / barCount) * bufferLength);
        const value = isPlaying ? dataArray[dataIdx] : 0;
        const barHeight = Math.max(4, (value / 255) * h);

        const x = i * barWidth + gap / 2;
        const y = (h - barHeight) / 2;
        const radius = barWidth / 2 - gap / 2;

        ctx.fillStyle = value > 150
          ? 'rgba(79, 70, 229, 0.9)'
          : value > 80
            ? 'rgba(79, 70, 229, 0.5)'
            : 'rgba(79, 70, 229, 0.15)';

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - gap, barHeight, radius);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyser, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={80}
      className="w-full h-20 rounded-xl"
    />
  );
}
