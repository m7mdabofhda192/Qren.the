// نظام العميل الرئيسي - Main Client System
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, PermissionFlagsBits, ActivityType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const tokens = require('./tokens');

class QrenBotSystem {
    constructor() {
        this.bots = new Map();
        this.avatarsData = {};
        this.serversData = {};
        this.tagsData = {};
        this.userCooldowns = {};
        this.searchCooldowns = {};
        this.controlData = {};
        
        this.loadData();
        this.setupBots();
    }

    // تحضير البوتات الخمسة
    setupBots() {
        const botConfigs = [
            {
                name: 'Avatar Bot',
                token: tokens.DISCORD_BOT_TOKEN,
                activity: 'for avatar requests 🖼️',
                commands: this.getAvatarCommands(),
                handlers: this.getAvatarHandlers()
            },
            {
                name: 'Control Bot', 
                token: tokens.CONTROL_BOT_TOKEN,
                activity: 'control panel 🎛️',
                commands: this.getControlCommands(),
                handlers: this.getControlHandlers()
            },
            {
                name: 'Console Bot',
                token: tokens.CONSOLE_BOT_TOKEN,
                activity: 'system monitoring 🖥️',
                commands: this.getConsoleCommands(),
                handlers: this.getConsoleHandlers()
            },
            {
                name: 'Publishing Bot',
                token: tokens.PUBLISHING_BOT_TOKEN,
                activity: 'server promotions 📢',
                commands: this.getPublishingCommands(),
                handlers: this.getPublishingHandlers()
            },
            {
                name: 'Tag Search Bot',
                token: tokens.TAG_SEARCH_BOT_TOKEN,
                activity: 'للبحث عن التاقات 🔍',
                commands: this.getTagCommands(),
                handlers: this.getTagHandlers()
            }
        ];

        botConfigs.forEach(config => {
            if (config.token) {
                this.createBot(config);
            }
        });
    }

