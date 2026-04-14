import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart, UserRound, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLanguage, buildLocalizedPath } from '@/contexts/LanguageContext.jsx';

const PlayerCard = ({ player }) => {
  const { isAuthenticated, currentUser, updateUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  const favoritePlayers = currentUser?.favorite_players || [];
  const isFavorited = favoritePlayers.includes(player.id);
  const playerDetailPath = buildLocalizedPath(currentLanguage, 'players', player.id);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) return;

    setIsSaving(true);
    try {
      const newFavorites = isFavorited
        ? favoritePlayers.filter((id) => id !== player.id)
        : [...favoritePlayers, player.id];

      await updateUser(currentUser.id, { favorite_players: newFavorites });
      toast.success(isFavorited ? t('playerCard.removeFromFav') : t('playerCard.addToFav'));
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error(t('playerCard.favError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Link to={playerDetailPath} className="block h-full">
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group relative">
        <div className="aspect-square overflow-hidden bg-muted relative flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background border border-border shadow-sm">
            <span className="text-3xl font-semibold tracking-tight">{player.initials}</span>
          </div>
          {isAuthenticated && (
            <Button
              variant="secondary"
              size="icon"
              className={`absolute top-3 right-3 rounded-full shadow-md transition-all duration-200 ${
                isFavorited ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background/80 backdrop-blur-sm hover:bg-background'
              }`}
              onClick={handleToggleFavorite}
              disabled={isSaving}
              aria-label={isFavorited ? t('playerCard.removeFromFav') : t('playerCard.addToFav')}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''} ${isSaving ? 'animate-pulse' : ''}`} />
            </Button>
          )}
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-xl leading-tight">{player.name}</h3>
              <Badge variant="secondary" className="text-lg font-bold shrink-0">
                {player.rankingDisplay}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <UserRound className="h-4 w-4" />
              <span>{player.country}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-1">
              <div className="text-muted-foreground text-sm">{t('playerCard.tour')}</div>
              <p className="text-xl font-bold">{player.sourceLabel}</p>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-sm">{t('playerCard.age')}</div>
              <p className="text-xl font-bold">{player.ageDisplay}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">{player.pointsDisplay}</span> {t('playerCard.points')}
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>{t('playerCard.updated')}: {player.lastUpdatedDisplay}</span>
            </div>
            {player.profileUrl && (
              <div className="flex items-center gap-2 text-primary">
                <ExternalLink className="h-4 w-4" />
                <span>{t('playerCard.profileAvailable')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PlayerCard;
