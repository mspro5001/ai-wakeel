const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');

const patterns = {
  video_edit: /(قص|دمج|أضف نص|قص الفيديو|تعديل الفيديو|video\s*(cut|edit|merge))/i,
  email_send: /(أرسل بريد|send email|راسل)/i,
  email_register: /(سجل في|register|اشتراك|تسجيل.*موقع)/i,
  tiktok_upload: /(تيك توك|tiktok|ارفع.*فيديو)/i,
  whatsapp_send: /(واتس|whatsapp|أرسل.*رسالة)/i,
  campaign_analyze: /(حملة|campaign|contentrewards|تحليل.*شروط)/i,
  browser_automate: /(تصفح|browser|افتح.*موقع|سجل.*دخول)/i,
};

async function interpret(command, context = {}) {
  if (config.nvidia.apiKey) {
    try {
      const response = await axios.post(`${config.nvidia.baseUrl}/llm/chat`, {
        messages: [{ role: 'user', content: `Parse this command into a task: "${command}". Return JSON with: type, action, params object, priority (high/medium/low). Only return JSON.` }],
        model: 'meta/llama-3.2-3b-instruct',
        temperature: 0.1,
      }, { headers: { Authorization: `Bearer ${config.nvidia.apiKey}` } });
      const result = JSON.parse(response.data.choices[0].message.content);
      return { ...result, original: command };
    } catch (e) {
      logger.warn('Interpreter', 'NVIDIA NIM failed, using fallback', e.message);
    }
  }
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(command)) {
      return { type, action: command, params: { text: command }, priority: 'medium', original: command };
    }
  }
  return { type: 'custom', action: command, params: { text: command }, priority: 'low', original: command };
}

module.exports = { interpret };
