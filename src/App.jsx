import { useState } from "react";
import "./App.css";
import SpinWheel from "./components/SpinWheel";

function App() {
  // Dev-only override: set to "auto" | "win" | "lose". Comment or change as needed.
  const FORCE_OUTCOME = "auto";
  const [celebrate, setCelebrate] = useState({
    show: false,
    prize: "",
    isWin: false,
  });

  return (
    <div className="app">
      <h1 className="title">
        <span className="brand-red">Red</span>
        <span className="brand-biller">biller</span>
      </h1>
      <p className="subtitle"></p>

      <SpinWheel
        enforceThreeWinsPerTen={true}
        forceOutcome={FORCE_OUTCOME}
        onResult={(label, isWin) => {
          setCelebrate({ show: true, prize: label, isWin });
          window.setTimeout(
            () => setCelebrate({ show: false, prize: "", isWin: false }),
            5000
          );
        }}
      />

      {celebrate.show && (
        <div className="celebrate-overlay" role="status" aria-live="polite">
          <div className={`celebrate-card ${celebrate.isWin ? "win" : "lose"}`}>
            {celebrate.isWin && <div className="confetti" aria-hidden="true" />}
            <h2>{celebrate.isWin ? "Congratulations! 🎉" : "Oops! 😅"}</h2>
            {celebrate.isWin ? (
              <p>
                You won a <b>{celebrate.prize}</b>
              </p>
            ) : (
              <>
                <p>{celebrate.prize}</p>
                <p className="note">Try again!</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
