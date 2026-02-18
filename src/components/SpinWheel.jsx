import { useMemo, useRef, useState, useEffect } from "react";

const PRIZES = [
  { name: "Bottle", quantity: 12, isWin: true },
  { name: "Airpods", quantity: 6, isWin: true },
  { name: "Mouse", quantity: 10, isWin: true },
  { name: "Better Luck Next Time", isWin: false },
  { name: "Mousepad", quantity: 12, isWin: true },
  { name: "Speaker", quantity: 1, isWin: true },
  { name: "Notepad", quantity: 8, isWin: true },
  { name: "LED Light", quantity: 10, isWin: true },
  { name: "Power Bank", quantity: 2, isWin: true },
  { name: "Try Again", isWin: false },
];

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

// ====== CONTROL PANEL ======
// Change this to control spin outcomes:
//   "normal" = 50/50 chance of win or fail
//   "win"    = every spin lands on a prize
//   "fail"   = every spin lands on Better Luck / Try Again
const FORCE_MODE = "normal";
// ============================

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSegmentAngle(index, total) {
  return (360 / total) * (index + 0.5);
}

function getPrizeColor(name) {
  switch (name) {
    case "Speaker":
    case "Power Bank":
      return "gold";
    case "Airpods":
      return "green";
    case "Mouse":
    case "LED Light":
      return "blue";
    default:
      return "purple";
  }
}

const failIndices = PRIZES.map((_, i) => i).filter((i) => !PRIZES[i].isWin);

export default function SpinWheel({ onResult, onTimeUpdate }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [stock, setStock] = useState(() =>
    PRIZES.map((p) => (p.isWin ? p.quantity : null))
  );
  const spinRef = useRef(null);
  const timerRef = useRef(null);
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION_MS);

  const winIndices = PRIZES.map((_, i) => i).filter(
    (i) => PRIZES[i].isWin && stock[i] > 0
  );

  const total = PRIZES.length;

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) return 0;
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    onTimeUpdate?.(display);
  }, [timeRemaining, onTimeUpdate]);

  const timeUp = timeRemaining <= 0;

  const colors = useMemo(() => {
    const palette = [
      "#00acb4",
      "#393e46",
      "#f7931e",
      "#edeced",
      "#00acb4",
    ];
    return Array.from(
      { length: total },
      (_, i) => palette[i % palette.length]
    );
  }, [total]);

  function pickTargetIndex() {
    if (FORCE_MODE === "win" && winIndices.length > 0) {
      return winIndices[randomInt(0, winIndices.length - 1)];
    }

    if (FORCE_MODE === "fail" || winIndices.length === 0) {
      return failIndices[randomInt(0, failIndices.length - 1)];
    }

    // 50/50 coin flip, but only allow win if stock remains
    const pool = Math.random() < 0.5 ? winIndices : failIndices;
    return pool[randomInt(0, pool.length - 1)];
  }

  function spin() {
    if (isSpinning || timeUp) return;

    setIsSpinning(true);

    const targetIndex = pickTargetIndex();
    const segmentAngle = 360 / total;
    const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);
    const baseTurns = 6;
    const current = ((rotation % 360) + 360) % 360;
    let deltaToTarget = targetAngle - current;
    deltaToTarget = ((deltaToTarget % 360) + 360) % 360;
    const finalRotation = baseTurns * 360 + deltaToTarget;

    setRotation((prev) => prev + finalRotation);

    const durationMs = 3800;
    window.clearTimeout(spinRef.current);
    spinRef.current = window.setTimeout(() => {
      const prize = PRIZES[targetIndex];

      if (prize.isWin) {
        setStock((prev) => {
          const updated = [...prev];
          updated[targetIndex] = Math.max(0, updated[targetIndex] - 1);
          return updated;
        });
      }

      setIsSpinning(false);
      onResult?.(prize.name, getPrizeColor(prize.name), prize.isWin);
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
          {PRIZES.map((prize, i) => {
            const startAngle = i * sliceAngle - Math.PI / 2;
            const endAngle = (i + 1) * sliceAngle - Math.PI / 2;
            const x1 = center.x + radius * Math.cos(startAngle);
            const y1 = center.y + radius * Math.sin(startAngle);
            const x2 = center.x + radius * Math.cos(endAngle);
            const y2 = center.y + radius * Math.sin(endAngle);
            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            const path = `M ${center.x} ${center.y} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const textColor = colors[i] === "#edeced" ? "#393e46" : "#ffffff";

            return (
              <g key={i}>
                <path d={path} fill={colors[i]} />
                <text
                  x={center.x}
                  y={center.y - radius * 0.65}
                  transform={`rotate(${getSegmentAngle(i, total)}, ${center.x}, ${center.y})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={textColor}
                  className="segment-label vertical"
                >
                  {prize.name}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="pointer" />
      </div>

      <div className="controls">
        <button
          className="spin-btn"
          onClick={spin}
          disabled={isSpinning || timeUp}
        >
          {isSpinning ? "Spinning..." : timeUp ? "Time's Up" : "Spin"}
        </button>
      </div>
    </div>
  );
}
