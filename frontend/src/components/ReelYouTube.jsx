import Icon from './Icon';
import { getYouTubeId } from '../utils/youtube';

/**
 * Reels: thumbnail + open on YouTube (many owners disable iframe embed).
 */
export default function ReelYouTube({ videoUrl, caption }) {
  const videoId = getYouTubeId(videoUrl);
  const watchUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : videoUrl;
  const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  return (
    <div className="reel-youtube">
      {thumb ? (
        <img className="reel-youtube-thumb" src={thumb} alt={caption || 'YouTube clip'} loading="lazy" />
      ) : (
        <div className="reel-youtube-thumb reel-youtube-thumb-empty" aria-hidden="true" />
      )}
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="reel-play-btn reel-youtube-play"
        aria-label="Watch on YouTube"
      >
        <Icon name="play" size={32} />
        <span className="reel-youtube-label">Watch on YouTube</span>
      </a>
    </div>
  );
}
