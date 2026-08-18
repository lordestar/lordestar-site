import {
  Children,
  isValidElement,
  useMemo,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { LiquidEngine, DEFAULT_PARAMS, type LiquidBox } from './engine';
import type { Bridge } from './sdf';

export interface LiquidCardProps {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function LiquidCard(props: LiquidCardProps) {
  const { x, y, w, h, className, style, children } = props;
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface LiquidGroupProps {
  children: ReactNode;
  k?: number;
  cardRadius?: number;
  cell?: number;
  smooth?: number;
  bridges?: { from: string; to: string; width?: number }[];
  fill?: string;
  fillStyle?: CSSProperties;
  className?: string;
  style?: CSSProperties;
  viewTransitionName?: string;
}

type CardEl = ReactElement<LiquidCardProps>;

function isLiquidCard(node: ReactNode): node is CardEl {
  return isValidElement(node) && (node.props as LiquidCardProps).id !== undefined;
}

export function LiquidGroup({
  children,
  k = DEFAULT_PARAMS.k,
  cardRadius = 26,
  cell = DEFAULT_PARAMS.cell,
  smooth = DEFAULT_PARAMS.smooth,
  bridges = [],
  fill = 'var(--panel-strong)',
  fillStyle,
  className,
  style,
  viewTransitionName,
}: LiquidGroupProps) {
  const cards = useMemo(() => Children.toArray(children).filter(isLiquidCard), [children]);

  const { d, viewBox, skinStyle } = useMemo(() => {
    const boxes: LiquidBox[] = cards.map((c) => {
      const p = c.props;
      return {
        id: p.id,
        cx: p.x + p.w / 2,
        cy: p.y + p.h / 2,
        hw: p.w / 2,
        hh: p.h / 2,
        r: p.radius ?? cardRadius,
      };
    });
    const byId = new Map(boxes.map((b) => [b.id, b]));
    const capsules: Bridge[] = [];
    for (const br of bridges) {
      const a = byId.get(br.from);
      const b = byId.get(br.to);
      if (!a || !b) continue;
      capsules.push({
        kind: 'bridge',
        ax: a.cx,
        ay: a.cy,
        bx: b.cx,
        by: b.cy,
        r: br.width ? br.width / 2 : Math.min(a.hh, b.hh) * 0.5,
      });
    }

    const engine = new LiquidEngine();
    engine.setBoxes(boxes);
    engine.setBridges(capsules);
    engine.setParams({ k, cell, smooth });
    const path = engine.compute();

    return {
      d: path.d,
      viewBox: `${path.minX} ${path.minY} ${path.width} ${path.height}`,
      skinStyle: {
        position: 'absolute' as const,
        left: path.minX,
        top: path.minY,
        width: path.width,
        height: path.height,
        overflow: 'visible' as const,
        pointerEvents: 'none' as const,
      },
    };
  }, [cards, k, cardRadius, cell, smooth, bridges]);

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <svg aria-hidden viewBox={viewBox} style={{ ...skinStyle, viewTransitionName, ...fillStyle }}>
        <path d={d} fill={fill} />
      </svg>
      {cards}
    </div>
  );
}
