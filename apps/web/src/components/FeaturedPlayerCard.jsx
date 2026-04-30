
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Trophy, ExternalLink, Target } from 'lucide-react';
import ImageWithAlt from '@/components/ImageWithAlt.jsx';
import CountryFlag from '@/components/CountryFlag.jsx';

const FeaturedPlayerCard = ({ player }) => {
  // Generate a fallback avatar if none exists
  const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&size=400&background=f1f5f9&color=0f172a&font-size=0.33`;
  const imgSrc = player.profile_url || player.imageUrl || defaultImage;

  // Use a static 5-star for featured athletes as requested, or derive from stats if available
  const stars = Array.from({ length: 5 });

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="overflow-hidden flex flex-col h-full bg-card dark:bg-slate-800 border-border dark:border-slate-700 shadow-sm hover:shadow-xl transition-shadow duration-300 group">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted dark:bg-slate-900 shrink-0">
          <ImageWithAlt
            src={imgSrc}
            alt={`Featured tennis player ${player.name}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
          
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            <Badge className="bg-primary text-primary-foreground shadow-lg border-none text-sm font-bold px-3 py-1">
              Rank #{player.ranking || '-'}
            </Badge>
            {player.ranking <= 10 && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground shadow-md border-none flex items-center gap-1 font-bold">
                <Trophy className="h-3 w-3" /> Top 10
              </Badge>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <CountryFlag country={player.country} />
              <span className="text-white/90 text-sm font-medium tracking-wide drop-shadow-md">
                {player.country || 'Unknown'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white font-serif tracking-tight drop-shadow-lg leading-tight">
              {player.name}
            </h3>
          </div>
        </div>

        <CardContent className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-1 mb-4 text-accent">
            {stars.map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
            <span className="text-xs text-muted-foreground ml-2 font-medium">(Elite)</span>
          </div>

          <p className="text-muted-foreground dark:text-slate-400 text-sm leading-relaxed line-clamp-2 mb-6 flex-1">
            {player.bio || `${player.name} is a highly competitive professional athlete currently competing on the ${player.source?.toUpperCase() || 'Pro'} tour.`}
          </p>

          <div className="flex items-center justify-between border-t border-border/50 dark:border-slate-700 pt-4 mt-auto">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground dark:text-slate-200">
              <Target className="h-4 w-4 text-secondary" />
              <span className="tabular-nums">{player.points?.toLocaleString() || 0} pts</span>
            </div>
            
            <Button asChild variant="ghost" size="sm" className="group/btn hover:bg-primary hover:text-primary-foreground transition-colors dark:text-slate-200 dark:hover:text-primary-foreground">
              <Link to={`/players`}>
                Profile
                <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-50 group-hover/btn:opacity-100 transition-opacity" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FeaturedPlayerCard;
