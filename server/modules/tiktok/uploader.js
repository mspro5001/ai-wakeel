const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const config = require('../../config');
const logger = require('../../utils/logger');

async function upload(params) {
  const { videoPath, caption, scheduleTime } = params;
  if (!videoPath || !fs.existsSync(videoPath)) {
    return { success: false, error: 'Video file not found' };
  }
  if (!config.tiktok.accessToken) {
    return { success: false, error: 'TikTok not configured', setupRequired: true };
  }
  
  try {
    // TikTok API v2 video upload
    // Step 1: Initialize upload
    const initRes = await axios.post('https://open-api.tiktok.com/video/init/', {
      access_token: config.tiktok.accessToken,
      upload_url: 'https://open-api.tiktok.com/video/upload/',
      source: 'FILE_UPLOAD',
    });
    
    const { upload_url, upload_id } = initRes.data.data;
    
    // Step 2: Upload video file
    const form = new FormData();
    form.append('video', fs.createReadStream(videoPath));
    
    await axios.post(upload_url, form, {
      headers: { ...form.getHeaders(), 'Content-Type': 'multipart/form-data' },
    });
    
    // Step 3: Publish
    const publishRes = await axios.post('https://open-api.tiktok.com/video/publish/', {
      access_token: config.tiktok.accessToken,
      upload_id,
      privacy_level: 'PUBLIC',
      caption: caption || '',
      ...(scheduleTime ? { schedule_time: Math.floor(new Date(scheduleTime).getTime() / 1000) } : {}),
    });
    
    logger.info('TikTok', 'Video uploaded successfully', { postId: publishRes.data.data?.id });
    return { success: true, postId: publishRes.data.data?.id, caption };
  } catch (err) {
    logger.error('TikTok', 'Upload failed', err.response?.data || err.message);
    return { success: false, error: err.response?.data?.message || err.message };
  }
}

async function getAnalytics(params = {}) {
  if (!config.tiktok.accessToken) {
    return { success: false, error: 'TikTok not configured' };
  }
  try {
    const res = await axios.get('https://open-api.tiktok.com/video/list/', {
      params: { access_token: config.tiktok.accessToken, max_count: 20, ...params },
    });
    return { success: true, videos: res.data.data?.videos || [] };
  } catch (err) {
    return { success: false, error: err.message, videos: [] };
  }
}

module.exports = { upload, getAnalytics };
