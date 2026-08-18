'use client';

import { useState } from 'react';
import Pixeldrift from '@/components/originkit/ui/pixeldrift';

interface PixelDriftStageProps {
  replayLabel?: string;
}

const config = {
  text: 'lordestar',
  colors: ['#f5f7fa', '#f08a6f', '#7fc8c0', '#e8c176', '#b7a6f5', '#eda6c3'],
  mode: 'onEnter' as const,
  replay: true,
  position: 'middle' as const,
  particleSize: 8,
  particleCount: 46,
  mouseEnabled: true,
  mouseRadius: 45,
  mouseForce: 26,
  fontSize: 150,
  autoFit: true,
  transition: { type: 'tween' as const, duration: 1.4, ease: 'easeOut' },
};

export default function PixelDriftStage({ replayLabel = 'Replay' }: PixelDriftStageProps) {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <>
      <div className="pixel-drift-stage">
        <Pixeldrift key={replayKey} {...config} style={{ minWidth: 0, minHeight: 0 }} />
      </div>
      <button
        className="btn replay-btn"
        type="button"
        aria-label={replayLabel}
        onClick={() => setReplayKey((key) => key + 1)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        <span>{replayLabel}</span>
      </button>
    </>
  );
}
