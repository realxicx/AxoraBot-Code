import discord
from discord.ext import commands
import datetime
import asyncio
import os  # Needed to read the Environment Variable

# --- CONFIGURATION ---
# This grabs the token you saved in GitHub Secrets
TOKEN = os.getenv("DISCORD_TOKEN") 
PREFIX = "!"
INTENTS = discord.Intents.all()

bot = commands.Bot(command_prefix=PREFIX, intents=INTENTS, help_command=None)

# --- SIMPLE DATABASE ---
elo_data = {} 
whitelisted_users = [] 
log_channel_id = None
bad_words = ["scam", "hack", "nuke"] 

# --- EVENTS: AUTOMOD & ELO ---
@bot.event
async def on_ready():
    print(f'✅ Pixora Engine Online | Security: Environment Variables Active')
    await bot.change_presence(activity=discord.Game(name="Managing LivingLegend & Ausan"))

@bot.event
async def on_message(message):
    if message.author.bot or not message.guild: return

    # 1. Automod: Anti-Bad Words
    if any(word in message.content.lower() for word in bad_words):
        await message.delete()
        await message.channel.send(f"{message.author.mention}, that language is not allowed!", delete_after=3)
        return

    # 2. Automod: Anti-Link
    if "http" in message.content or "discord.gg" in message.content:
        if not message.author.guild_permissions.manage_messages:
            await message.delete()
            await message.channel.send("🚫 Links are not allowed here.", delete_after=3)
            return

    # 3. ELO System (1 message = 1 ELO)
    user_id = message.author.id
    elo_data[user_id] = elo_data.get(user_id, 0) + 1
    
    if elo_data[user_id] % 100 == 0:
        await message.channel.send(f"🎉 {message.author.mention} reached **{elo_data[user_id]} ELO**!")

    await bot.process_commands(message)

# --- ANTI-NUKE EVENT ---
@bot.event
async def on_guild_channel_delete(channel):
    async for entry in channel.guild.audit_logs(action=discord.AuditLogAction.channel_delete, limit=1):
        executor = entry.user
        if executor.id not in whitelisted_users and executor.id != channel.guild.owner_id:
            try:
                await channel.guild.ban(executor, reason="Anti-Nuke: Unauthorized Channel Deletion")
                await channel.clone(reason="Anti-Nuke: Restoring Channel")
            except:
                print("Failed to ban nunker - Check bot permissions!")

# --- MODERATION COMMANDS (Example Set) ---

@bot.command()
@commands.has_permissions(ban_members=True)
async def ban(ctx, member: discord.Member, *, reason="No reason"):
    await member.ban(reason=reason)
    await ctx.send(f"🔨 **{member}** has been banned | {reason}")

@bot.command()
@commands.has_permissions(manage_messages=True)
async def clear(ctx, amount: int):
    await ctx.channel.purge(limit=amount + 1)
    await ctx.send(f"🧹 Cleared {amount} messages.", delete_after=3)

@bot.command()
@commands.has_permissions(manage_channels=True)
async def nuke(ctx):
    pos = ctx.channel.position
    new = await ctx.channel.clone()
    await ctx.channel.delete()
    await new.edit(position=pos)
    await new.send("☢️ **Channel Nuked.**")

@bot.command()
async def staffnotice(ctx, *, text):
    if not ctx.author.guild_permissions.manage_messages: return
    embed = discord.Embed(title="📢 STAFF NOTICE", description=text, color=discord.Color.gold())
    embed.set_footer(text=f"Pixora Team | Manager: {ctx.author.name}")
    await ctx.send(embed=embed)

@bot.command()
async def whitelist(ctx, user: discord.User):
    if ctx.author.id == ctx.guild.owner_id:
        whitelisted_users.append(user.id)
        await ctx.send(f"🛡️ {user.name} is now whitelisted.")

# --- HELP COMMAND ---
@bot.command()
async def help(ctx):
    embed = discord.Embed(title="Pixora Bot Menu", color=discord.Color.blue())
    embed.add_field(name="Commands", value="`ban`, `kick`, `clear`, `nuke`, `lock`, `unlock`, `staffnotice`, `whitelist`", inline=False)
    await ctx.send(embed=embed)

# Final check to make sure TOKEN exists
if TOKEN:
    bot.run(TOKEN)
else:
    print("❌ ERROR: DISCORD_TOKEN not found in Settings Variables!")
              
