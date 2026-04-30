/**
 * Extracts YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * 
 * @param {string} url - The YouTube URL
 * @returns {string|null} - The video ID or null if invalid
 */
export const getYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

/**
 * Generates YouTube thumbnail URL from video ID
 * @param {string} videoId - The YouTube video ID
 * @param {string} quality - Thumbnail quality: 'maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'
 * @returns {string} - The thumbnail URL
 */
export const getYouTubeThumbnail = (videoId, quality = 'mqdefault') => {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};