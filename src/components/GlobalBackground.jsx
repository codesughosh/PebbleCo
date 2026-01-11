export default function GlobalBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `
            /* Grid */
            linear-gradient(to right, rgba(200, 200, 200, 0.45) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(200, 200, 200, 0.45) 1px, transparent 1px),

            /* Glow */
            radial-gradient(circle 800px at 0% 200px, rgba(213, 197, 255, 0.55), transparent),
            radial-gradient(circle 800px at 100% 200px, rgba(213, 197, 255, 0.55), transparent),
            radial-gradient(circle 700px at 50% 0px, rgba(213, 197, 255, 0.4), transparent),
            radial-gradient(circle 700px at 50% 100%, rgba(213, 197, 255, 0.4), transparent)
          `,
          backgroundSize: `
            96px 64px,
            96px 64px,
            100% 100%,
            100% 100%,
            100% 100%,
            100% 100%
          `,
          backgroundColor: "#fff", // ensures contrast
        }}
      />
    </div>
  );
}
