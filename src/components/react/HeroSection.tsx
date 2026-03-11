import React from "react";

export default function HeroSection() {
  return (
    <section className="mt-6">
      <div
        className="hero-juicy flex flex-col-reverse md:flex-row items-center justify-between gap-8 rounded-2xl p-6 md:p-12 shadow-2xl relative overflow-hidden"
        style={{
          background:
            "linear-gradient(120deg, rgba(8, 47, 73, 0.98) 0%, rgba(6, 182, 212, 0.13) 40%, rgba(96, 165, 250, 0.1) 70%, rgba(124, 58, 237, 0.09) 100%)",
        }}
      >
        <div className="flex-1 z-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gradient drop-shadow-lg">
            Launch new ideas
            <span className="whitespace-nowrap"> without the stress.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-6 max-w-lg mx-auto md:mx-0">
            Release in smaller steps, stay in control, and adapt instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <a
              href="/create-account"
              className="btn-primary w-full sm:w-auto text-lg text-center"
              aria-label="Create account"
            >
              Create Account
            </a>
            <a
              href="/login"
              className="btn-secondary w-full sm:w-auto text-lg text-center"
              aria-label="Login"
            >
              Login
            </a>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center relative z-10">
          <img
            className="drop-shadow-2xl max-w-full md:max-w-lg lg:max-w-xl animate-fade-in"
            src="/illustrations/hero.svg"
            alt="Feature rollout illustration"
            style={{ zIndex: 2 }}
          />
        </div>
      </div>
    </section>
  );
}
