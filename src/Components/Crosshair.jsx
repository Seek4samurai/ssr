const Crosshair = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Global Viewport Border */}
      <div className="absolute w-[95vw] h-[95vh] border-2 border-white/20 rounded-2xl shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white/50 rounded-tl-lg" />
        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white/50 rounded-tr-lg" />
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white/50 rounded-bl-lg" />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white/50 rounded-br-lg" />
      </div>

      {/* Center Crosshair */}
      <div className="absolute flex items-center justify-center">
        <div className="w-4 h-px bg-white/80" />
        <div className="absolute h-4 w-px bg-white/80" />
      </div>
    </div>
  );
};

export default Crosshair;
