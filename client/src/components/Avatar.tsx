import React from 'react';
import { useSocket } from '../context/SocketContext';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  userId?: string | null;
  showStatus?: boolean;
  className?: string;
  onClick?: (() => void) | null;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User Avatar',
  size = 'md',
  userId = null,
  showStatus = false,
  className = '',
  onClick = null,
}) => {
  const { isUserOnline } = useSocket();
  const online = userId ? isUserOnline(userId) : false;

  const sizeMap = {
    sm: { width: 32, height: 32, dotSize: 8 },
    md: { width: 42, height: 42, dotSize: 10 },
    lg: { width: 56, height: 56, dotSize: 14 },
    xl: { width: 84, height: 84, dotSize: 18 },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const fallbackSrc = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(alt || 'Nexus')}`;

  return (
    <div
      className={`avatar-wrapper ${className}`}
      style={{
        width: currentSize.width,
        height: currentSize.height,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick || undefined}
    >
      <img
        src={src || fallbackSrc}
        alt={alt}
        className="avatar-img"
        style={{
          width: currentSize.width,
          height: currentSize.height,
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = fallbackSrc;
        }}
      />
      {showStatus && (
        <span
          className={`avatar-status-dot ${online ? 'online' : 'offline'}`}
          style={{
            width: currentSize.dotSize,
            height: currentSize.dotSize,
          }}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
