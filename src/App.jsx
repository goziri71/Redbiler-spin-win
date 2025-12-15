import { useState, useRef } from "react";
import "./App.css";
import SpinWheel from "./components/SpinWheel";
import LandingPage from "./components/LandingPage";
import BeamerLogo from "./components/BeamerLogo";

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [currentSession, setCurrentSession] = useState(1);
  const [timeDisplay, setTimeDisplay] = useState("10:00");
  const [celebrate, setCelebrate] = useState({
    show: false,
    guestNumber: null,
    prizeAmount: null,
    prizeColor: null,
  });

  function formatCurrency(amount) {
    return `₦${amount.toLocaleString()}`;
  }

  const celebrateTimeoutRef = useRef(null);

  function handleResult(guestNumber, prizeAmount, prizeColor) {
    // Clear any existing timeout
    if (celebrateTimeoutRef.current) {
      clearTimeout(celebrateTimeoutRef.current);
      celebrateTimeoutRef.current = null;
    }

    setCelebrate({
      show: true,
      guestNumber,
      prizeAmount,
      prizeColor,
    });
  }

  function handleCloseCelebration() {
    // Clear timeout if user closes manually
    if (celebrateTimeoutRef.current) {
      clearTimeout(celebrateTimeoutRef.current);
      celebrateTimeoutRef.current = null;
    }

    setCelebrate({
      show: false,
      guestNumber: null,
      prizeAmount: null,
      prizeColor: null,
    });
  }

  function handleStartSession2() {
    handleCloseCelebration();
    setCurrentSession(2);
  }

  function handleSessionEnd() {
    if (currentSession === 1) {
      // Transition to session 2
      if (window.confirm("Session 1 has ended! Start Session 2?")) {
        setCurrentSession(2);
      }
    } else {
      // Both sessions complete
      alert("Both sessions have ended! Thank you for participating!");
    }
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
          {currentSession === 1 && (
            <button
              className="start-session-btn-header"
              onClick={handleStartSession2}
            >
              Start Session 2
            </button>
          )}
        </div>
        <div className="session-badge-top">Session {currentSession}</div>
      </div>

      <SpinWheel
        currentSession={currentSession}
        onResult={handleResult}
        onSessionEnd={handleSessionEnd}
        onTimeUpdate={setTimeDisplay}
      />

      {celebrate.show && (
        <div
          className="celebrate-overlay"
          role="status"
          aria-live="polite"
          onClick={handleCloseCelebration}
        >
          <div
            className={`celebrate-card win prize-${celebrate.prizeColor}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confetti" aria-hidden="true" />
            <h2>Congratulations! 🎉</h2>
            <p className="guest-number">Guest #{celebrate.guestNumber}</p>
            <p className="prize-amount">
              You won <b>{formatCurrency(celebrate.prizeAmount)}</b>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
