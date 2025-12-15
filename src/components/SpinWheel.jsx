import { useMemo, useRef, useState, useEffect } from "react";

// Prize distribution: 1M Naira total
const PRIZE_DISTRIBUTION = [
  300000, // 1x ₦300,000
  200000, // 1x ₦200,000
  100000, // 1x ₦100,000
  50000,  // 2x ₦50,000
  50000,
  20000,  // 15x ₦20,000
  20000,
  20000,
  20000,
  20000,
  20000,
  20000,
  20000,
  20000,
  20000,
  20000,
  20000,
  20000,
  20000,
  20000,
];

const TOTAL_GUESTS = 400;
const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatCurrency(amount) {
  return `₦${amount.toLocaleString()}`;
}

function getPrizeColor(amount) {
  if (amount >= 200000) return "gold"; // ₦300k, ₦200k
  if (amount >= 100000) return "green"; // ₦100k
  if (amount >= 50000) return "blue"; // ₦50k
  return "purple"; // ₦20k
}

function getSegmentAngle(index, total) {
  return (360 / total) * (index + 0.5);
}

export default function SpinWheel({
  currentSession = 1,
  onResult,
  onSessionEnd,
  onTimeUpdate,
}) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prizes, setPrizes] = useState([]); // Current session's prizes (scattered)
  const [wonPrizes, setWonPrizes] = useState(new Set()); // Track won prize indices
  const spinRef = useRef(null);
  const timerRef = useRef(null);
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION_MS);
  
  // Track won guests across both sessions (persists)
  const wonGuestsRef = useRef(new Set());

  // Initialize prizes for current session (reshuffled/scattered)
  useEffect(() => {
    const shuffledPrizes = shuffleArray(PRIZE_DISTRIBUTION);
    setPrizes(shuffledPrizes);
    setWonPrizes(new Set());
    setTimeRemaining(SESSION_DURATION_MS);
    setRotation(0);
  }, [currentSession]);

  // Update parent with time display
  useEffect(() => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    onTimeUpdate?.(display);
  }, [timeRemaining, onTimeUpdate]);

  // Session timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      onSessionEnd?.();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          onSessionEnd?.();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentSession, onSessionEnd]); // Only restart when session changes

  // Update parent with time display
  useEffect(() => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    onTimeUpdate?.(display);
  }, [timeRemaining, onTimeUpdate]);

  const total = prizes.length;
  const availablePrizes = prizes.filter((_, index) => !wonPrizes.has(index));
  const availableGuests = Array.from({ length: TOTAL_GUESTS }, (_, i) => i + 1).filter(
    (guestNum) => !wonGuestsRef.current.has(guestNum)
  );

  const colors = useMemo(() => {
    const palette = [
      "#00acb4", // primary teal
      "#393e46", // primary dark
      "#f7931e", // secondary orange
      "#edeced", // secondary light
      "#00acb4", // primary teal (repeat for variety)
    ];
    return Array.from({ length: total }, (_, i) => palette[i % palette.length]);
  }, [total]);

  function pickTargetIndex() {
    // Get all available prize indices (not won yet)
    const availableIndices = prizes
      .map((_, index) => index)
      .filter((index) => !wonPrizes.has(index));

    if (availableIndices.length === 0) {
      return 0; // Will be handled in spin function
    }

    // Pick a random available index
    const randomIndex = randomInt(0, availableIndices.length - 1);
    return availableIndices[randomIndex];
  }

  function spin() {
    if (isSpinning) return;
    
    // Check if prizes or guests are available
    if (availablePrizes.length === 0) {
      alert("All prizes have been won in this session!");
      return;
    }
    
    if (availableGuests.length === 0) {
      alert("All guests have already won!");
      return;
    }

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

    // Handle result after animation duration
    const durationMs = 3800;
    window.clearTimeout(spinRef.current);
    spinRef.current = window.setTimeout(() => {
      const prizeAmount = prizes[targetIndex];
      
      // Randomly select guest number from available guests
      const randomGuestIndex = randomInt(0, availableGuests.length - 1);
      const guestNumber = availableGuests[randomGuestIndex];

      // Mark prize as won
      setWonPrizes((prev) => new Set([...prev, targetIndex]));
      
      // Mark guest as won (persists across sessions)
      wonGuestsRef.current.add(guestNumber);

      setIsSpinning(false);
      
      // Call onResult with guest number, prize amount, and color
      onResult?.(guestNumber, prizeAmount, getPrizeColor(prizeAmount));
    }, durationMs);
  }

  const radius = 230;
  const center = { x: radius, y: radius };
  const sliceAngle = (2 * Math.PI) / total;
  const viewBox = `0 0 ${radius * 2} ${radius * 2}`;

  // Format time remaining
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="wheel-container">
        <div className="wheel-wrapper">
        <svg
          className="wheel"
          viewBox={viewBox}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {prizes.map((prizeAmount, i) => {
            const isWon = wonPrizes.has(i);
            const startAngle = i * sliceAngle - Math.PI / 2;
            const endAngle = (i + 1) * sliceAngle - Math.PI / 2;
            const x1 = center.x + radius * Math.cos(startAngle);
            const y1 = center.y + radius * Math.sin(startAngle);
            const x2 = center.x + radius * Math.cos(endAngle);
            const y2 = center.y + radius * Math.sin(endAngle);
            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            const path = `M ${center.x} ${center.y} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            
            return (
              <g key={`${i}-${prizeAmount}`}>
                <path
                  d={path}
                  fill={isWon ? colors[i] : colors[i]}
                  opacity={isWon ? 0.3 : 1}
                  className={isWon ? "won-segment" : ""}
                />
                <text
                  x={center.x}
                  y={center.y - radius * 0.75}
                  transform={`rotate(${getSegmentAngle(i, total)}, ${
                    center.x
                  }, ${center.y})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`segment-label vertical ${isWon ? "won-text" : ""}`}
                >
                  {formatCurrency(prizeAmount)}
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
          disabled={isSpinning || availablePrizes.length === 0 || availableGuests.length === 0}
        >
          {isSpinning
            ? "Spinning..."
            : availablePrizes.length === 0
            ? "All Prizes Won"
            : availableGuests.length === 0
            ? "All Guests Won"
            : "Spin"}
        </button>
      </div>
    </div>
  );
}
