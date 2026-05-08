import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import './pageLayout.css';

export default function NotFound() {
  return (
    <div className="stack fade-up text-center" style={{ maxWidth: 520, margin: '4rem auto 0', alignItems: 'center' }}>
      <p
        style={{
          fontSize: 'clamp(4rem, 12vw, 7rem)',
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.05em',
          margin: 0,
          background: 'linear-gradient(135deg, #ffd478, #e23e57)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        404
      </p>
      <h1 className="page-title">Off the mat</h1>
      <p className="page-lead" style={{ textAlign: 'center' }}>
        That route doesn't exist. Head back home and pick a different round.
      </p>
      <Link className="btn btn-primary" to="/">
        <Icon name="arrowRight" size={16} style={{ transform: 'rotate(180deg)' }} />
        Return home
      </Link>
    </div>
  );
}
