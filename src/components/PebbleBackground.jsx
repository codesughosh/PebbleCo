export default function PebbleBackground({ children }) {
  return (
    <div className="min-h-screen w-full bg-white relative overflow-x-hidden">

      {/* Grid + Glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #f0f0f0 1px, transparent 1px),
            linear-gradient(to bottom, #f0f0f0 1px, transparent 1px),
            radial-gradient(circle 600px at 0% 200px, #f6c1d1, transparent),
            radial-gradient(circle 600px at 100% 200px, #f6c1d1, transparent),
            radial-gradient(circle 600px at 50% 0px, #f6c1d1, transparent),
            radial-gradient(circle 600px at 50% 100%, #f6c1d1, transparent)
          `,
          backgroundSize: `
            96px 64px,
            96px 64px,
            100% 100%,
            100% 100%,
            100% 100%,
            100% 100%
          `,
        }}
      />

      {/* Page Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
