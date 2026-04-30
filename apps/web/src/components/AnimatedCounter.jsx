
import React, { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';

const AnimatedCounter = ({ finalValue, label, icon: Icon, duration = 2, suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (inView) {
      const controls = animate(0, finalValue, {
        duration: duration,
        ease: "easeOut",
        onUpdate(value) {
          setDisplayValue(Math.floor(value));
        }
      });
      return () => controls.stop();
    }
  }, [inView, finalValue, duration]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toLocaleString();
  };

  return (
    <div ref={ref} className="flex flex-col items-center p-6 text-center group">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 dark:bg-primary/20">
        {Icon && <Icon className="h-8 w-8 text-primary" aria-hidden="true" />}
      </div>
      <div className="text-4xl md:text-5xl font-bold font-serif tracking-tight text-foreground dark:text-slate-50 mb-2 font-variant-numeric tabular-nums">
        {formatNumber(displayValue)}{suffix}
      </div>
      <div className="text-sm md:text-base font-medium tracking-wide text-muted-foreground uppercase dark:text-slate-400">
        {label}
      </div>
    </div>
  );
};

export default AnimatedCounter;
