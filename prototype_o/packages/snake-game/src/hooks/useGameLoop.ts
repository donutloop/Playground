import { useEffect, useRef } from 'react';

export const useGameLoop = (callback: (delta: number) => void, fps: number = 60) => {
  const callbackRef = useRef(callback);
  const requestRef = useRef<number>();
  const deltaTimeRef = useRef(0);
  const lastTimeRef = useRef<number>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = () => {
    lastTimeRef.current = performance.now();
    const loop = (time: number) => {
      deltaTimeRef.current = time - lastTimeRef.current;
      if (deltaTimeRef.current >= 1000 / fps) {
        callbackRef.current(deltaTimeRef.current / 1000); // convert to seconds
        lastTimeRef.current = time;
      }
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
  };

  const stop = () => {
    cancelAnimationFrame(requestRef.current!);
  };

  return { start, stop };
};
