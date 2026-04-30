import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const PlayerForm = ({ player, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    ranking: '',
    country: '',
    points: '',
    age: '',
    source: '',
    profile_url: ''
  });

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        ranking: player.ranking || '',
        country: player.country || '',
        points: player.points || '',
        age: player.age || '',
        source: player.source || '',
        profile_url: player.profile_url || ''
      });
    }
  }, [player]);

  const validate = async () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('playerForm.errors.nameReq');
    if (!formData.source) newErrors.source = t('playerForm.errors.sourceReq');
    
    if (formData.ranking && (isNaN(formData.ranking) || Number(formData.ranking) <= 0)) {
      newErrors.ranking = t('playerForm.errors.rankingPos');
    }
    if (formData.points && isNaN(formData.points)) {
      newErrors.points = t('playerForm.errors.pointsNum');
    }
    if (formData.age && (isNaN(formData.age) || Number(formData.age) <= 0)) {
      newErrors.age = t('playerForm.errors.agePos');
    }

    if (!newErrors.name && !newErrors.source && (!player || player.name !== formData.name || player.source !== formData.source)) {
      try {
        const existing = await pb.collection('players').getFirstListItem(
          `name="${formData.name.replace(/"/g, '\\"')}" && source="${formData.source}"`,
          { $autoCancel: false }
        );
        if (existing && existing.id !== player?.id) {
          newErrors.name = t('playerForm.errors.duplicate');
        }
      } catch (err) {
        if (err.status !== 404) {
          console.error('Error checking duplicates:', err);
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(await validate())) return;

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        ranking: formData.ranking ? Number(formData.ranking) : null,
        points: formData.points ? Number(formData.points) : null,
        age: formData.age ? Number(formData.age) : null,
      };

      if (player?.id) {
        await pb.collection('players').update(player.id, dataToSave, { $autoCancel: false });
        toast.success(t('playerForm.updateSuccess'));
      } else {
        await pb.collection('players').create(dataToSave, { $autoCancel: false });
        toast.success(t('playerForm.createSuccess'));
      }
      onSuccess();
    } catch (err) {
      console.error('Error saving player:', err);
      toast.error(err.message || t('playerForm.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('playerForm.name')}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? 'border-destructive bg-background' : 'bg-background'}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">{t('playerForm.source')}</Label>
          <Select
            value={formData.source}
            onValueChange={(val) => setFormData({ ...formData, source: val })}
          >
            <SelectTrigger className={errors.source ? 'border-destructive bg-background' : 'bg-background'}>
              <SelectValue placeholder={t('common.select')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="atp">ATP</SelectItem>
              <SelectItem value="wta">WTA</SelectItem>
              <SelectItem value="itf">ITF</SelectItem>
            </SelectContent>
          </Select>
          {errors.source && <p className="text-xs text-destructive">{errors.source}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ranking">{t('playerForm.ranking')}</Label>
          <Input
            id="ranking"
            type="number"
            value={formData.ranking}
            onChange={(e) => setFormData({ ...formData, ranking: e.target.value })}
            className={errors.ranking ? 'border-destructive bg-background' : 'bg-background'}
          />
          {errors.ranking && <p className="text-xs text-destructive">{errors.ranking}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="points">{t('playerForm.points')}</Label>
          <Input
            id="points"
            type="number"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: e.target.value })}
            className={errors.points ? 'border-destructive bg-background' : 'bg-background'}
          />
          {errors.points && <p className="text-xs text-destructive">{errors.points}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">{t('playerForm.country')}</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">{t('playerForm.age')}</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className={errors.age ? 'border-destructive bg-background' : 'bg-background'}
          />
          {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="profile_url">{t('playerForm.profileUrl')}</Label>
          <Input
            id="profile_url"
            value={formData.profile_url}
            onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
            className="bg-background"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('playerForm.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {player ? t('playerForm.update') : t('playerForm.create')}
        </Button>
      </div>
    </form>
  );
};

export default PlayerForm;