import { useEffect, useRef, useState } from 'react';
import { LiquidGroup, LiquidCard } from './liquid/LiquidGroup';

interface WorkBrief {
  title: string;
  date: string;
  summary: string;
}

interface Props {
  eyebrow: string;
  title: string;
  latestLabel: string;
  musicLabel: string;
  codeLabel: string;
  music: WorkBrief | null;
  code: WorkBrief | null;
}

function PlayIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
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
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function CardBody({
  kind,
  label,
  work,
}: {
  kind: 'music' | 'code';
  label: string;
  work: WorkBrief;
}) {
  return (
    <div className={`fw-card fw-card-${kind}`}>
      <div className="fw-card-top">
        <span className="fw-chip">{label}</span>
        <span className="fw-date">{work.date}</span>
      </div>
      <h3>{work.title}</h3>
      <p>{work.summary}</p>
      <span className="fw-icon" aria-hidden="true">
        {kind === 'music' ? <PlayIcon /> : <ArrowIcon />}
      </span>
    </div>
  );
}

export default function FeaturedWorks({
  eyebrow,
  title,
  latestLabel,
  musicLabel,
  codeLabel,
  music,
  code,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 720);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="fw">
      <div className="fw-head">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>

      <div className="fw-stage" ref={stageRef} style={{ aspectRatio: '720 / 300' }}>
        <div className="fw-space" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
          <LiquidGroup
            k={34}
            cardRadius={26}
            cell={7}
            smooth={2}
            fill="var(--panel-strong)"
            className="fw-group"
          >
            <LiquidCard id="music" x={36} y={66} w={360} h={178} radius={26}>
              {music ? (
                <CardBody kind="music" label={`${musicLabel} · ${latestLabel}`} work={music} />
              ) : null}
            </LiquidCard>
            <LiquidCard id="code" x={336} y={104} w={348} h={136} radius={26}>
              {code ? (
                <CardBody kind="code" label={`${codeLabel} · ${latestLabel}`} work={code} />
              ) : null}
            </LiquidCard>
          </LiquidGroup>
        </div>
      </div>

      <div className="fw-simple">
        {music ? (
          <div className="fw-simple-card glass">
            <CardBody kind="music" label={`${musicLabel} · ${latestLabel}`} work={music} />
          </div>
        ) : null}
        {code ? (
          <div className="fw-simple-card glass">
            <CardBody kind="code" label={`${codeLabel} · ${latestLabel}`} work={code} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
