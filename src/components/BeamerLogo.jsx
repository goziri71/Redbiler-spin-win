import "./BeamerLogo.css";

export default function BeamerLogo({ className = "" }) {
  return (
    <img
      src="/beamer logo-03.png"
      alt="Beamer Logo"
      className={`beamer-logo ${className}`}
    />
  );
}
