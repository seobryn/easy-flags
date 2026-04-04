export default function HeroSection() {
  return (
    <section className="mt-12 mb-20 relative px-4">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-cyan-500/10 blur-[120px] pointer-events-none -z-10" />

      <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12 max-w-7xl mx-auto">
        <div className="flex-1 z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            New: Edge Rollouts
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
            Launch ideas <br />
            <span className="text-gradient">without the stress.</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Take full control of your release cycle. Deploy when you're ready,
            toggle features instantly, and sleep better at night.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a
              href="/create-account"
              className="btn-primary group"
              aria-label="Create account"
            >
              Get Started Free
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
            <a href="/docs" className="btn-secondary" aria-label="docs">
              Documentation
            </a>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <img
              className="relative rounded-2xl drop-shadow-2xl max-w-full md:max-w-lg lg:max-w-xl animate-fade-in"
              src="/illustrations/hero.svg"
              alt="Feature rollout illustration"
              style={{ animation: "float 6s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
