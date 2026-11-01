interface MarqueeProps {
  text?: string;
}

export default function Marquee({ text = "NITRRFIE STORE — OFFICIAL MERCHANDISE — NIT RAIPUR — " }: MarqueeProps) {
  return (
    <div className="overflow-hidden bg-slate-900 py-3">
      <div className="marquee-track flex whitespace-nowrap">
        <span className="font-mono text-xs md:text-sm uppercase tracking-wider text-slate-200 mx-4 font-bold">
          {text}
        </span>
        <span className="font-mono text-xs md:text-sm uppercase tracking-wider text-orange-400 mx-4 font-bold">
          {text}
        </span>
        <span className="font-mono text-xs md:text-sm uppercase tracking-wider text-slate-200 mx-4 font-bold">
          {text}
        </span>
        <span className="font-mono text-xs md:text-sm uppercase tracking-wider text-orange-400 mx-4 font-bold">
          {text}
        </span>
        <span className="font-mono text-xs md:text-sm uppercase tracking-wider text-slate-200 mx-4 font-bold">
          {text}
        </span>
        <span className="font-mono text-xs md:text-sm uppercase tracking-wider text-orange-400 mx-4 font-bold">
          {text}
        </span>
        <span className="font-mono text-xs md:text-sm uppercase tracking-wider text-slate-200 mx-4 font-bold">
          {text}
        </span>
        <span className="font-mono text-xs md:text-sm uppercase tracking-wider text-orange-400 mx-4 font-bold">
          {text}
        </span>
      </div>
    </div>
  );
}