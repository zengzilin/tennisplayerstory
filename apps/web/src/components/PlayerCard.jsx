
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Award, Heart, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import ImageWithAlt from './ImageWithAlt.jsx';

const getCountryFlag = (countryCode) => {
  if (!countryCode) return '🏳️';
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return '🏳️';
  const offset = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
};

const PlayerCard = ({ player }) => {
  const { isAuthenticated, currentUser, updateUser } = useAuth();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  
  const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&size=400&background=f1f5f9&color=0f172a&font-size=0.33`;
  const [imgSrc, setImgSrc] = useState(player.imageUrl || player.profile_url || defaultImage);
  const [imgError, setImgError] = useState(false);

  const favoritePlayers = currentUser?.favorite_players || [];
  const isFavorited = favoritePlayers.includes(player.id);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    setIsSaving(true);
    try {
      let newFavorites = isFavorited 
        ? favoritePlayers.filter(id => id !== player.id)
        : [...favoritePlayers, player.id];
      await updateUser(currentUser.id, { favorite_players: newFavorites });
      toast.success(isFavorited ? t('playerCard.removeFromFav') : t('playerCard.addToFav'));
    } catch (error) {
      toast.error(t('playerCard.favError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageError = () => {
    if (!imgError) {
      setImgSrc(defaultImage);
      setImgError(true);
    }
  };

  const bioText = player.bio || '';
  const isLongBio = bioText.length > 150;
  const displayBio = isBioExpanded ? bioText : (isLongBio ? `${bioText.substring(0, 150)}...` : bioText);

  return (
    <motion.div layout className="h-full">
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative bg-card h-full flex flex-col border-border/50">
        <div className="aspect-video overflow-hidden bg-muted relative flex items-center justify-center shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <ImageWithAlt
            src={imgSrc}
            alt={`Professional tennis player ${player.name} from ${player.country || 'Unknown'}`}
            title={`${player.name} Profile`}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <Badge className="bg-accent text-accent-foreground font-bold shadow-lg animate-in fade-in duration-500">
              #{player.ranking || '-'}
            </Badge>
            {isAuthenticated && (
              <Button
                variant="secondary"
                size="icon"
                className={`rounded-full shadow-md transition-all duration-200 h-6 w-6 ${isFavorited ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background/80 backdrop-blur-sm hover:bg-background'}`}
                onClick={handleToggleFavorite}
                disabled={isSaving}
                aria-label={isFavorited ? t('playerCard.removeFromFav') : t('playerCard.addToFav')}
              >
                <Heart className={`h-3 w-3 ${isFavorited ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
          <div className="absolute bottom-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
             <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-foreground border-none uppercase tracking-wider text-xs">
                {player.source || 'ATP'}
             </Badge>
          </div>
        </div>
        
        <CardContent className="p-6 flex flex-col flex-1 space-y-4 relative">
          <div className="space-y-1">
            <h3 className="font-bold text-xl truncate pr-2 text-foreground font-serif">{player.name}</h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-lg" aria-hidden="true">{getCountryFlag(player.country)}</span>
              <span className="text-sm font-medium">{player.country || 'Unknown'}</span>
              {player.age && <><span aria-hidden="true">•</span><span className="text-sm">{player.age} yrs</span></>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground text-xs uppercase tracking-wider font-medium">
                <Trophy className="h-3 w-3 text-accent" />
                <span>{t('playerCard.titles', 'Titles')}</span>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">{player.titles || 0}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground text-xs uppercase tracking-wider font-medium">
                <Award className="h-3 w-3 text-secondary" />
                <span>{t('playerCard.points', 'Points')}</span>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">{player.points?.toLocaleString() || 0}</p>
            </div>
          </div>

          {bioText && (
            <motion.div layout className="pt-4 border-t border-border/50 mt-auto">
              <motion.div layout className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {displayBio}
              </motion.div>
              {isLongBio && (
                <Button variant="ghost" size="sm" className="h-auto p-0 mt-2 text-primary hover:text-primary/80 transition-colors" onClick={(e) => { e.preventDefault(); setIsBioExpanded(!isBioExpanded); }} aria-expanded={isBioExpanded}>
                  {isBioExpanded ? <span className="flex items-center gap-1">Show Less <ChevronUp className="h-3 w-3" /></span> : <span className="flex items-center gap-1">Read More <ChevronDown className="h-3 w-3" /></span>}
                </Button>
              )}
            </motion.div>
          )}
          
          <Button className="w-full mt-4 group/btn" variant="outline" aria-label={`View full profile for ${player.name}`}>
            View Profile
            <ExternalLink className="ml-2 h-4 w-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlayerCard;
