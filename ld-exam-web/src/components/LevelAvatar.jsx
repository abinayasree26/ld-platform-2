import React from 'react';
import { getLevelAvatar, avatarImageUrl } from '../data/avatarSystem';

const LevelAvatar = ({ level, size = 56, locked = false, showBadge = true }) => {
  const info = getLevelAvatar(level);
  const ring = locked ? '#cbd5e1' : info.ring;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <img
        src={avatarImageUrl(info.seed, info.bg)}
        alt={info.title}
        title={info.title}
        style={{
          width: size, height: size, borderRadius: '50%', display: 'block', background: '#fff',
          border: `3px solid ${ring}`, boxShadow: locked ? 'none' : `0 0 0 3px ${ring}22`,
          filter: locked ? 'grayscale(1) opacity(0.5)' : 'none',
        }}
      />
      {showBadge && (
        <span
          style={{
            position: 'absolute', bottom: -2, right: -2, width: Math.max(16, size * 0.32), height: Math.max(16, size * 0.32),
            borderRadius: '50%', background: ring, color: '#fff', fontWeight: 800, fontSize: Math.max(9, size * 0.17),
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
          }}
        >
          {locked ? '🔒' : level}
        </span>
      )}
    </div>
  );
};

export default LevelAvatar;
