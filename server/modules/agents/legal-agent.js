const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');
const { db } = require('../../database');
const { detectHaram } = require('../contentrewards/haram-detector');

async function execute(input, context = {}) {
  const { text, campaignId, campaignName } = input;
  const sessionId = context.sessionId || Date.now().toString();

  logger.info('LegalAgent', `Analyzing terms for session ${sessionId}`);

  const haramCheck = await detectHaram(text || '');

  let analysis = {
    compliant: false,
    shariaCompliant: false,
    issues: [],
    recommendations: [],
    score: 0,
    modifiedContent: null,
    needsModification: false,
  };

  if (text) {
    const lowerText = text.toLowerCase();
    const rules = {
      copyright: ['copyright', 'حقوق', 'ملكية', 'plagiarism', 'cc by'],
      privacy: ['privacy', 'خصوصية', 'gdpr', 'data collection'],
      disclosure: ['ad', 'إعلان', 'sponsored', 'paid', 'ممول', '#ad'],
    };

    for (const [category, keywords] of Object.entries(rules)) {
      const found = keywords.filter(k => lowerText.includes(k));
      if (found.length) analysis.issues.push({ category, keywords: found });
    }

    if (!lowerText.includes('disclaimer') && !lowerText.includes('إخلاء')) {
      analysis.recommendations.push('أضف إخلاء مسؤولية (disclaimer)');
    }
    if (!lowerText.includes('terms') && !lowerText.includes('شروط')) {
      analysis.recommendations.push('تأكد من وجود رابط الشروط والأحكام');
    }
  }

  if (haramCheck.hasHaram) {
    for (const v of haramCheck.violations) {
      analysis.issues.push({ category: 'haram_' + v.category, message: v.reason, matchedWords: v.matchedWords });
    }
    analysis.recommendations.push('❌ هذه الحملة مرفوضة شرعاً - تجنب المحتوى المحرم');
    analysis.needsModification = true;
  }

  if (config.nvidia.apiKey && text) {
    try {
      const response = await axios.post(`${config.nvidia.baseUrl}/llm/chat`, {
        messages: [{
          role: 'user',
          content: `أنت مستشار شرعي وقانوني. حلل هذه الشروط واقترح تعديلات لتتوافق مع الشريعة الإسلامية. أعد JSON فقط.
          
الشروط:\n${text}\n
أعد: { compliant: boolean, issues: string[], recommendations: string[], score: number (0-100), shariaCompliant: boolean, modifiedVersion: string (النص المعدّل ليكون متوافقاً) }`,
        }],
        model: 'meta/llama-3.2-3b-instruct',
        temperature: 0.1,
      }, { headers: { Authorization: `Bearer ${config.nvidia.apiKey}` } });

      const nvidiaResult = JSON.parse(response.data.choices[0].message.content);
      analysis.compliant = nvidiaResult.compliant && !haramCheck.hasHaram;
      analysis.shariaCompliant = nvidiaResult.shariaCompliant && !haramCheck.hasHaram;
      analysis.score = Math.min(nvidiaResult.score || 50, haramCheck.score);
      analysis.modifiedContent = nvidiaResult.modifiedVersion || null;
      analysis.nvidiaAnalysis = true;
    } catch (err) {
      logger.warn('LegalAgent', `NVIDIA analysis failed: ${err.message}`);
    }
  }

  if (!analysis.nvidiaAnalysis) {
    analysis.compliant = !haramCheck.hasHaram && analysis.issues.length === 0;
    analysis.shariaCompliant = !haramCheck.hasHaram;
    analysis.score = haramCheck.hasHaram ? 0 : Math.max(10, 85 - analysis.issues.length * 10);
  }

  if (analysis.needsModification && !analysis.modifiedContent) {
    analysis.modifiedContent = `[معدّل شرعياً] ${text || ''}\n\n---\nإخلاء مسؤولية: هذا المحتوى معدّل ليتوافق مع الضوابط الشرعية.`;
  }

  if (campaignId) {
    db.prepare(`UPDATE contentrewards_campaigns SET status = ?, rules_analyzed = 1, compliance_score = ? WHERE id = ?`)
      .run(analysis.shariaCompliant ? 'halal_approved' : 'needs_review', analysis.score, campaignId);
  }

  logger.info('LegalAgent', `Session ${sessionId}: score=${analysis.score}, compliant=${analysis.compliant}`);

  return {
    success: true,
    agent: 'legal',
    sessionId,
    summary: analysis.shariaCompliant
      ? `✅ الحملة متوافقة شرعاً (النقاط: ${analysis.score})`
      : `⛔ الحملة بحاجة لتعديل - ${analysis.issues.length} مشكلة`,
    ...analysis,
    haramCheck,
  };
}

module.exports = { execute };
