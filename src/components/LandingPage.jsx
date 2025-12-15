import "./LandingPage.css";

export default function LandingPage({ onStart }) {
  return (
    <div className="landing-page">
      <div className="landing-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <div className="landing-content">
        <div className="brand-section">
          <h1 className="brand-title">beamer</h1>
        </div>

        <div className="spin-to-win-section">
          <h2 className="spin-to-win-title">Spin to Win</h2>
        </div>

        <button className="start-btn" onClick={onStart}>
          Start Spinning! 🎰
        </button>
      </div>
    </div>
  );
}
