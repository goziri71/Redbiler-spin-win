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
          <p className="brand-subtitle">MICROFINANCE BANK</p>
          <p className="brand-website">www.beamer.com</p>
        </div>

        <div className="welcome-section">
          <p className="welcome-text">You are Welcome</p>
        </div>

        <button className="start-btn" onClick={onStart}>
          Start Spinning! 🎰
        </button>
      </div>
    </div>
  );
}
