import React, { useEffect, useRef, useState } from 'react';

export const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(err => {
        console.log('Autoplay blocked, user interaction required');
      });
    }
  }, []);

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
        src="https://cdn.pixabay.com/audio/2022/10/18/audio_c3e250ff76.mp3"
      />
      <button onClick={toggleMute} className="mute-button">
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );
};