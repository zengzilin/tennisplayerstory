import React from 'react';

const RankBadge = ({ rank }) => {
  let bgColor = "bg-muted text-muted-foreground";
  let additionalClasses = "";

  if (rank === 1) {
    bgColor = "bg-accent text-accent-foreground";
    additionalClasses = "ring-2 ring-accent ring-offset-2 ring-offset-background scale-105 font-bold shadow-md";
  } else if (rank === 2) {
    bgColor = "bg-slate-300 text-slate-800";
    additionalClasses = "font-bold shadow-sm";
  } else if (rank === 3) {
    bgColor = "bg-orange-300 text-orange-900";
    additionalClasses = "font-bold shadow-sm";
  } else if (rank <= 10) {
    bgColor = "bg-primary/10 text-primary";
    additionalClasses = "font-semibold";
  }

  return (
    <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm transition-all duration-300 ${bgColor} ${additionalClasses}`} aria-label={`Rank ${rank}`}>
      {rank}
    </div>
  );
};

export default RankBadge;