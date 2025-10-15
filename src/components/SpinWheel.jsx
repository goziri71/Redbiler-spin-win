import { useMemo, useRef, useState } from "react";

const SEGMENTS = [
  "AirPods",
  "Mouse",
  "Powerbank",
  "Mousepad",
  "Speaker",
  "Bottle",
  "Better luck next time",
  "Try again",
  "₦0",
];

const WIN_SEGMENTS = new Set([
  "AirPods",
  "Mouse",
  "Powerbank",
  "Mousepad",
  "Speaker",
  "Bottle",
]);

function getSegmentAngle(index, total) {
  // Rotate labels to the CENTER of each slice (not the boundary)
  return (360 / total) * (index + 0.5);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function SpinWheel({
  enforceThreeWinsPerTen = true,
  forceOutcome = "auto", // 'auto' | 'win' | 'lose'
  onResult,
}) {
  const total = SEGMENTS.length;
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const spinRef = useRef(null);

  // Schedule wins per 10 spins using predetermined indices per block
  const scheduleRef = useRef({
    spinsInBlock: 0,
    winsInBlock: 0,
    winIndices: null,
  });
  // Global wins cutoff counter (after 15 wins -> all lose)
  const globalWinsRef = useRef(0);

  function generateWinIndices() {
    const indices = new Set();
    while (indices.size < 2) {
      indices.add(randomInt(0, 9));
    }
    return indices; // values in [0..9]
  }

  const colors = useMemo(() => {
    // Revert to original vibe, but add a near-white highlight slice
    const palette = [
      "#ff0033", // red
      "#111111", // near black
      "#8a001a", // dark red
      "#2b2b2b", // dark gray (hash)
      "#acacac", // bright near-white highlight
    ];
    return Array.from({ length: total }, (_, i) => palette[i % palette.length]);
  }, [total]);

  function pickTargetIndex() {
    // Force outcome if requested
    if (forceOutcome !== "auto") {
      const wantWin = forceOutcome === "win";
      const candidates = SEGMENTS.map((s, i) => ({ i, s })).filter(({ s }) =>
        wantWin ? WIN_SEGMENTS.has(s) : !WIN_SEGMENTS.has(s)
      );
      const choice = candidates[randomInt(0, candidates.length - 1)];
      return choice?.i ?? 0;
    }

    // Global cutoff: after 15 wins, always lose
    if (globalWinsRef.current >= 15) {
      const pool = SEGMENTS.map((s, i) => ({ i, s })).filter(
        ({ s }) => !WIN_SEGMENTS.has(s)
      );
      const index = pool[randomInt(0, pool.length - 1)].i;
      return index;
    }

    // Enforce 2 wins per 10 spins
    if (enforceThreeWinsPerTen) {
      const { spinsInBlock } = scheduleRef.current;
      if (!scheduleRef.current.winIndices || spinsInBlock === 0) {
        scheduleRef.current.winIndices = generateWinIndices();
      }

      const mustWin = scheduleRef.current.winIndices.has(spinsInBlock);
      const pool = SEGMENTS.map((s, i) => ({ i, s })).filter(({ s }) =>
        mustWin ? WIN_SEGMENTS.has(s) : !WIN_SEGMENTS.has(s)
      );
      const index = pool[randomInt(0, pool.length - 1)].i;
      return index;
    }

    // Default random
    return randomInt(0, total - 1);
  }

  function spin() {
    if (isSpinning) return;
    setIsSpinning(true);

    const targetIndex = pickTargetIndex();
    const segmentAngle = 360 / total;
    const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);
    const baseTurns = 6; // number of full spins
    const current = ((rotation % 360) + 360) % 360;
    let deltaToTarget = targetAngle - current;
    deltaToTarget = ((deltaToTarget % 360) + 360) % 360;
    const finalRotation = baseTurns * 360 + deltaToTarget; // align precisely from current angle

    setRotation((prev) => prev + finalRotation);

    // Handle result after animation duration
    const durationMs = 3800;
    window.clearTimeout(spinRef.current);
    spinRef.current = window.setTimeout(() => {
      const result = SEGMENTS[targetIndex];

      // Update schedule
      scheduleRef.current.spinsInBlock += 1;
      if (WIN_SEGMENTS.has(result)) {
        scheduleRef.current.winsInBlock += 1;
        globalWinsRef.current += 1;
      }
      if (scheduleRef.current.spinsInBlock >= 10) {
        scheduleRef.current.spinsInBlock = 0;
        scheduleRef.current.winsInBlock = 0;
        scheduleRef.current.winIndices = null; // regenerate next block
      }

      setIsSpinning(false);
      onResult?.(result, WIN_SEGMENTS.has(result));
    }, durationMs);
  }

  const radius = 230;
  const center = { x: radius, y: radius };
  const sliceAngle = (2 * Math.PI) / total;
  const viewBox = `0 0 ${radius * 2} ${radius * 2}`;

  return (
    <div className="wheel-container">
      <div className="wheel-wrapper">
        <svg
          className="wheel"
          viewBox={viewBox}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {SEGMENTS.map((label, i) => {
            const startAngle = i * sliceAngle - Math.PI / 2;
            const endAngle = (i + 1) * sliceAngle - Math.PI / 2;
            const x1 = center.x + radius * Math.cos(startAngle);
            const y1 = center.y + radius * Math.sin(startAngle);
            const x2 = center.x + radius * Math.cos(endAngle);
            const y2 = center.y + radius * Math.sin(endAngle);
            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            const path = `M ${center.x} ${center.y} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            return (
              <g key={label}>
                <path d={path} fill={colors[i]} />
                <text
                  x={center.x}
                  y={center.y - radius * 0.5}
                  transform={`rotate(${getSegmentAngle(i, total)}, ${
                    center.x
                  }, ${center.y})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="segment-label vertical"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="pointer" />
      </div>

      <div className="controls">
        <button className="spin-btn" onClick={spin} disabled={isSpinning}>
          {isSpinning ? "Spinning..." : "Spin"}
        </button>
      </div>
    </div>
  );
}
