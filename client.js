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

    // معالجات فارغة للتوافق
    getAvatarCommands() { return []; }
    getControlCommands() { return []; }
    getConsoleCommands() { return []; }
    getPublishingCommands() { return []; }
    getTagCommands() { return []; }

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