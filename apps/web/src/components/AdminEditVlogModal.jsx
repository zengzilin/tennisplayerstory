import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import pb from '@/lib/pocketbaseClient.js';

const AdminEditVlogModal = ({ vlog, isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    channel_name: '',
    status: 'pending'
  });

  useEffect(() => {
    if (vlog) {
      setFormData({
        title: vlog.title || '',
        description: vlog.description || '',
        channel_name: vlog.channel_name || vlog.uploaderId || '',
        status: vlog.status || 'pending'
      });
    }
  }, [vlog]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vlog?.id) return;

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        channel_name: formData.channel_name,
        uploaderId: formData.channel_name, // fallback
        status: formData.status
      };

      await pb.collection('vlogs').update(vlog.id, payload, { $autoCancel: false });
      
      toast.success('Vlog updated successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating vlog:', error);
      toast.error('Failed to update vlog.');
    } finally {
      setLoading(false);
    }
  };

  if (!vlog) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-serif">{t('vlogs.admin.edit', 'Edit Vlog')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input 
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="bg-background text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-channel">Channel / Uploader Name</Label>
            <Input 
              id="edit-channel"
              value={formData.channel_name}
              onChange={(e) => setFormData(prev => ({ ...prev, channel_name: e.target.value }))}
              required
              className="bg-background text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}>
              <SelectTrigger className="bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t('vlogs.status.pending', 'Pending')}</SelectItem>
                <SelectItem value="approved">{t('vlogs.status.approved', 'Approved')}</SelectItem>
                <SelectItem value="rejected">{t('vlogs.status.rejected', 'Rejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea 
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="resize-none h-24 bg-background text-foreground"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading', 'Loading...') : t('common.save', 'Save Changes')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditVlogModal;