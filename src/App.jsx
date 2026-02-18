import { useState, useRef } from "react";
import "./App.css";
import SpinWheel from "./components/SpinWheel";
import LandingPage from "./components/LandingPage";
import BeamerLogo from "./components/BeamerLogo";

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [timeDisplay, setTimeDisplay] = useState("10:00");
  const [celebrate, setCelebrate] = useState({
    show: false,
    prizeName: null,
    prizeColor: null,
    isWin: false,
  });

  const celebrateTimeoutRef = useRef(null);

  function handleResult(prizeName, prizeColor, isWin) {
    if (celebrateTimeoutRef.current) {
      clearTimeout(celebrateTimeoutRef.current);
      celebrateTimeoutRef.current = null;
    }

    setCelebrate({
      show: true,
      prizeName,
      prizeColor,
      isWin,
    });
  }

  function handleCloseCelebration() {
    if (celebrateTimeoutRef.current) {
      clearTimeout(celebrateTimeoutRef.current);
      celebrateTimeoutRef.current = null;
    }

    setCelebrate({
      show: false,
      prizeName: null,
      prizeColor: null,
      isWin: false,
    });
  }

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="app">
      <div className="top-header">
        <div className="beamer-logo-small">
          <BeamerLogo className="header-logo" />
        </div>
        <div className="header-left-section">
          <div className="timer-top-left">Time: {timeDisplay}</div>
        </div>
        <div className="powered-by">Powered by <span className="redbiller-brand">Redbiller</span></div>
      </div>

      <SpinWheel onResult={handleResult} onTimeUpdate={setTimeDisplay} />

      {celebrate.show && (
        <div
          className="celebrate-overlay"
          role="status"
          aria-live="polite"
          onClick={handleCloseCelebration}
        >
          <div
            className={`celebrate-card ${
              celebrate.isWin
                ? `win prize-${celebrate.prizeColor}`
                : "lose"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confetti" aria-hidden="true" />
            {celebrate.isWin ? (
              <>
                <h2>Congratulations! 🎉</h2>
                <p className="prize-amount">
                  You won a <b>{celebrate.prizeName}</b>
                </p>
              </>
            ) : (
              <>
                <h2>
                  {celebrate.prizeName === "Try Again" ? "🔄" : "😔"}
                </h2>
                <p className="prize-amount">{celebrate.prizeName}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
