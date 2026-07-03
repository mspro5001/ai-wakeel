const logger = require('../../utils/logger');

async function analyze(params = {}) {
  const uploader = require('./uploader');
  const result = await uploader.getAnalytics(params);
  
  if (!result.success) return result;
  
  const summary = {
    totalVideos: result.videos.length,
    totalViews: result.videos.reduce((s, v) => s + (v.stats?.view_count || 0), 0),
    totalLikes: result.videos.reduce((s, v) => s + (v.stats?.like_count || 0), 0),
    totalComments: result.videos.reduce((s, v) => s + (v.stats?.comment_count || 0), 0),
    topVideo: result.videos.sort((a, b) => (b.stats?.view_count || 0) - (a.stats?.view_count || 0))[0] || null,
  };
  
  logger.info('TikTokAnalytics', 'Analysis complete', summary);
  return { success: true, summary, videos: result.videos };
}

module.exports = { analyze };
