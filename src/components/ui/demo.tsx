import { GLSLHills } from "@/components/ui/glsl-hills";

export default function DemoOne() {
  function handleGetStarted() {
    const nextSection = document.querySelector("#intake");
    if (!nextSection) {
      return;
    }

    nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="hero-page relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <div className="absolute left-6 top-6 z-20 flex items-center gap-3 md:left-8 md:top-8">
        <img src="/icon.png" alt="Skylook tree icon" className="h-9 w-9 object-contain" />
        <span className="text-sm font-normal tracking-normal text-slate-100">
          skylook
        </span>
      </div>
      <div className="hero-radar-background" aria-hidden="true">
        <img src="/chatgpt.png" alt="" className="hero-radar-background__image" />
      </div>
      <GLSLHills />
      <div className="hero-content absolute z-10 text-center">
        <h1
          className="font-display text-6xl font-black tracking-[0.28em] text-slate-100 md:text-8xl"
          style={{
            textShadow:
              "0 0 14px rgba(79, 195, 255, 0.95), 0 0 38px rgba(79, 195, 255, 0.65), 0 0 72px rgba(61, 220, 151, 0.35)",
          }}
        >
          SKYLOOK
        </h1>
        <div className="space-y-3 text-center">
          <p className="font-display text-2xl font-bold text-slate-100 md:text-4xl">
            AgriSense Smart Downlink
          </p>
          <p className="mx-auto max-w-2xl text-sm text-slate-200/85 md:text-lg">
            Satellite intelligence for bandwidth-aware agricultural response.
          </p>
        </div>
        <button
          type="button"
          className="hero-glass-button"
          onClick={handleGetStarted}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
