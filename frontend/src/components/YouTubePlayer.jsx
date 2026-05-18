import { useEffect, useRef, useState } from 'react';
import './YouTubePlayer.css';

/**
 * Loads the YouTube IFrame Player API exactly once across the app.
 * The API exposes itself as `window.YT` and calls
 * `window.onYouTubeIframeAPIReady` when ready.
 */
let apiPromise = null;
function loadYouTubeAPI() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.YT && typeof window.YT.Player === 'function') return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-yt-iframe-api]');
    if (!existing) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.defer = true;
      tag.dataset.ytIframeApi = 'true';
      tag.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
      document.head.appendChild(tag);
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') {
        try {
          previous();
        } catch {
          /* ignore previous handler error */
        }
      }
      resolve(window.YT);
    };
  });

  return apiPromise;
}

const STATE_LABEL = {
  '-1': 'Ready',
  0: 'Ended',
  1: 'Playing',
  2: 'Paused',
  3: 'Buffering',
  5: 'Cued',
};

function fmtSeconds(s) {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const total = Math.floor(s);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * <YouTubePlayer videoId="..." onComplete={fn} />
 *
 * Wraps the YouTube IFrame Player API in a React component.
 * - Auto-pauses when unmounted (so closing the modal stops audio).
 * - Tracks playback progress.
 * - Fires onComplete once when the video ends.
 */
export default function YouTubePlayer({ videoId, onComplete, autoplay = false, compact = false }) {
  const slotRef = useRef(null);
  const playerRef = useRef(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const [state, setState] = useState(-1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  // Keep the latest onComplete without retriggering the player effect.
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!videoId || !slotRef.current) return undefined;

    completedRef.current = false;
    setError(null);
    setState(-1);
    setTime(0);
    setDuration(0);

    // The YT API replaces the host element with an <iframe>. Create a fresh
    // child node every time so we can mount/unmount cleanly.
    const host = slotRef.current;
    host.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'yt-player-inner';
    host.appendChild(inner);

    let cancelled = false;
    let pollId = null;

    loadYouTubeAPI()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(inner, {
          videoId,
          playerVars: {
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            autoplay: autoplay ? 1 : 0,
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              try {
                setDuration(e.target.getDuration() || 0);
              } catch {
                /* ignore */
              }
            },
            onStateChange: (e) => {
              if (cancelled) return;
              setState(e.data);
              if (e.data === 1 /* playing */) {
                if (pollId == null) {
                  pollId = window.setInterval(() => {
                    try {
                      const p = playerRef.current;
                      if (!p) return;
                      setTime(p.getCurrentTime() || 0);
                      const d = p.getDuration() || 0;
                      if (d) setDuration(d);
                    } catch {
                      /* ignore */
                    }
                  }, 500);
                }
              } else if (pollId != null) {
                window.clearInterval(pollId);
                pollId = null;
              }
              if (e.data === 0 /* ended */ && !completedRef.current) {
                completedRef.current = true;
                try {
                  setTime(e.target.getDuration() || 0);
                } catch {
                  /* ignore */
                }
                onCompleteRef.current?.();
              }
            },
            onError: (e) => {
              if (cancelled) return;
              const codes = {
                2: 'Invalid video URL or ID.',
                5: 'HTML5 player error — try a different browser.',
                100: 'Video not found or marked private.',
                101: 'Video owner disabled embedding.',
                150: 'Video owner disabled embedding.',
              };
              setError(codes[e.data] || `Playback error (code ${e.data}).`);
            },
          },
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Could not load YouTube API');
      });

    return () => {
      cancelled = true;
      if (pollId != null) {
        window.clearInterval(pollId);
        pollId = null;
      }
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, autoplay]);

  const progress = duration > 0 ? Math.min(1, time / duration) : 0;
  const completed = state === 0 || progress >= 0.99;

  if (error) {
    return (
      <div className="yt-error" role="alert">
        <strong>Couldn't play video.</strong>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`yt-wrap ${compact ? 'yt-wrap-compact' : ''}`}>
      <div className="yt-frame">
        <div ref={slotRef} className="yt-slot" />
      </div>
      {!compact ? (
      <div className="yt-meta">
        <span className={`yt-state yt-state-${state}`}>
          <span className="yt-dot" aria-hidden="true" />
          {completed ? '✓ Watched' : STATE_LABEL[state] ?? 'Loading…'}
        </span>
        <div className="yt-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}>
          <div className="yt-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="yt-time">
          {fmtSeconds(time)} / {fmtSeconds(duration)}
        </span>
      </div>
      ) : null}
    </div>
  );
}
