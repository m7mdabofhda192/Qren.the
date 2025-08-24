// ملف التوكينات - Tokens Configuration
module.exports = {
    // توكينات البوتات
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || '',
    CONTROL_BOT_TOKEN: process.env.CONTROL_BOT_TOKEN || '',
    CONSOLE_BOT_TOKEN: process.env.CONSOLE_BOT_TOKEN || '',
    PUBLISHING_BOT_TOKEN: process.env.PUBLISHING_BOT_TOKEN || '',
    TAG_SEARCH_BOT_TOKEN: process.env.TAG_SEARCH_BOT_TOKEN || '',
    
    // إعدادات البوتات
    BOT_CONFIG: {
        prefix: '!',
        embed_color: 0x7289DA,
        max_file_size: 10 * 1024 * 1024, // 10MB
        allowed_extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        avatars_per_page: 10,
        publish_cooldown: 3600 // ساعة واحدة بالثواني
    },
    
    // أسماء القنوات
    CHANNELS: {
        avatar: 'سيرفر-افتار',
        server: 'سيرفر',
        store: 'متجر'
    },
    
    // رسائل النظام
    MESSAGES: {
        no_permission: '❌ ليس لديك الصلاحيات المطلوبة',
        error_occurred: '❌ حدث خطأ غير متوقع',
        cooldown_active: '⏰ يجب الانتظار قبل الاستخدام مرة أخرى',
        admin_only: '❌ هذا الأمر للمشرفين فقط'
    }
};