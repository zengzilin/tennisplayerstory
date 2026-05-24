// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useIntegratedAi } from '@/hooks/use-integrated-ai.tsx';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

import Header from '@/components/Header.tsx';
import Footer from '@/components/Footer.tsx';
import SEOHelmet from '@/components/SEOHelmet.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import TennisTopicSearch from '@/components/admin/TennisTopicSearch.tsx';
import AIArticleGenerator from '@/components/admin/AIArticleGenerator.tsx';
import BatchArticleGenerator from '@/components/admin/BatchArticleGenerator.tsx';
import ArticlePreviewEditor from '@/components/admin/ArticlePreviewEditor.tsx';
import ArticleManagementList from '@/components/admin/ArticleManagementList.tsx';

const extractJSON = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {
      console.error('Failed to parse JSON from AI response:', e);
      return null;
    }
  }
  return null;
};

const ContentManagerPage = () => {
  const { currentUser } = useAuth();
  const { sendMessage, isStreaming } = useIntegratedAi();
  
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatching, setIsBatching] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [queue, setQueue] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  const handleSearchTopics = async () => {
    setIsSearching(true);
    try {
      const prompt = `You are a professional SEO analyst specializing in professional tennis content. 
      
Search for the top 10 trending tennis topics and keywords with high search volume and SEO potential. Focus on:
- Grand Slam tournaments (Wimbledon, US Open, French Open, Australian Open)
- ATP and WTA rankings and player analysis
- Match analysis and tactical breakdowns
- Rising stars and emerging players
- Tennis equipment and training methods
- Historical moments and legendary players

Return ONLY a valid JSON array with exactly this structure (no markdown, no extra text):
[
  {
    "topic": "Topic Name",
    "description": "Brief description of why this topic is trending",
    "relevance_score": 8.5,
    "result_count": 15000
  }
]

Ensure all JSON is valid and properly formatted.`;

      await sendMessage(prompt);
      
      // Wait for streaming to complete
      const maxWait = 30000;
      const startTime = Date.now();
      while (isStreaming && Date.now() - startTime < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast.success('Topics discovered! Select topics to generate articles.');
    } catch (err) {
      console.error('Error searching topics:', err);
      toast.error('Failed to search topics. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateSingle = async (topic) => {
    setIsGenerating(true);
    try {
      const prompt = `You are an expert tennis journalist and SEO content strategist. Generate a comprehensive, SEO-optimized article about: "${topic}"

The article should be engaging, informative, and suitable for professional tennis enthusiasts. Include tactical analysis, player insights, and historical context where relevant.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "title": "SEO-optimized title (50-60 characters)",
  "description": "Detailed article content (300-500 words, well-structured with paragraphs)",
  "meta_description": "Meta description for search engines (150-160 characters)",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "player_name": "Primary player or subject name"
}

Ensure all JSON is valid and properly formatted.`;

      await sendMessage(prompt);
      
      const maxWait = 45000;
      const startTime = Date.now();
      while (isStreaming && Date.now() - startTime < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast.success('Article generated! Review and save below.');
    } catch (err) {
      console.error('Error generating article:', err);
      toast.error('Failed to generate article. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartBatch = async (topicsToProcess) => {
    setIsBatching(true);
    setQueue(topicsToProcess);
    setCompletedCount(0);

    for (const topic of topicsToProcess) {
      try {
        const prompt = `You are an expert tennis journalist. Generate a comprehensive article about: "${topic}"

Return ONLY valid JSON (no markdown):
{
  "title": "SEO title (50-60 chars)",
  "description": "Article content (300-500 words)",
  "meta_description": "Meta description (150-160 chars)",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "tags": ["tag1", "tag2"],
  "player_name": "Primary subject"
}`;

        await sendMessage(prompt);
        
        const maxWait = 45000;
        const startTime = Date.now();
        while (isStreaming && Date.now() - startTime < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        setQueue(prev => prev.filter(t => t !== topic));
        setCompletedCount(prev => prev + 1);
      } catch (err) {
        console.error(`Error generating article for ${topic}:`, err);
        setQueue(prev => prev.filter(t => t !== topic));
        setCompletedCount(prev => prev + 1);
      }
    }

    setIsBatching(false);
    toast.success('Batch generation complete!');
  };

  const handleToggleTopic = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      setSelectedTopics(topics.map(t => t.topic));
    } else {
      setSelectedTopics([]);
    }
  };

  const handleEditArticle = (article) => {
    setCurrentArticle(article);
  };

  const handleSaveComplete = () => {
    setCurrentArticle(null);
    setSelectedTopics([]);
  };

  return (
    <>
      <SEOHelmet 
        pageKey="admin-content-manager"
        url="/admin/content-manager"
      />
      <div className="min-h-screen flex flex-col bg-background dark:bg-slate-950">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold font-serif mb-2">Content Manager</h1>
              <p className="text-muted-foreground">Use AI to discover trending topics and generate SEO-optimized tennis articles.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Search & Generation */}
              <div className="lg:col-span-1 space-y-6">
                <TennisTopicSearch 
                  onSearch={handleSearchTopics}
                  isSearching={isSearching}
                  topics={topics}
                  selectedTopics={selectedTopics}
                  onToggleTopic={handleToggleTopic}
                  onSelectAll={handleSelectAll}
                />

                <Tabs defaultValue="single" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single</TabsTrigger>
                    <TabsTrigger value="batch">Batch</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="single" className="mt-4">
                    <AIArticleGenerator 
                      selectedTopics={selectedTopics}
                      onGenerate={handleGenerateSingle}
                      isGenerating={isGenerating}
                    />
                  </TabsContent>
                  
                  <TabsContent value="batch" className="mt-4">
                    <BatchArticleGenerator 
                      selectedTopics={selectedTopics}
                      onStartBatch={handleStartBatch}
                      isBatching={isBatching}
                      queue={queue}
                      completedCount={completedCount}
                    />
                  </TabsContent>
                </Tabs>

                <ArticleManagementList onEdit={handleEditArticle} />
              </div>

              {/* Right Column: Article Editor */}
              <div className="lg:col-span-2">
                <ArticlePreviewEditor 
                  article={currentArticle}
                  onSaveComplete={handleSaveComplete}
                />
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ContentManagerPage;
