// @ts-nocheck

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { getYouTubeId, getYouTubeThumbnail } from '@/utils/youtubeUtils.js';

const SubmitVlogModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    youtube_url: '',
    title: '',
    description: '',
  });
  const [youtubeId, setYoutubeId] = useState(null);

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, youtube_url: url }));
    
    const id = getYouTubeId(url);
    if (id) {
      setYoutubeId(id);
    } else {
      setYoutubeId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("--- SUBMIT VLOG DEBUG ---");
    console.log("Auth Context currentUser:", currentUser);
    console.log("Form data before processing:", formData);
    
    if (!currentUser) {
      toast.error(t('common.error', 'You must be logged in to submit a video.'));
      return;
    }

    if (!youtubeId) {
      toast.error(t('vlogs.submitModal.invalidUrl', 'Please enter a valid YouTube URL.'));
      return;
    }

    setLoading(true);
    try {
      const thumbnailUrl = getYouTubeThumbnail(youtubeId, 'maxresdefault');
      
      // Using camelCase fields to match the PocketBase vlogs collection schema exactly
      const payload = {
        title: formData.title,
        description: formData.description,
        youtubeUrl: formData.youtube_url,
        thumbnailUrl: thumbnailUrl,
        uploaderId: currentUser.id,
        status: 'draft',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        saveCount: 0
      };

      console.log("Payload BEFORE create (matching schema):", payload);

      const response = await pb.collection('vlogs').create(payload, { $autoCancel: false });
      
      console.log("Response AFTER create:", response);
      console.log("--- END SUBMIT VLOG DEBUG ---");
      
      toast.success(t('vlogs.submitModal.success', 'Video submitted successfully! Pending admin approval.'));
      
      setFormData({
        youtube_url: '',
        title: '',
        description: '',
      });
      setYoutubeId(null);
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('--- SUBMIT VLOG ERROR ---');
      console.error('Error caught:', error);
      console.error('Error stack:', error.stack);
      console.error('--- END SUBMIT VLOG ERROR ---');
      toast.error('Failed to submit vlog: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-serif">{t('vlogs.submitModal.title', 'Submit a Vlog')}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('vlogs.submitModal.desc', 'Share a great tennis video with the community. It will be reviewed by an admin before publishing.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="youtube_url" className="text-foreground">{t('vlogs.submitModal.youtubeUrl', 'YouTube URL')} *</Label>
            <Input 
              id="youtube_url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={formData.youtube_url}
              onChange={handleUrlChange}
              required
              className="bg-background text-foreground border-input"
            />
            {youtubeId && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border aspect-video bg-black/5 relative">
                <img 
                  src={getYouTubeThumbnail(youtubeId, 'mqdefault')} 
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">{t('vlogs.submitModal.videoTitle', 'Video Title')} *</Label>
            <Input 
              id="title"
              placeholder="Epic Rally Analysis..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="bg-background text-foreground border-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">{t('vlogs.submitModal.description', 'Description (Optional)')}</Label>
            <Textarea 
              id="description"
              placeholder="Briefly describe why you are sharing this video..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="resize-none h-24 bg-background text-foreground border-input"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={loading || !youtubeId} className="bg-primary text-primary-foreground">
              {loading ? t('common.loading', 'Loading...') : t('vlogs.submitModal.submit', 'Submit Video')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitVlogModal;
