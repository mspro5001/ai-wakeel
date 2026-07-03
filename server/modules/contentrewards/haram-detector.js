const logger = require('../../utils/logger');

const HARAM_KEYWORDS = {
  alcohol_drugs: {
    words: ['خمر', 'كحول', 'مشروبات روحية', 'بيرة', 'نبيذ', 'مسكر', 'مخدرات', 'حشيش', 'ماريخوانا', 'كوكايين', 'هيروين', 'تدخين', 'سجائر', 'vape', 'alcohol', 'beer', 'wine', 'liquor', 'drugs', 'marijuana', 'cocaine', 'heroin', 'cigarette', 'smoke', 'vape', 'weed'],
    reason: 'ترويج للخمر أو المخدرات - حرام'
  },
  gambling: {
    words: ['قمار', 'مراهنات', 'يانصيب', 'لوتو', 'بوكر', 'روليت', 'كازينو', 'gambling', 'betting', 'casino', 'poker', 'lottery', 'roulette', 'slot machine'],
    reason: 'ترويج للقمار والميسر - حرام'
  },
  adult_content: {
    words: ['إباحي', 'عاري', 'جنس', 'مواد إباحية', 'رومانسي', 'تعارف', 'زواج', 'مواعدة', 'dating', 'porn', 'nude', 'adult content', 'sex', 'escort', 'onlyfans'],
    reason: 'محتوى غير لائق أو ترويج للعلاقات المحرمة - حرام'
  },
  riba_usury: {
    words: ['ربا', 'فائدة', 'قرض بفائدة', 'بنك ربوي', 'فوائد بنكية', 'usury', 'interest loan', 'riba', 'payday loan'],
    reason: 'ترويج للربا - حرام'
  },
  haram_food: {
    words: ['لحم خنزير', 'خنزير', 'غير حلال', 'pork', 'non halal', 'non-halal', 'ham', 'bacon'],
    reason: 'ترويج لأكل محرم - حرام'
  },
  sorcery: {
    words: ['سحر', 'شعوذة', 'كهانة', 'تنجيم', 'عرافة', 'أبراج', 'sorcery', 'magic', 'fortune telling', 'horoscope', 'witchcraft', 'occult'],
    reason: 'ترويج للسحر والشعوذة - حرام'
  },
  blasphemy: {
    words: ['سب', 'تجديف', 'كفر', 'إلحاد', 'blasphemy', 'atheism', 'anti religion'],
    reason: 'محتوى يخالف التعاليم الإسلامية - حرام'
  },
  music_instruments: {
    words: ['آلات موسيقية', 'معازف', 'أغاني', 'music instruments', 'musical instruments', 'songs'],
    reason: 'ترويج للمعازف والآلات الموسيقية - مختلف في حكمه'
  },
  imitations: {
    words: ['تقليد', 'تشبه', 'شعر مستعار', 'وشم', 'tattoo', 'imitation', 'cross dressing'],
    reason: 'ترويج للتشبه المحرم - حرام'
  },
  fraud_scam: {
    words: ['احتيال', 'نصب', 'تزوير', 'scam', 'fraud', 'pyramid', 'ponzi', 'get rich quick'],
    reason: 'ترويج للاحتيال - حرام'
  },
};

const HARAM_CATEGORIES = Object.keys(HARAM_KEYWORDS);

async function detectHaram(text) {
  if (!text) return { hasHaram: false, violations: [], score: 100 };

  const lowerText = text.toLowerCase();
  const violations = [];

  for (const [category, config] of Object.entries(HARAM_KEYWORDS)) {
    const found = config.words.filter(w => lowerText.includes(w.toLowerCase()));
    if (found.length > 0) {
      violations.push({
        category,
        matchedWords: found,
        reason: config.reason,
        severity: getSeverity(category),
      });
    }
  }

  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.reduce((s, v) => s + v.severity, 0));

  return {
    hasHaram: violations.length > 0,
    violations,
    score,
    isHalal: violations.length === 0,
    summary: violations.length === 0
      ? '✅ الحملة متوافقة مع الضوابط الشرعية'
      : `⛔ الحملة تحتوي على ${violations.length} مخالفة شرعية`,
  };
}

function getSeverity(category) {
  const severe = ['adult_content', 'blasphemy', 'sorcery', 'fraud_scam'];
  const moderate = ['alcohol_drugs', 'gambling', 'riba_usury', 'haram_food'];
  const light = ['music_instruments', 'imitations'];

  if (severe.includes(category)) return 40;
  if (moderate.includes(category)) return 30;
  if (light.includes(category)) return 15;
  return 25;
}

async function filterCampaigns(campaigns) {
  const results = [];
  for (const campaign of campaigns) {
    const detection = await detectHaram(campaign.text || campaign.title || '');
    results.push({
      ...campaign,
      haramCheck: detection,
    });
  }

  const halal = results.filter(r => !r.haramCheck.hasHaram);
  const haram = results.filter(r => r.haramCheck.hasHaram);

  logger.info('HaramDetector', `Filtered ${results.length} campaigns: ${halal.length} halal, ${haram.length} haram`);

  return {
    all: results,
    halal,
    haram,
    halalCount: halal.length,
    haramCount: haram.length,
    total: results.length,
  };
}

module.exports = { detectHaram, filterCampaigns, HARAM_CATEGORIES, HARAM_KEYWORDS };
