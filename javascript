const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'moderation',
    description: 'All 30+ Moderation Commands',
    async execute(message, command, args, db) {
        const hasPerm = (perm) => message.member.permissions.has(perm);

        switch (command) {
            case 'ban':
                if (!hasPerm(PermissionFlagsBits.BanMembers)) return message.reply("❌ No perms!");
                const banUser = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
                if (!banUser) return message.reply("Mention a user.");
                await banUser.ban({ reason: args.slice(1).join(" ") || "No reason" });
                message.reply(`🚫 **${banUser.user.tag}** has been banned.`);
                break;

            case 'kick':
                if (!hasPerm(PermissionFlagsBits.KickMembers)) return message.reply("❌ No perms!");
                const kickUser = message.mentions.members.first();
                if (!kickUser) return message.reply("Mention a user.");
                await kickUser.kick(args.slice(1).join(" ") || "No reason");
                message.reply(`👢 **${kickUser.user.tag}** kicked.`);
                break;

            case 'purge':
            case 'clear':
                if (!hasPerm(PermissionFlagsBits.ManageMessages)) return;
                let amt = parseInt(args[0]);
                if (!amt || amt > 100) return message.reply("Amount 1-100.");
                await message.channel.bulkDelete(amt, true);
                message.channel.send(`🧹 Cleared ${amt} messages.`).then(m => setTimeout(() => m.delete(), 3000));
                break;

            case 'mute':
            case 'timeout':
                if (!hasPerm(PermissionFlagsBits.ModerateMembers)) return;
                const tUser = message.mentions.members.first();
                const mins = parseInt(args[1]) || 10;
                if (tUser) {
                    await tUser.timeout(mins * 60000, args.slice(2).join(" "));
                    message.reply(`⏳ **${tUser.user.tag}** muted for ${mins}m.`);
                }
                break;

            case 'nuke':
                if (!hasPerm(PermissionFlagsBits.ManageChannels)) return;
                message.channel.clone().then(c => {
                    c.setPosition(message.channel.position);
                    message.channel.delete();
                    c.send("☢️ **Channel Nuked Successfully.**");
                });
                break;

            case 'lock':
                if (!hasPerm(PermissionFlagsBits.ManageChannels)) return;
                message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
                message.reply("🔒 Channel Locked.");
                break;

            case 'unlock':
                if (!hasPerm(PermissionFlagsBits.ManageChannels)) return;
                message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true });
                message.reply("🔓 Channel Unlocked.");
                break;

            case 'slowmode':
                if (!hasPerm(PermissionFlagsBits.ManageChannels)) return;
                message.channel.setRateLimitPerUser(args[0] || 0);
                message.reply(`⏲️ Slowmode set to ${args[0] || 0}s.`);
                break;

            case 'warn':
                const wUser = message.mentions.users.first();
                if (!wUser) return message.reply("Mention someone.");
                db.add(`warns_${message.guild.id}_${wUser.id}`, 1);
                const count = db.get(`warns_${message.guild.id}_${wUser.id}`);
                message.reply(`⚠️ **${wUser.tag}** warned. (Total: ${count})`);
                break;

            case 'clearwarns':
                const cwUser = message.mentions.users.first();
                if (cwUser) {
                    db.delete(`warns_${message.guild.id}_${cwUser.id}`);
                    message.reply(`✅ Warns cleared for ${cwUser.tag}.`);
                }
                break;

            case 'lockdown':
                if (!hasPerm(PermissionFlagsBits.Administrator)) return;
                message.guild.channels.cache.forEach(channel => {
                    if (channel.isTextBased()) channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
                });
                message.reply("🚨 **SERVER ON LOCKDOWN.** All channels locked.");
                break;

            case 'unlockdown':
                if (!hasPerm(PermissionFlagsBits.Administrator)) return;
                message.guild.channels.cache.forEach(channel => {
                    if (channel.isTextBased()) channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true });
                });
                message.reply("🔓 Lockdown lifted.");
                break;
            
            // Note: You can keep adding cases here for all 30 commands!
        }
    }
};
      
