/**
 * HeroPoster — the CSS-composed floodlit-pitch "Kickoff" still frame.
 * This is the LCP element (paints instantly, no image download) AND the
 * reduced-motion / mobile fallback. The R3F scene crossfades over it on
 * capable devices. Light layers carry stable class hooks so the GSAP
 * "Floodlights On" timeline can drive them.
 */
export function HeroPoster() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {/* base pitch gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_78%_-10%,#12211a_0%,#0b1310_38%,#080b0a_75%)]" />

      {/* floodlight bloom (top-right key) — first bank on */}
      <div
        className="nm-hero-bloom nm-anim-light absolute inset-0"
        style={{
          animationDelay: '0.05s',
          background:
            'radial-gradient(38% 44% at 80% 6%, rgba(226,240,214,0.55) 0%, rgba(200,224,180,0.18) 30%, rgba(200,224,180,0.0) 62%)',
        }}
      />

      {/* volumetric god-ray beam raking down-left from the pylon — second bank */}
      <div
        className="nm-hero-ray nm-anim-light absolute -top-[30%] right-[2%] h-[150%] w-[70%] origin-top-right -rotate-[18deg] blur-2xl"
        style={{
          animationDelay: '0.17s',
          background:
            'linear-gradient(200deg, rgba(228,242,216,0.22) 0%, rgba(228,242,216,0.06) 30%, rgba(228,242,216,0) 60%)',
        }}
      />

      {/* wet-pitch specular reflection streak (the "money" reflection) — final bank */}
      <div
        className="nm-hero-specular nm-anim-light absolute bottom-0 left-1/2 h-[55%] w-[40%] -translate-x-[10%] blur-2xl"
        style={{
          animationDelay: '0.29s',
          background:
            'radial-gradient(60% 100% at 50% 100%, rgba(198,241,53,0.10) 0%, rgba(226,240,214,0.10) 22%, rgba(226,240,214,0) 70%)',
        }}
      />

      {/* faint perspective chalk lines near the ground */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38%] opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(97deg, transparent 0 78px, rgba(243,247,241,0.9) 78px 80px)',
          maskImage: 'linear-gradient(to top, #000 0%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to top, #000 0%, transparent 85%)',
        }}
      />

      {/* edge vignette to seat the content */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_100%_at_30%_60%,transparent_35%,rgba(4,6,5,0.55)_100%)]" />
    </div>
  );
}
