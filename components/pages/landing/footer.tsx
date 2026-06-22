import { MonogramLogo } from "@/components/attache/MonogramLogo";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <a className="lockup" href="#top">
          <MonogramLogo size={26} />
          <span className="wm" style={{ fontSize: 14 }}>ATTACHE</span>
        </a>
        <div className="footer-links">
          <a href="#how">How it works</a>
          <a href="#trust">Security</a>
          <a href="#status">Status language</a>
        </div>
        <span className="fineprint">ATTACHE · AI VISA AGENT · MADE FOR TRAVELERS</span>
      </div>
    </footer>
  );
}
