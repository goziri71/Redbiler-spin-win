import { useMemo, useRef, useState } from "react";

const SEGMENTS = [
  "Oops!!!",
  "Books and pen",
  "Powerbank",
  "Speaker",
  "Umbrella",
  "Bottle",
  "Keyboard",
  "Better luck next time",
];

const WIN_SEGMENTS = new Set([
  "Books and pen",
  "Powerbank",
  "Speaker",
  "Umbrella",
  "Bottle",
  "Keyboard",
]);

// Items that can only be won once
const ONE_TIME_WINS = new Set(["Powerbank", "Speaker"]);

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

  // Track total wins (max 15 per refresh)
  const globalWinsRef = useRef(0);
  // Track which one-time items have been won
  const wonOneTimeItemsRef = useRef(new Set());
  // Schedule 3 wins per 10 spins
  const scheduleRef = useRef({
    spinsInBlock: 0,
    winsInBlock: 0,
    winIndices: null, // Set of indices (0-9) that should be wins in this block
  });

  function generateWinIndices() {
    // Generate 3 random positions (0-9) for wins in the next 10 spins
    const indices = new Set();
    while (indices.size < 3) {
      indices.add(randomInt(0, 9));
    }
    return indices;
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
      // Get available win segments (excluding already won one-time items)
      const availableWins = SEGMENTS.filter(
        (s) =>
          WIN_SEGMENTS.has(s) &&
          (!ONE_TIME_WINS.has(s) || !wonOneTimeItemsRef.current.has(s))
      );
      const candidates = SEGMENTS.map((s, i) => ({ i, s })).filter(({ s }) =>
        wantWin
          ? availableWins.includes(s)
          : !WIN_SEGMENTS.has(s) ||
            (ONE_TIME_WINS.has(s) && wonOneTimeItemsRef.current.has(s))
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

    // Get available win segments (excluding already won one-time items)
    const availableWins = SEGMENTS.filter(
      (s) =>
        WIN_SEGMENTS.has(s) &&
        (!ONE_TIME_WINS.has(s) || !wonOneTimeItemsRef.current.has(s))
    );

    // If no wins available, always lose
    if (availableWins.length === 0) {
      const pool = SEGMENTS.map((s, i) => ({ i, s })).filter(
        ({ s }) => !WIN_SEGMENTS.has(s)
      );
      const index = pool[randomInt(0, pool.length - 1)].i;
      return index;
    }

    // Initialize or reset schedule for new block of 10 spins
    if (
      !scheduleRef.current.winIndices ||
      scheduleRef.current.spinsInBlock === 0
    ) {
      scheduleRef.current.winIndices = generateWinIndices();
    }

    // Check if this spin should be a win (based on schedule)
    const mustWin = scheduleRef.current.winIndices.has(
      scheduleRef.current.spinsInBlock
    );

    // Also check if we haven't reached 15 wins yet
    const canWin = globalWinsRef.current < 15 && availableWins.length > 0;

    if (mustWin && canWin) {
      // Pick a random available win segment
      const winSegment = availableWins[randomInt(0, availableWins.length - 1)];
      const winIndex = SEGMENTS.indexOf(winSegment);
      return winIndex;
    } else {
      // Choose a non-win segment
      const pool = SEGMENTS.map((s, i) => ({ i, s })).filter(
        ({ s }) => !WIN_SEGMENTS.has(s)
      );
      const index = pool[randomInt(0, pool.length - 1)].i;
      return index;
    }
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
      const isWin = WIN_SEGMENTS.has(result);

      // Track wins
      if (isWin) {
        globalWinsRef.current += 1;
        // Track one-time wins
        if (ONE_TIME_WINS.has(result)) {
          wonOneTimeItemsRef.current.add(result);
        }
      }

      // Update schedule tracking
      scheduleRef.current.spinsInBlock += 1;
      if (isWin) {
        scheduleRef.current.winsInBlock += 1;
      }

      // Reset after 10 spins
      if (scheduleRef.current.spinsInBlock >= 10) {
        scheduleRef.current.spinsInBlock = 0;
        scheduleRef.current.winsInBlock = 0;
        scheduleRef.current.winIndices = null; // Will regenerate on next spin
      }

      setIsSpinning(false);
      onResult?.(result, isWin);
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
