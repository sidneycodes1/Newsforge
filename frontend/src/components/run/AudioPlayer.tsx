"use client";

import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import { Card } from "@frontend/components/ui/card";
import { formatCountdown } from "@shared/utils/format";

function formatTime(seconds: number) {
  return formatCountdown(seconds);
}

function waveformBars() {
  return Array.from({ length: 40 }, (_, index) => 10 + ((index * 17) % 40));
}

export default function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const waveform = useMemo(waveformBars, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    await audio.play();
    setPlaying(true);
  };

  const seek = (event: MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track || duration <= 0) return;

    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio.currentTime = duration * ratio;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="border-[#222222] bg-[#111111] p-4">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
            playing
              ? "border-[#F5C518] bg-[#F5C518] text-black"
              : "border-[#F5C518] bg-transparent text-[#F5C518]"
          }`}
          aria-label={playing ? "Pause audio" : "Play audio"}
        >
          {playing ? "||" : ">"}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <div
            ref={trackRef}
            onClick={seek}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                const audio = audioRef.current;
                if (!audio) return;
                void audio.play();
                setPlaying(true);
              }
            }}
            className="cursor-pointer rounded-[6px] border border-[#222222] bg-[#0A0A0A] px-2 py-2"
            role="button"
            tabIndex={0}
          >
            <div className="relative flex h-8 items-end gap-1">
              <div
                className="absolute inset-y-0 left-0 bg-[#F5C518]"
                style={{ width: `${progress}%` }}
              />
              {waveform.map((height, index) => (
                <span
                  key={index}
                  className="relative z-10 w-1 rounded-[2px] bg-[#333333]"
                  style={{
                    height: `${height}%`,
                    backgroundColor:
                      progress > (index / waveform.length) * 100 ? "#F5C518" : "#333333",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between font-mono text-[12px] text-[#666666]">
            <span>{formatTime(Math.floor(currentTime))}</span>
            <span>{formatTime(Math.floor(duration || 0))}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