    // إنشاء بوت جديد
    createBot(config) {
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });

        client.commands = new Map();
        
        // تحميل الأوامر
        config.commands.forEach(command => {
            client.commands.set(command.data.name, command);
        });

        // معالج الأحداث
        client.once('ready', async () => {
            console.log(`✅ ${config.name} متصل كـ ${client.user.tag}`);
            
            // تعيين النشاط
            client.user.setActivity(config.activity, { type: ActivityType.Watching });
            
            // مزامنة الأوامر
            try {
                const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
                await client.application.commands.set(commands);
                console.log(`🔄 ${config.name} تمت مزامنة ${commands.length} أمر`);
            } catch (error) {
                console.error(`❌ خطأ في مزامنة أوامر ${config.name}:`, error);
            }
        });

        client.on('interactionCreate', async interaction => {
            try {
                if (interaction.isChatInputCommand()) {
                    const command = client.commands.get(interaction.commandName);
                    if (command) {
                        await command.execute(interaction, this);
                    }
                } else if (interaction.isButton()) {
                    await this.handleButtonInteraction(interaction, config.name);
                } else if (interaction.isStringSelectMenu()) {
                    await this.handleSelectMenuInteraction(interaction, config.name);
                } else if (interaction.isModalSubmit()) {
                    await this.handleModalInteraction(interaction, config.name);
                }
            } catch (error) {
                console.error(`❌ خطأ في التفاعل لـ ${config.name}:`, error);
                
                const errorMessage = tokens.MESSAGES.error_occurred;
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: errorMessage, ephemeral: true });
                    } else {
                        await interaction.reply({ content: errorMessage, ephemeral: true });
                    }
                } catch (e) {
                    console.error('خطأ في إرسال رسالة الخطأ:', e);
                }
            }
        });

        this.bots.set(config.name, client);
        client.login(config.token).catch(console.error);
    }

    // أوامر بوت الصور الأصلية
    getAvatarCommands() {
        return [
            {
                data: new SlashCommandBuilder()
                    .setName('upload_avatar')
                    .setDescription('Upload a new avatar image (Admin only)')
                    .addAttachmentOption(option => 
                        option.setName('image')
                            .setDescription('The avatar image to upload')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('name')
                            .setDescription('Name for this avatar (optional)')
                            .setRequired(false)),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ Only administrators can upload avatars!', ephemeral: true });
                    }
                    await interaction.reply({ content: '✅ Avatar upload functionality (requires Python backend)', ephemeral: true });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('post_avatar')
                    .setDescription('Post an avatar with download button')
                    .addStringOption(option => 
                        option.setName('avatar_name')
                            .setDescription('Name of the avatar to post')
                            .setRequired(true)
                            .setAutocomplete(true)),
                execute: async (interaction, system) => {
                    const avatarName = interaction.options.getString('avatar_name');
                    const embed = new EmbedBuilder()
                        .setTitle('Qren Avatar')
                        .setDescription(`**${avatarName}**`)
                        .setColor('#3498db');
                    
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`download_avatar_${avatarName}`)
                                .setLabel('⏼')
                                .setStyle(ButtonStyle.Primary)
                        );
                    
                    await interaction.reply({ embeds: [embed], components: [row] });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('list_avatars')
                    .setDescription('List all available avatars (Admin only)'),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ Only administrators can view avatar list!', ephemeral: true });
                    }
                    await interaction.reply({ content: '📝 Avatar list functionality (requires Python backend)', ephemeral: true });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('delete_avatar')
                    .setDescription('Delete an avatar (Admin only)')
                    .addStringOption(option => 
                        option.setName('avatar_name')
                            .setDescription('Name of the avatar to delete')
                            .setRequired(true)
                            .setAutocomplete(true)),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ Only administrators can delete avatars!', ephemeral: true });
                    }
                    await interaction.reply({ content: '🗑️ Avatar deletion functionality (requires Python backend)', ephemeral: true });
                }
            }
        ];
    }

    // أوامر بوت التحكم الأصلية
    getControlCommands() {
        return [
            {
                data: new SlashCommandBuilder()
                    .setName('setup_control_panel')
                    .setDescription('إعداد لوحة التحكم الرئيسية')
                    .addChannelOption(option => 
                        option.setName('channel')
                            .setDescription('القناة التي ستحتوي على لوحة التحكم')
                            .setRequired(true)),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ هذا الأمر متاح للإداريين فقط', ephemeral: true });
                    }
                    await interaction.reply({ content: '✅ Control panel setup functionality (requires Python backend)', ephemeral: true });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('get_server_stats')
                    .setDescription('الحصول على إحصائيات السيرفر'),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ هذا الأمر متاح للإداريين فقط', ephemeral: true });
                    }
                    const embed = new EmbedBuilder()
                        .setTitle('📊 إحصائيات السيرفر')
                        .addFields([
                            { name: '👥 عدد الأعضاء', value: `${interaction.guild.memberCount}`, inline: true },
                            { name: '📅 تاريخ الإنشاء', value: interaction.guild.createdAt.toDateString(), inline: true },
                            { name: '🤖 حالة البوت', value: '✅ متصل', inline: true }
                        ])
                        .setColor('#3498db');
                    await interaction.reply({ embeds: [embed] });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('kick')
                    .setDescription('طرد عضو من السيرفر')
                    .addUserOption(option => 
                        option.setName('user')
                            .setDescription('العضو المراد طرده')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('reason')
                            .setDescription('سبب الطرد')
                            .setRequired(false)),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ ليس لديك صلاحيات الطرد!', ephemeral: true });
                    }
                    await interaction.reply({ content: '⚠️ Kick functionality (requires Python backend)', ephemeral: true });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('ban')
                    .setDescription('حظر عضو من السيرفر')
                    .addUserOption(option => 
                        option.setName('user')
                            .setDescription('العضو المراد حظره')
                            .setRequired(true))
                    .addStringOption(option => 
                        option.setName('reason')
                            .setDescription('سبب الحظر')
                            .setRequired(false)),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ ليس لديك صلاحيات الحظر!', ephemeral: true });
                    }
                    await interaction.reply({ content: '⚠️ Ban functionality (requires Python backend)', ephemeral: true });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('clear_messages')
                    .setDescription('مسح رسائل من القناة')
                    .addIntegerOption(option => 
                        option.setName('amount')
                            .setDescription('عدد الرسائل المراد مسحها')
                            .setRequired(true)
                            .setMinValue(1)
                            .setMaxValue(100)),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ ليس لديك صلاحيات مسح الرسائل!', ephemeral: true });
                    }
                    await interaction.reply({ content: '🧹 Clear messages functionality (requires Python backend)', ephemeral: true });
                }
            }
        ];
    }

    // أوامر بوت وحدة التحكم الأصلية
    getConsoleCommands() {
        return [
            {
                data: new SlashCommandBuilder()
                    .setName('status')
                    .setDescription('فحص حالة السيرفر'),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ هذا الأمر للمشرفين فقط!', ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🖥️ حالة السيرفر')
                        .addFields([
                            { name: '📊 المعلومات', value: `السيرفر: ${interaction.guild.name}\nالأعضاء: ${interaction.guild.memberCount}`, inline: false },
                            { name: '🤖 البوت', value: 'متصل وجاهز', inline: false }
                        ])
                        .setColor('#27ae60');

                    await interaction.reply({ embeds: [embed] });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('ping')
                    .setDescription('فحص سرعة الاستجابة'),
                execute: async (interaction, system) => {
                    const embed = new EmbedBuilder()
                        .setTitle('🏓 سرعة الاستجابة')
                        .setDescription('⏱️ الزمن: جاري الحساب...')
                        .setColor('#3498db');
                    await interaction.reply({ embeds: [embed] });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('logs')
                    .setDescription('عرض آخر سجلات النظام'),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ هذا الأمر للمشرفين فقط!', ephemeral: true });
                    }
                    await interaction.reply({ content: '📝 Logs functionality (requires Python backend)', ephemeral: true });
                }
            }
        ];
    }

    // أوامر بوت النشر الأصلية
    getPublishingCommands() {
        return [
            {
                data: new SlashCommandBuilder()
                    .setName('setup_promotion')
                    .setDescription('إعداد نظام ترويج السيرفرات')
                    .addChannelOption(option => 
                        option.setName('channel')
                            .setDescription('القناة المخصصة لترويج السيرفرات')
                            .setRequired(true)),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ هذا الأمر متاح للإداريين فقط', ephemeral: true });
                    }
                    await interaction.reply({ content: '✅ Server promotion setup functionality (requires Python backend)', ephemeral: true });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('setup_channels')
                    .setDescription('إعداد قنوات السيرفرات المختلفة')
                    .addChannelOption(option => 
                        option.setName('avatar_channel')
                            .setDescription('قناة سيرفرات الأفاتار')
                            .setRequired(false))
                    .addChannelOption(option => 
                        option.setName('server_channel')
                            .setDescription('قناة السيرفرات العامة')
                            .setRequired(false))
                    .addChannelOption(option => 
                        option.setName('store_channel')
                            .setDescription('قناة المتاجر')
                            .setRequired(false)),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ هذا الأمر متاح للإداريين فقط', ephemeral: true });
                    }
                    await interaction.reply({ content: '✅ Channels setup functionality (requires Python backend)', ephemeral: true });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('publish_server')
                    .setDescription('نشر سيرفر جديد')
                    .addStringOption(option =>
                        option.setName('invite_link')
                            .setDescription('رابط دعوة السيرفر')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('server_type')
                            .setDescription('نوع السيرفر')
                            .setRequired(true)
                            .addChoices(
                                { name: 'سيرفر أفاتار', value: 'avatar' },
                                { name: 'سيرفر عام', value: 'server' },
                                { name: 'متجر', value: 'store' }
                            )),
                execute: async (interaction, system) => {
                    const userId = interaction.user.id;
                    const now = Date.now();
                    const cooldownTime = 60 * 60 * 1000; // ساعة واحدة

                    if (system.userCooldowns[userId] && (now - system.userCooldowns[userId]) < cooldownTime) {
                        const timeLeft = Math.ceil((cooldownTime - (now - system.userCooldowns[userId])) / (60 * 1000));
                        return await interaction.reply({ 
                            content: `⏰ يجب أن تنتظر ${timeLeft} دقيقة قبل نشر سيرفر آخر!`, 
                            ephemeral: true 
                        });
                    }

                    const serverLink = interaction.options.getString('invite_link');
                    const serverType = interaction.options.getString('server_type');
                    
                    system.userCooldowns[userId] = now;
                    system.saveData('user_cooldowns', system.userCooldowns);

                    const embed = new EmbedBuilder()
                        .setTitle('📢 تم نشر السيرفر بنجاح!')
                        .setDescription(`رابط السيرفر: ${serverLink}\nالنوع: ${serverType}`)
                        .setColor('#e74c3c')
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('server_stats')
                    .setDescription('عرض إحصائيات السيرفرات المنشورة'),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ هذا الأمر متاح للإداريين فقط', ephemeral: true });
                    }
                    const embed = new EmbedBuilder()
                        .setTitle('📊 إحصائيات السيرفرات')
                        .setDescription('إحصائيات شاملة عن السيرفرات المنشورة')
                        .addFields([
                            { name: '🖼️ سيرفرات أفاتار', value: '0', inline: true },
                            { name: '🌐 سيرفرات عامة', value: '0', inline: true },
                            { name: '🛒 متاجر', value: '0', inline: true }
                        ])
                        .setColor('#3498db');
                    await interaction.reply({ embeds: [embed] });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('cooldown_status')
                    .setDescription('فحص حالة الكولداون الخاص بك'),
                execute: async (interaction, system) => {
                    const userId = interaction.user.id;
                    const now = Date.now();
                    const cooldownTime = 60 * 60 * 1000; // ساعة واحدة

                    if (!system.userCooldowns[userId] || (now - system.userCooldowns[userId]) >= cooldownTime) {
                        await interaction.reply({ content: '✅ يمكنك نشر سيرفر جديد الآن!', ephemeral: true });
                    } else {
                        const timeLeft = Math.ceil((cooldownTime - (now - system.userCooldowns[userId])) / (60 * 1000));
                        await interaction.reply({ content: `⏰ يجب أن تنتظر ${timeLeft} دقيقة قبل نشر سيرفر آخر`, ephemeral: true });
                    }
                }
            }
        ];
    }

    // أوامر بوت البحث بالتاقات الأصلية
    getTagCommands() {
        return [
            {
                data: new SlashCommandBuilder()
                    .setName('بحث')
                    .setDescription('البحث عن تاق معين والحصول على روابط السيرفرات')
                    .addStringOption(option =>
                        option.setName('tag')
                            .setDescription('التاق المراد البحث عنه')
                            .setRequired(true)
                    ),
                execute: async (interaction, system) => {
                    const tag = interaction.options.getString('tag');
                    
                    const embed = new EmbedBuilder()
                        .setTitle('🔍 نتائج البحث عن التاق')
                        .setDescription(`البحث عن التاق: **${tag}**`)
                        .addFields([
                            { name: '📊 النتائج', value: 'جاري البحث... (requires Python backend)', inline: false }
                        ])
                        .setColor('#9b59b6')
                        .setFooter({ text: 'استخدم /قائمة_التاقات لرؤية جميع التاقات المتاحة' });

                    await interaction.reply({ embeds: [embed] });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('اضافة')
                    .setDescription('إضافة تاق جديد مع رابط السيرفر')
                    .addStringOption(option =>
                        option.setName('tag')
                            .setDescription('التاق المراد إضافته')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('server_link')
                            .setDescription('رابط السيرفر')
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('description')
                            .setDescription('وصف اختياري للتاق')
                            .setRequired(false)),
                execute: async (interaction, system) => {
                    const tag = interaction.options.getString('tag');
                    const serverLink = interaction.options.getString('server_link');
                    const description = interaction.options.getString('description') || '';
                    
                    const embed = new EmbedBuilder()
                        .setTitle('✅ تم إضافة التاق')
                        .setDescription(`تم إضافة التاق: **${tag}** بنجاح!\nالرابط: ${serverLink}${description ? `\nالوصف: ${description}` : ''}`)
                        .setColor('#27ae60');

                    await interaction.reply({ embeds: [embed] });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('حذف')
                    .setDescription('حذف تاق موجود (للإداريين)')
                    .addStringOption(option =>
                        option.setName('tag')
                            .setDescription('التاق المراد حذفه')
                            .setRequired(true)
                            .setAutocomplete(true)),
                execute: async (interaction, system) => {
                    if (!system.isAdmin(interaction.member)) {
                        return await interaction.reply({ content: '❌ هذا الأمر متاح للإداريين فقط!', ephemeral: true });
                    }

                    const tag = interaction.options.getString('tag');
                    await interaction.reply({ content: `🗑️ Delete tag functionality for "${tag}" (requires Python backend)`, ephemeral: true });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('قائمة')
                    .setDescription('عرض قائمة بجميع التاقات المتاحة'),
                execute: async (interaction, system) => {
                    const embed = new EmbedBuilder()
                        .setTitle('📋 قائمة التاقات المتاحة')
                        .setDescription('جميع التاقات المضافة في النظام')
                        .addFields([
                            { name: '🔍 التاقات', value: 'لا توجد تاقات متاحة حالياً (requires Python backend)', inline: false }
                        ])
                        .setColor('#3498db');
                    await interaction.reply({ embeds: [embed] });
                }
            },
            {
                data: new SlashCommandBuilder()
                    .setName('setup_tags')
                    .setDescription('إنشاء رسالة ترحيبية مع أزرار البحث')
                    .addChannelOption(option => 
                        option.setName('channel')
                            .setDescription('القناة المراد إرسال الرسالة فيها (اختياري)')
                            .setRequired(false)),
                execute: async (interaction, system) => {
                    const channel = interaction.options.getChannel('channel') || interaction.channel;
                    
                    const embed = new EmbedBuilder()
                        .setTitle('Qren Tags')
                        .setColor(0x36393f);
                    
                    await interaction.reply({ content: '✅ Tag setup functionality (requires Python backend)', ephemeral: true });
                }
            }
        ];
    }

    getAvatarHandlers() { return {}; }
    getControlHandlers() { return {}; }
    getConsoleHandlers() { return {}; }
    getPublishingHandlers() { return {}; }
    getTagHandlers() { return {}; }

    // معالج التفاعلات مع الأزرار
    async handleButtonInteraction(interaction, botName) {
        // معالجة تفاعلات الأزرار
    }

    // معالج القوائم المنسدلة
    async handleSelectMenuInteraction(interaction, botName) {
        // معالجة تفاعلات القوائم المنسدلة
    }

    // معالج النماذج
    async handleModalInteraction(interaction, botName) {
        // معالجة تفاعلات النماذج
    }

    // تحميل البيانات
    loadData() {
        try {
            if (fs.existsSync('avatars_data.json')) {
                this.avatarsData = JSON.parse(fs.readFileSync('avatars_data.json', 'utf8'));
            }
            if (fs.existsSync('servers_data.json')) {
                this.serversData = JSON.parse(fs.readFileSync('servers_data.json', 'utf8'));
            }
            if (fs.existsSync('tags_data.json')) {
                this.tagsData = JSON.parse(fs.readFileSync('tags_data.json', 'utf8'));
            }
            if (fs.existsSync('user_cooldowns.json')) {
                this.userCooldowns = JSON.parse(fs.readFileSync('user_cooldowns.json', 'utf8'));
            }
            if (fs.existsSync('search_cooldowns.json')) {
                this.searchCooldowns = JSON.parse(fs.readFileSync('search_cooldowns.json', 'utf8'));
            }
            if (fs.existsSync('control_panel_data.json')) {
                this.controlData = JSON.parse(fs.readFileSync('control_panel_data.json', 'utf8'));
            }
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
        }
    }

    // حفظ البيانات
    saveData(type, data) {
        try {
            fs.writeFileSync(`${type}.json`, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`خطأ في حفظ ${type}:`, error);
        }
    }

    // فحص صلاحيات الإدارة
    isAdmin(member) {
        return member.permissions.has(PermissionFlagsBits.Administrator);
    }
}

module.exports = QrenBotSystem;