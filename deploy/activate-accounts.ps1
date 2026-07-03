Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  AI Wakeel - Account Activation Guide" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. NVIDIA NIM API KEY
# ============================================
Write-Host "1. NVIDIA NIM API Key (مجاني)" -ForegroundColor Yellow
Write-Host "   ─────────────────────────" -ForegroundColor Yellow
Write-Host "   الخطوات:" -ForegroundColor White
Write-Host "   1. افتح https://build.nvidia.com" -ForegroundColor White
Write-Host "   2. سجّل دخول بحساب NVIDIA أو أنشئ حساباً" -ForegroundColor White
Write-Host "   3. اذهب إلى 'Get API Key'" -ForegroundColor White
Write-Host "   4. انسخ المفتاح (يبدأ بـ nvapi-...)" -ForegroundColor White
Write-Host "   5. أضفه في ملف .env: NVIDIA_NIM_API_KEY=nvapi-..." -ForegroundColor Green
Write-Host ""

# ============================================
# 2. GMAIL APP PASSWORD
# ============================================
Write-Host "2. Gmail App Password" -ForegroundColor Yellow
Write-Host "   ─────────────────" -ForegroundColor Yellow
Write-Host "   البريد: islamsaib100@gmail.com" -ForegroundColor White
Write-Host "   الخطوات:" -ForegroundColor White
Write-Host "   1. افتح https://myaccount.google.com/apppasswords" -ForegroundColor White
Write-Host "   2. سجّل دخول بحساب Gmail" -ForegroundColor White
Write-Host "   3. اختر 'Mail' و 'Windows Computer'" -ForegroundColor White
Write-Host "   4. انسخ كلمة المرور المكونة من 16 حرفاً" -ForegroundColor White
Write-Host "   5. أضفها في .env: EMAIL_PASS=xxxx xxxx xxxx xxxx" -ForegroundColor Green
Write-Host ""

# ============================================
# 3. WHATSAPP BUSINESS
# ============================================
Write-Host "3. WhatsApp Business API" -ForegroundColor Yellow
Write-Host "   ─────────────────────" -ForegroundColor Yellow
Write-Host "   الخطوات:" -ForegroundColor White
Write-Host "   1. افتح https://business.whatsapp.com" -ForegroundColor White
Write-Host "   2. أنشئ حساب WhatsApp Business" -ForegroundColor White
Write-Host "   3. اذهب إلى Meta Developer Dashboard" -ForegroundColor White
Write-Host "   4. أنشئ تطبيق → أضف WhatsApp المنتج" -ForegroundColor White
Write-Host "   5. احصل على: Phone Number ID + Access Token" -ForegroundColor White
Write-Host "   6. أضفهما في .env:" -ForegroundColor Green
Write-Host "      WHATSAPP_PHONE_NUMBER_ID=your_id" -ForegroundColor Green
Write-Host "      WHATSAPP_ACCESS_TOKEN=your_token" -ForegroundColor Green
Write-Host ""

# ============================================
# 4. TIKTOK DEVELOPER
# ============================================
Write-Host "4. TikTok Developer" -ForegroundColor Yellow
Write-Host "   ────────────────" -ForegroundColor Yellow
Write-Host "   الخطوات:" -ForegroundColor White
Write-Host "   1. افتح https://developers.tiktok.com" -ForegroundColor White
Write-Host "   2. أنشئ حساب مطور" -ForegroundColor White
Write-Host "   3. أنشئ تطبيق → اختر Video Upload" -ForegroundColor White
Write-Host "   4. احصل على: Client Key + Client Secret + Access Token" -ForegroundColor White
Write-Host "   5. أضفهم في .env" -ForegroundColor Green
Write-Host ""

# ============================================
# 5. CONTENTREWARDS
# ============================================
Write-Host "5. ContentRewards" -ForegroundColor Yellow
Write-Host "   ──────────────" -ForegroundColor Yellow
Write-Host "   الخطوات:" -ForegroundColor White
Write-Host "   1. افتح https://contentrewards.com" -ForegroundColor White
Write-Host "   2. أنشئ حساباً جديداً" -ForegroundColor White
Write-Host "   3. أضف بيانات الدخول في .env:" -ForegroundColor White
Write-Host "      CONTENTREWARDS_USERNAME=your_username" -ForegroundColor Green
Write-Host "      CONTENTREWARDS_PASSWORD=your_password" -ForegroundColor Green
Write-Host ""

# ============================================
# 6. RENDER.COM
# ============================================
Write-Host "6. Render.com (إستضافة مجانية)" -ForegroundColor Yellow
Write-Host "   ───────────────────────────" -ForegroundColor Yellow
Write-Host "   الخطوات:" -ForegroundColor White
Write-Host "   1. افتح https://render.com" -ForegroundColor White
Write-Host "   2. سجّل بحساب GitHub" -ForegroundColor White
Write-Host "   3. ارفع المشروع إلى GitHub" -ForegroundColor White
Write-Host "   4. في Render: New + Blueprint → اختر المستودع" -ForegroundColor White
Write-Host "   5. أضف المتغيرات البيئية (Environment Variables)" -ForegroundColor White
Write-Host "   6. Deploy → تلقائياً!" -ForegroundColor White
Write-Host ""

# ============================================
# SUMMARY
# ============================================
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  بعد تفعيل كل شيء:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  1. عدّل ملف .env ببياناتك" -ForegroundColor White
Write-Host "  2. شغّل: npm start" -ForegroundColor White
Write-Host "  3. افتح: http://localhost:3000" -ForegroundColor White
Write-Host "  4. كلمة المرور الافتراضية: wakeel123" -ForegroundColor White
Write-Host "  5. استمتع بالوكيل الذكي! 🚀" -ForegroundColor White
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
