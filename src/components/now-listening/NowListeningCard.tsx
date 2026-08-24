'use client';

import { useEffect, useRef } from 'react';
import { FOILS, Follow, Kick, Orientation, applyFoil, applyFrame, fromPointer } from './engine';
import './holo.css';

/**
 * "最近在听"Holo 全息卡。
 *
 * 移植自 "Holo" 身份卡：卡片随指针/手机倾斜转动，多层全息箔片滑动干涉，
 * 封面瓦片双色调翻转。灰白打印面 + 专辑封面 + 歌名/歌手。
 */

export interface NowListeningSong {
  title: string;
  artist: string;
  cover: string;
  songUrl: string;
  dateLabel?: string;
}

interface Props {
  song: NowListeningSong;
  /** 点击卡片跳转（听歌日记页）；默认网易云链接 */
  diaryHref?: string;
  /** 卡片标签（如"最近在听"） */
  label?: string;
}

/** 无封面时的占位瓦片（渐变唱片）。 */
const PLACEHOLDER_TILE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%233a4a5c'/%3E%3Cstop offset='55%25' stop-color='%232b3949'/%3E%3Cstop offset='56%25' stop-color='%231b2530'/%3E%3Cstop offset='100%25' stop-color='%232b3949'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='150' cy='150' r='150' fill='url(%23g)'/%3E%3Ccircle cx='150' cy='150' r='36' fill='%23f6f7f9'/%3E%3Ccircle cx='150' cy='150' r='22' fill='%23e4e7ed'/%3E%3C/svg%3E`;

export default function NowListeningCard({ song, diaryHref, label }: Props) {
  const hostRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 显示固定一个材质（holo），卡片是展示物而非材质切换器
  const foil = FOILS[0];

  useEffect(() => {
    if (cardRef.current) {
      applyFoil(cardRef.current, foil, song.cover || PLACEHOLDER_TILE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.cover]);

  useEffect(() => {
    const host = hostRef.current;
    const card = cardRef.current;
    if (!host || !card) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 两个不同刚度的跟随器：卡片快、箔片慢 → 材质滞后
    const tilt = new Follow(0.16);
    const sheet = new Follow(0.09);
    const kick = new Kick();
    const t0 = performance.now();

    let raf = 0;
    let running = false;
    let onScreen = false;
    let hidden = false;
    let idle = 0;
    let touched = false;
    let release = 1;
    let handoff = { x: 0, y: 0 };
    let grab = 1;
    let grabFrom = { x: 0, y: 0 };
    let aim = { x: 0, y: 0 };

    const frame = () => {
      raf = 0;

      if (!touched) {
        // 静止时的慢漂移（两个互质速率，不重复）
        idle += 0.0042;
        const drift = { x: Math.sin(idle) * 0.28, y: Math.cos(idle * 0.73) * 0.2 };
        release = Math.min(1, release + 0.016);
        const k = release * release;
        tilt.target = {
          x: handoff.x + (drift.x - handoff.x) * k,
          y: handoff.y + (drift.y - handoff.y) * k,
        };
      }

      if (touched) {
        grab = Math.min(1, grab + 0.018);
        const k = grab * grab;
        tilt.target = {
          x: grabFrom.x + (aim.x - grabFrom.x) * k,
          y: grabFrom.y + (aim.y - grabFrom.y) * k,
        };
      }

      const k = kick.step();
      if (k.x || k.y) {
        tilt.target = { x: tilt.target.x + k.x, y: tilt.target.y + k.y };
      }

      tilt.step();
      sheet.target = tilt.value;
      sheet.step();

      applyFrame(card, tilt.value, sheet.value, foil, foil, {
        speed: sheet.speed,
        velocity: sheet.velocity,
        time: (performance.now() - t0) / 1000,
      });

      if (
        running &&
        (!touched || release < 1 || grab < 1 || kick.active || !tilt.settled || !sheet.settled)
      ) {
        raf = requestAnimationFrame(frame);
      }
    };

    const wake = () => {
      if (!running || raf) return;
      raf = requestAnimationFrame(frame);
    };

    const onPointer = (e: PointerEvent) => {
      if (reduced) return;
      aim = fromPointer(host.getBoundingClientRect(), e.clientX, e.clientY);
      if (!touched) {
        touched = true;
        grabFrom = { x: tilt.value.x, y: tilt.value.y };
        grab = 0;
      }
      release = 0;
      wake();
    };

    const onLeave = () => {
      touched = false;
      handoff = { x: tilt.value.x, y: tilt.value.y };
      release = 0;
      grab = 1;
      kick.fire(tilt.velocity);
      wake();
    };

    const sync = () => {
      const should = onScreen && !hidden && !reduced;
      if (should === running) return;
      running = should;
      if (should) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es.some((e) => e.isIntersecting);
        sync();
      },
      { rootMargin: '200px' },
    );
    io.observe(host);

    const onVis = () => {
      hidden = document.hidden;
      sync();
    };
    document.addEventListener('visibilitychange', onVis);

    // 陀螺仪：Android 直接生效；iOS 需用户手势授权，未授权则退回静止漂移
    const orient = new Orientation();
    const onOrient = (e: DeviceOrientationEvent) => {
      if (reduced) return;
      const v = orient.read(e);
      if (!v) return;
      touched = true;
      tilt.target = v;
      wake();
    };

    host.addEventListener('pointermove', onPointer);
    host.addEventListener('pointerleave', onLeave);
    window.addEventListener('deviceorientation', onOrient);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      host.removeEventListener('pointermove', onPointer);
      host.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('deviceorientation', onOrient);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <a
      ref={hostRef}
      className="nl-holo-host"
      href={diaryHref || song.songUrl || '#'}
      target={diaryHref ? undefined : song.songUrl ? '_blank' : undefined}
      rel={diaryHref ? undefined : 'noreferrer'}
      aria-label={`最近在听：${song.title} - ${song.artist}`}
    >
      <div ref={cardRef} className="nl-holo-card">
        {/* 打印面（固定灰白） */}
        <div className="nl-holo-body" />
        {/* 全息箔片：三层通用槽位，材质由引擎写入 */}
        <div className="nl-holo-foil" />
        <div className="nl-holo-foil--b" />
        <div className="nl-holo-foil--c" />
        {/* 速度拖影 / 甜点高光 / 噪点 / 眩光 / 反光 */}
        <div className="nl-holo-smear" />
        <div className="nl-holo-spot" />
        <div className="nl-holo-noise" />
        <div className="nl-holo-glare" />
        <div className="nl-holo-sheen" />

        {/* 内容：文字在箔片之上 */}
        <div className="nl-holo-content">
          <div className="nl-holo-text">
            {label && <p className="nl-holo-label">{label}</p>}
            <p className="nl-holo-name">{song.title}</p>
            <p className="nl-holo-artist">{song.artist}</p>
            {song.dateLabel && <p className="nl-holo-date">{song.dateLabel}</p>}
          </div>

          {/* 封面瓦片：正片 + 反向片（倾斜时扫入） */}
          <div className="nl-holo-tile">
            <div className="nl-holo-tile__photo" />
            <div className="nl-holo-tile__photo--neg" />
            <div className="nl-holo-tile__duo" />
            <div className="nl-holo-tile__tone" />
            <div className="nl-holo-tile__foil" />
            <div className="nl-holo-tile__grain" />
            <div className="nl-holo-tile__vignette" />
            <div className="nl-holo-tile__gloss" />
          </div>
        </div>
      </div>
    </a>
  );
}
