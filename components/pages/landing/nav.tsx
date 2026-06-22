import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { MonogramLogo } from "@/components/attache/MonogramLogo";

export function Nav() {
  return (
    <header className="nav">
      <div className="wrap">
        <a className="lockup" href="#top">
          <MonogramLogo size={34} className="mark" />
          <span className="wm">ATTACHE</span>
        </a>
        <nav>
          <a className="link" href="#how">
            How it works
          </a>
          <a className="link" href="#trust">
            Security
          </a>
          <Show when="signed-in">
            <Link className="key" href="/onboarding">
              Open the console
            </Link>
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className="link">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="key">
                Start free
              </button>
            </SignUpButton>
          </Show>
        </nav>
      </div>
    </header>
  );
}
