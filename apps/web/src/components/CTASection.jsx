
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CTASection = ({ 
  title, 
  description, 
  primaryCTA, 
  secondaryCTA, 
  bgColor = "bg-primary", 
  textColor = "text-primary-foreground",
  icon: Icon
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={cn("relative overflow-hidden rounded-3xl p-8 md:p-12 lg:p-16 shadow-xl", bgColor, textColor)}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10 pointer-events-none">
        <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M44.7,-76.4C58.3,-69.2,70,-56.1,78.3,-41.3C86.6,-26.5,91.5,-9.9,89.5,6C87.5,21.8,78.6,36.9,67.6,49.1C56.6,61.3,43.5,70.5,28.6,76.6C13.7,82.8,-3,85.9,-18.8,82.4C-34.6,79,-49.5,69,-61.5,56C-73.5,43,-82.6,27,-86.3,10.2C-90,-6.7,-88.3,-24.3,-79.8,-38.7C-71.3,-53.1,-55.9,-64.3,-41,-71.1C-26.1,-77.9,-13,-80.3,1.6,-83C16.2,-85.7,31.1,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8 md:gap-12">
        {Icon && (
          <div className="hidden md:flex shrink-0 h-20 w-20 rounded-2xl bg-white/10 items-center justify-center backdrop-blur-sm border border-white/20">
            <Icon className="h-10 w-10 text-current opacity-90" />
          </div>
        )}
        
        <div className="flex-1 space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight text-balance">
            {title}
          </h2>
          <p className="text-lg opacity-90 leading-relaxed max-w-2xl text-balance">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
            {primaryCTA && (
              <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 font-bold border-none h-14 px-8">
                <Link to={primaryCTA.link}>
                  {primaryCTA.text}
                </Link>
              </Button>
            )}
            
            {secondaryCTA && (
              <Button asChild variant="outline" size="lg" className="border-white/30 hover:bg-white/10 text-current hover:text-current transition-all duration-300 backdrop-blur-sm h-14 px-8">
                <Link to={secondaryCTA.link}>
                  {secondaryCTA.text}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CTASection;
