import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, Video, PlusCircle, ArrowDownWideNarrow } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import SEOHelmet from '@/components/SEOHelmet.jsx';
import VlogCard from '@/components/VlogCard.jsx';
import SubmitVlogModal from '@/components/SubmitVlogModal.jsx';
import VlogPreviewModal from '@/components/VlogPreviewModal.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const VlogsPage = () => {
  const { t } = useTranslation();
  const [vlogs, setVlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [previewVlog, setPreviewVlog] = useState(null);

  const fetchVlogs = async () => {
    setLoading(true);
    try {
      // Sort handling mapping to DB fields (fallback compatible)
      const sortMap = {
        'newest': '-createdAt',
        'oldest': '+createdAt',
        'most_viewed': '-viewCount'
      };

      const result = await pb.collection('vlogs').getList(1, 50, {
        filter: "status='published' || status='approved'", 
        sort: sortMap[sortBy] || '-createdAt',
        $autoCancel: false
      });
      setVlogs(result.items);
    } catch (error) {
      console.error('Error fetching vlogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVlogs();
  }, [sortBy]);

  const filteredVlogs = useMemo(() => {
    let result = [...vlogs];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(v => 
        v.title?.toLowerCase().includes(lower) || 
        v.channel_name?.toLowerCase().includes(lower) ||
        v.uploaderId?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [vlogs, searchTerm]);

  return (
    <>
      <SEOHelmet 
        title={t('vlogs.title', 'Tennis Vlogs & Videos')}
        description={t('vlogs.subtitle', 'Watch the latest tennis analyses, highlights, and behind-the-scenes content.')}
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-primary/5 border-b border-border py-16 md:py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="max-w-2xl text-center md:text-left"
                >
                  <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground font-serif text-balance">
                    {t('vlogs.title', 'Tennis Vlogs')}
                  </h1>
                  <p className="text-lg text-muted-foreground text-balance">
                    {t('vlogs.subtitle', 'Watch the latest tennis analyses, highlights, and behind-the-scenes content from our community.')}
                  </p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button 
                    size="lg" 
                    className="h-14 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                    onClick={() => setIsSubmitModalOpen(true)}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    {t('vlogs.submitButton', 'Submit Video')}
                  </Button>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-border">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={t('vlogs.searchPlaceholder', 'Search vlogs by title or channel...')}
                  className="pl-10 bg-background text-foreground"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <ArrowDownWideNarrow className="h-4 w-4 text-muted-foreground shrink-0 hidden md:block" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[180px] bg-background">
                    <SelectValue placeholder={t('vlogs.filterByDate', 'Sort by Date')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="most_viewed">Most Viewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Video Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
                    <Skeleton className="w-full aspect-video rounded-none" />
                    <div className="p-5 space-y-3 flex-1 flex flex-col">
                      <Skeleton className="h-6 w-[90%]" />
                      <div className="mt-auto space-y-2 pt-4">
                        <Skeleton className="h-4 w-[60%]" />
                        <Skeleton className="h-3 w-[40%]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVlogs.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredVlogs.map((vlog, index) => (
                    <motion.div
                      key={vlog.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.2) }}
                      className="h-full"
                    >
                      <VlogCard vlog={vlog} onClick={setPreviewVlog} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 px-4 border border-dashed border-border rounded-2xl bg-muted/20 max-w-2xl mx-auto"
              >
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="text-2xl font-semibold mb-3 text-foreground font-serif">No videos found</h3>
                <p className="text-muted-foreground text-lg mb-8">
                  {t('vlogs.noVideos', "We couldn't find any videos matching your search criteria.")}
                </p>
                <Button variant="outline" className="rounded-full px-8" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              </motion.div>
            )}
          </section>
        </main>

        <Footer />

        {/* Modals */}
        <SubmitVlogModal 
          isOpen={isSubmitModalOpen} 
          onClose={() => setIsSubmitModalOpen(false)} 
          onSuccess={fetchVlogs}
        />
        <VlogPreviewModal
          vlog={previewVlog}
          isOpen={!!previewVlog}
          onClose={() => setPreviewVlog(null)}
        />
      </div>
    </>
  );
};

export default VlogsPage;