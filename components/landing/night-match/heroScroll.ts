/**
 * Shared hero scroll progress (0..1), written by the pinned+scrubbed
 * ScrollTrigger timeline in HeroKickoff and read every frame by the R3F
 * camera rig in KickoffScene. A mutable module singleton keeps the
 * DOM-side GSAP world and the canvas-side render loop in lockstep
 * without React re-renders.
 */
export const heroScroll = { p: 0 };
