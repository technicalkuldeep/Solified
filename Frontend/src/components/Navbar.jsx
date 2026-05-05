import { Link, useNavigate } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();
  return (
    <header
      data-testid="app-navbar"
      className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070A]/85 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <Link
          to="/"
          data-testid="nav-home-link"
          className="group flex items-center gap-3"
        >
          <img
            src="/brand/solified-shield.png"
            alt="Solified shield"
            className="h-9 w-9 transition-transform duration-300 group-hover:scale-105"
            style={{ mixBlendMode: "screen" }}
            draggable="false"
          />
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-black tracking-tight brand-gradient-text">
              SOLIFIED
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
              verify before you trust
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            ["#how-it-works", "How", "nav-how-link"],
            ["#protection", "Protection", "nav-protection-link"],
            ["#firewall", "Firewall", "nav-firewall-link"],
            ["#features", "Features", "nav-features-link"],
            ["#extension", "Extension", "nav-extension-link"],
            ["#recent", "Recent", "nav-recent-link"],
          ].map(([href, label, tid]) => (
            <a
              key={tid}
              href={href}
              data-testid={tid}
              onClick={(e) => {
                const id = href.replace(/^#/, "");
                const el = document.getElementById(id);
                if (el) {
                  e.preventDefault();
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  // Keep URL clean so reload always starts at the top
                  window.history.replaceState(null, "", window.location.pathname);
                }
              }}
              className="relative font-mono text-xs uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        <button
          data-testid="nav-scan-button"
          onClick={() => navigate("/")}
          className="group relative inline-flex items-center gap-2 overflow-hidden bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-[#07070A] transition-transform duration-300 hover:scale-[1.02]"
        >
          <span className="relative z-10">New Solify</span>
          <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
