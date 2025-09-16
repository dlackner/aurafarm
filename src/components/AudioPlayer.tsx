import React, { useEffect, useRef, useState } from 'react';

export const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      // Don't autoplay - let user start it
    }
  }, []);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="audio-controls">
      <audio
        ref={audioRef}
        loop
      >
        {/* Using a free, open source relaxing track */}
        <source src="https://cdn.freesound.org/previews/517/517833_11261513-lq.mp3" type="audio/mpeg" />
        {/* Fallback to a simple tone if main track doesn't load */}
        Your browser does not support the audio element.
      </audio>
      <button onClick={togglePlayPause} className="mute-button" title="Play/Pause Music">
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      <button onClick={toggleMute} className="mute-button" title="Mute/Unmute">
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );
};