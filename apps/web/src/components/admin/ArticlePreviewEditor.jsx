
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, AlertCircle, CheckCircle2, FileText, Activity } from 'lucide-react';

const ArticlePreviewEditor = ({ article, onSaveComplete }) => {
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    player_name: '',
    content: '',
    meta_description: '',
    tags: '',
    status: 'pending'
  });

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        player_name: article.player_name || '',
        content: article.content || article.description || '',
        meta_description: article.meta_description || '',
        tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''),
        status: article.status || 'pending'
      });
    } else {
      setFormData({
        title: '', player_name: '', content: '', meta_description: '', tags: '', status: 'pending'
      });
    }
  }, [article]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const calculateSEO = () => {
    let score = 100;
    const issues = [];
    
    if (formData.title.length < 40 || formData.title.length > 60) {
      score -= 20;
      issues.push("Title should be 40-60 chars.");
    }
    if (formData.meta_description.length < 140 || formData.meta_description.length > 160) {
      score -= 20;
      issues.push("Meta description should be 140-160 chars.");
    }
    if (formData.content.split(' ').length < 300) {
      score -= 30;
      issues.push("Content is too short (<300 words).");
    }
    if (!formData.player_name) {
      score -= 10;
      issues.push("Missing player name.");
    }

    return { score: Math.max(0, score), issues };
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required.');
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const payload = {
        title: formData.title,
        player_name: formData.player_name || 'Generic',
        content: `${formData.content}\n\n<!-- meta: ${formData.meta_description} -->`,
        tags: tagsArray,
        status: formData.status,
        author: currentUser.id
      };

      if (article?.id) {
        await pb.collection('articles').update(article.id, payload, { $autoCancel: false });
        toast.success('Article updated successfully!');
      } else {
        await pb.collection('articles').create(payload, { $autoCancel: false });
        toast.success('Article created successfully!');
      }
      
      if (onSaveComplete) onSaveComplete();
      
    } catch (err) {
      console.error('Error saving article:', err);
      toast.error(err.message || 'Failed to save article.');
    } finally {
      setIsSaving(false);
    }
  };

  const seo = calculateSEO();
  const wordCount = formData.content.split(/\s+/).filter(Boolean).length;

  if (!article && !formData.title) {
    return (
      <Card className="h-full flex flex-col items-center justify-center border-dashed dark:bg-slate-800/50 min-h-[500px]">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Select a topic to generate or edit an article.</p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-border shadow-md dark:bg-slate-800 dark:border-slate-700 max-h-[calc(100vh-8rem)] overflow-hidden">
      <CardHeader className="shrink-0 border-b border-border/50 pb-4 bg-muted/20 dark:bg-slate-900/20">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Article Editor</CardTitle>
            <CardDescription>Review and optimize AI-generated content</CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-background dark:bg-slate-900 px-3 py-1.5 rounded-full border border-border shadow-sm">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">SEO Score:</span>
            <span className={`text-sm font-bold ${seo.score >= 80 ? 'text-green-500' : seo.score >= 50 ? 'text-yellow-500' : 'text-destructive'}`}>
              {seo.score}/100
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto admin-scroll p-6 space-y-6">
        {seo.issues.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-500 flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" /> Optimization Suggestions
            </h4>
            <ul className="text-xs text-yellow-600/90 dark:text-yellow-400/90 space-y-1 pl-6 list-disc">
              {seo.issues.map((issue, i) => <li key={i}>{issue}</li>)}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="title">SEO Title</Label>
            <span className={`text-xs ${formData.title.length < 40 || formData.title.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {formData.title.length} / 60 chars
            </span>
          </div>
          <Input 
            id="title" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            className="font-medium text-lg dark:bg-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="player_name">Player Name (Primary Subject)</Label>
            <Input 
              id="player_name" 
              name="player_name" 
              value={formData.player_name} 
              onChange={handleChange} 
              className="dark:bg-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Publish Status</Label>
            <Select value={formData.status} onValueChange={handleSelectChange}>
              <SelectTrigger className="dark:bg-slate-900">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Draft / Pending</SelectItem>
                <SelectItem value="approved">Published (Approved)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="meta_description">Meta Description</Label>
            <span className={`text-xs ${formData.meta_description.length < 140 || formData.meta_description.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {formData.meta_description.length} / 160 chars
            </span>
          </div>
          <Textarea 
            id="meta_description" 
            name="meta_description" 
            value={formData.meta_description} 
            onChange={handleChange} 
            className="h-20 resize-none dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="content">Article Content</Label>
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
          </div>
          <Textarea 
            id="content" 
            name="content" 
            value={formData.content} 
            onChange={handleChange} 
            className="min-h-[300px] font-serif leading-relaxed dark:bg-slate-900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (Comma separated)</Label>
          <Input 
            id="tags" 
            name="tags" 
            value={formData.tags} 
            onChange={handleChange} 
            placeholder="e.g. Grand Slam, Wimbledon, ATP"
            className="dark:bg-slate-900"
          />
          {formData.tags && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.split(',').map((t, i) => t.trim() && (
                <Badge key={i} variant="secondary">{t.trim()}</Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="shrink-0 border-t border-border/50 p-4 bg-muted/10 dark:bg-slate-900/10 flex justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> AI Generation Complete
        </p>
        <Button onClick={handleSave} disabled={isSaving} className="shadow-md">
          {isSaving ? 'Saving...' : 'Save Article'}
          {!isSaving && <Save className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ArticlePreviewEditor;
