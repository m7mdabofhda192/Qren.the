// الملف الرئيسي لتشغيل نظام البوتات - Main Entry Point
const express = require('express');
const QrenBotSystem = require('./client');
const tokens = require('./tokens');

// إعداد الخادم للحفاظ على النشاط
const app = express();
const PORT = process.env.PORT || 5000;

// خادم Keep-Alive
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'نظام بوتات Qren يعمل',
        timestamp: new Date().toISOString(),
        bots: [
            'Avatar Bot - بوت الأفاتار',
            'Control Bot - بوت التحكم', 
            'Console Bot - بوت الكونسول',
            'Publishing Bot - بوت النشر',
            'Tag Search Bot - بوت البحث بالعلامات'
        ]
    });
});

// معلومات النظام
app.get('/status', (req, res) => {
    res.json({
        system: 'Qren Discord Bot System',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// بدء الخادم
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 خادم Keep-Alive يعمل على المنفذ ${PORT}`);
    console.log('🌟 ═══════════════════════════════════════');
    console.log('🚀 Qren Discord Bot System Starting');
    console.log('🔄 Multi-Bot System Initializing');
    console.log('🛡️ Auto-Recovery Enabled');
    console.log('🌟 ═══════════════════════════════════════');
});

// بدء نظام البوتات
try {
    const botSystem = new QrenBotSystem();
    console.log('✅ تم تهيئة نظام البوتات بنجاح');
    
    // معالج الإغلاق الصحيح
    process.on('SIGINT', () => {
        console.log('🛑 إيقاف النظام...');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('🛑 إنهاء النظام...');
        process.exit(0);
    });
    
    // معالج الأخطاء العامة
    process.on('uncaughtException', (error) => {
        console.error('💥 خطأ غير معالج:', error);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 رفض غير معالج:', reason);
    });
    
} catch (error) {
    console.error('❌ خطأ في تشغيل النظام:', error);
    process.exit(1);
}

// رسالة الإكمال
console.log('🎉 نظام Qren Discord Bot System جاهز للعمل!');
console.log('📝 للاستخدام على GitHub و Render');
console.log('🔧 تأكد من إعداد متغيرات البيئة بالتوكينات المطلوبة');