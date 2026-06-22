export function HeroMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="frame">
        <div className="frame-top">
          <span className="mini-flap">
            <b>R</b><b>E</b><b>V</b><b>I</b><b>E</b><b>W</b><b>I</b><b>N</b><b>G</b>
          </span>
          <span className="lamp-chip">
            <i />
            Action needed
          </span>
        </div>
        <div className="frame-body">
          <div className="mini-side">
            <div>
              <div className="mini-label">PROGRESS</div>
              <ul className="mini-steps">
                <li className="don"><i />Documents</li>
                <li className="act"><i />Review</li>
                <li><i />Appointment</li>
                <li><i />Submitted</li>
                <li><i />Decision</li>
              </ul>
            </div>
            <div>
              <div className="mini-label">DOCUMENTS</div>
              <div className="mini-doc"><span>Passport</span><em className="p">✕</em></div>
              <div className="mini-doc"><span>Photo</span><em className="g">●</em></div>
              <div className="mini-doc"><span>Bank stmts</span><em className="a">▲</em></div>
              <div className="mini-doc"><span>Flight</span><em className="g">●</em></div>
              <div className="mini-doc"><span>Stay</span><em className="g">●</em></div>
              <div className="mini-doc"><span>Insurance</span><em>—</em></div>
            </div>
          </div>
          <div className="mini-chat">
            <div className="mini-a">
              <span className="am">A</span>
              <div className="mini-bubble">I&rsquo;ve checked your documents — one problem, one thing to watch.</div>
            </div>
            <div className="mini-card">
              <div className="h">DOCUMENT REVIEW</div>
              <div className="r"><span>Photo</span><s /><em className="g">● Verified</em></div>
              <div className="r"><span>Bank statements</span><s /><em className="a">▲ Check this</em></div>
              <div className="r"><span>Passport</span><s /><em className="p">✕ Problem</em></div>
            </div>
            <div className="mini-user">I have a policy — here it is.</div>
            <div className="mini-a">
              <span className="am">A</span>
              <div className="mini-bubble">Verified — your file is complete. Submitting now.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
