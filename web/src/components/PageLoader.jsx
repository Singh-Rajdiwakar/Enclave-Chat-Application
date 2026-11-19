function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0A0B10]">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/enclave-icon.svg"
          alt="Enclave"
          className="w-14 h-14 animate-pulse object-contain drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]"
        />
        <span className="text-xs font-mono text-white/50 tracking-widest uppercase">Loading Enclave...</span>
      </div>
    </div>
  );
}
export default PageLoader;
