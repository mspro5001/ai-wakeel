const axios = require('axios');
const config = require('../../config');
const logger = require('../../utils/logger');
const { db } = require('../../database');
const { detectHaram } = require('../contentrewards/haram-detector');

async function analyze(params) {
  const { text, url, platform } = params;

  const haramCheck = await detectHaram(text || '');

  if (config.nvidia.apiKey && text) {
    try {
      const response = await axios.post(`${config.nvidia.baseUrl}/llm/chat`, {
        messages: [{
          role: 'user',
          content: `Analyze these campaign requirements for compliance and Islamic law (Sharia) compliance. Return JSON only.\n\nRequirements:\n${text}\n\nReturn: { compliant: boolean, issues: string[], recommendations: string[], score: number (0-100), shariaCompliant: boolean }`,
        }],
        model: 'meta/llama-3.2-3b-instruct',
        temperature: 0.1,
      }, { headers: { Authorization: `Bearer ${config.nvidia.apiKey}` } });

      const analysis = JSON.parse(response.data.choices[0].message.content);

      const campaignId = Date.now().toString();
      const finalScore = Math.min(analysis.score || 0, haramCheck.score);
      db.prepare(`INSERT OR REPLACE INTO contentrewards_campaigns (id, campaign_name, platform, requirements, status, rules_analyzed, compliance_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        campaignId, `Analysis ${new Date().toLocaleDateString()}`, platform || 'unknown',
        JSON.stringify({ text, analysis, haramCheck }),
        haramCheck.hasHaram ? 'haram_rejected' : 'analyzed', 1, finalScore
      );

      return {
        success: true,
        campaignId,
        ...analysis,
        shariaCompliant: !haramCheck.hasHaram,
        haramCheck,
        finalScore,
      };
    } catch (err) {
      logger.warn('LegalAnalyzer', 'NVIDIA analysis failed, using basic', err.message);
    }
  }

  const issues = [];
  const recommendations = [];

  if (haramCheck.hasHaram) {
    for (const v of haramCheck.violations) {
      issues.push({ category: 'haram_' + v.category, message: v.reason, matchedWords: v.matchedWords });
    }
    recommendations.push('❌ هذه الحملة مرفوضة شرعاً - تجنبها');
  }

  if (text) {
    const lowerText = text.toLowerCase();
    const rules = {
      copyright: ['copyright', 'حقوق', 'ملكية', 'plagiarism', 'cc by'],
      privacy: ['privacy', 'خصوصية', 'gdpr', 'data collection'],
      disclosure: ['ad', 'إعلان', 'sponsored', 'paid', 'ممول', '#ad'],
    };

    for (const [category, keywords] of Object.entries(rules)) {
      const found = keywords.filter(k => lowerText.includes(k));
      if (found.length) issues.push({ category, keywords: found });
    }

    if (!lowerText.includes('disclaimer') && !lowerText.includes('إخلاء')) {
      recommendations.push('Add a disclaimer/disclosure statement');
    }
    if (!lowerText.includes('terms') && !lowerText.includes('شروط')) {
      recommendations.push('Ensure terms and conditions are linked');
    }
  }

  const score = haramCheck.hasHaram ? 0 : Math.max(10, 85 - issues.length * 10);

  return {
    success: true,
    compliant: !haramCheck.hasHaram && issues.length === 0,
    shariaCompliant: !haramCheck.hasHaram,
    issues,
    recommendations,
    haramCheck,
    score,
    source: 'basic',
  };
}

module.exports = { analyze };
