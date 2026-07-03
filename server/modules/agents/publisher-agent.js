const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const config = require('../../config');
const logger = require('../../utils/logger');
const { db } = require('../../database');

async function execute(input, context = {}) {
  const { videoPath, caption, campaignLink, campaignId, scheduleTime } = input;
  const sessionId = context.sessionId || Date.now().toString();

  logger.info('PublisherAgent', `Publishing for session ${sessionId}`);

  if (!config.tiktok.accessToken) {
    return { success: false, agent: 'publisher', error: 'TikTok not configured', setupRequired: true };
  }

  if (videoPath && !fs.existsSync(videoPath)) {
    return { success: false, agent: 'publisher', error: 'Video file not found', videoPath };
  }

  let tiktokResult = null;
  if (videoPath) {
    try {
      tiktokResult = await uploadToTikTok(videoPath, caption, scheduleTime);
    } catch (err) {
      logger.error('PublisherAgent', `TikTok upload failed: ${err.message}`);
      tiktokResult = { success: false, error: err.message };
    }
  }

  const postId = tiktokResult?.success ? Date.now().toString() + Math.random().toString(36).slice(2, 6) : null;

  if (postId) {
    db.prepare(`INSERT OR REPLACE INTO tiktok_posts (id, video_path, caption, status, platform_post_id, analytics)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      postId, videoPath || '', caption || '', 'published', tiktokResult.postId || '',
      JSON.stringify({ campaignLink, campaignId, sessionId })
    );
  }

  if (campaignId) {
    db.prepare(`UPDATE contentrewards_campaigns SET status = ? WHERE id = ?`)
      .run('linked_to_tiktok', campaignId);
  }

  return {
    success: true,
    agent: 'publisher',
    sessionId,
    summary: tiktokResult?.success
      ? `✅ نُشر الفيديو على TikTok (Post ID: ${tiktokResult.postId})${campaignLink ? ` وربط مع الحملة` : ''}`
      : '⚠️ لم ينشر الفيديو (قد لا يوجد فيديو للإرفاق)',
    tiktok: tiktokResult,
    linkedCampaign: campaignLink || null,
    linkedCampaignId: campaignId || null,
    postRecordId: postId,
  };
}

async function uploadToTikTok(videoPath, caption, scheduleTime) {
  const initRes = await axios.post('https://open-api.tiktok.com/video/init/', {
    access_token: config.tiktok.accessToken,
    upload_url: 'https://open-api.tiktok.com/video/upload/',
    source: 'FILE_UPLOAD',
  });

  const { upload_url, upload_id } = initRes.data.data;

  const form = new FormData();
  form.append('video', fs.createReadStream(videoPath));

  await axios.post(upload_url, form, {
    headers: { ...form.getHeaders(), 'Content-Type': 'multipart/form-data' },
  });

  const publishRes = await axios.post('https://open-api.tiktok.com/video/publish/', {
    access_token: config.tiktok.accessToken,
    upload_id,
    privacy_level: 'PUBLIC',
    caption: caption || '',
    ...(scheduleTime ? { schedule_time: Math.floor(new Date(scheduleTime).getTime() / 1000) } : {}),
  });

  logger.info('PublisherAgent', 'TikTok upload successful', { postId: publishRes.data.data?.id });
  return { success: true, postId: publishRes.data.data?.id, caption };
}

module.exports = { execute };
