import React, { useState, useEffect } from 'react';

export const TestPatterns: React.FC = () => {
  const [patterns, setPatterns] = useState<Array<{x: number, y: number}>>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMouseDown = () => {
    setIsDrawing(true);
    console.log('TEST: Mouse down - starting to draw');
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    console.log('TEST: Mouse up - stopped drawing');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDrawing) {
      const rect = e.currentTarget.getBoundingClientRect();
      const newPattern = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setPatterns(prev => [...prev, newPattern]);
      console.log('TEST: Added pattern, total:', patterns.length + 1);
    }
  };

  useEffect(() => {
    console.log('TEST: Patterns array updated, length:', patterns.length);
  }, [patterns]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, background: 'rgba(255,255,255,0.9)', padding: '10px' }}>
      <h3>Pattern Test</h3>
      <div>Patterns: {patterns.length}</div>
      <div>Drawing: {isDrawing ? 'YES' : 'NO'}</div>
      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{
          width: '200px',
          height: '200px',
          border: '2px solid black',
          position: 'relative',
          marginTop: '10px',
          cursor: 'crosshair'
        }}
      >
        {patterns.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x - 2,
              top: p.y - 2,
              width: '4px',
              height: '4px',
              background: 'red',
              borderRadius: '50%'
            }}
          />
        ))}
      </div>
      <button onClick={() => setPatterns([])}>Clear</button>
    </div>
  );
};