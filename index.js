const Discord = require('discord.js'),
    client = new Discord.Client({
        fetchAllMembers: true,
        partials: ['MESSAGE', 'REACTION']
    }),
    config = require('./config.json'),
    fs = require('fs')
    humanizeDuration = require('humanize-duration'),
    cooldown  = new Set()
 
client.login(process.env.TOKEN)
client.commands = new Discord.Collection()
client.db = require('./db.json')
 
fs.readdir('./commands', (err, files) => {
    if (err) throw err
    files.forEach(file => {
        if (!file.endsWith('.js')) return
        const command = require(`./commands/${file}`)
        client.commands.set(command.name, command)
    })
})
 
client.on('message', message => {
    if (message.type !== 'DEFAULT' || message.author.bot) return

    if (!message.member.hasPermission('MANAGE_CHANNELS') && client.db.lockedChannels.includes(message.channel.id)) return message.delete()

    if (!message.member.hasPermission('MANAGE_MESSAGES')) {
        const duration = config.cooldown[message.channel.id]
        if (duration) {
            const id = `${message.channel.id}_${message.author.id}`
            if (cooldown.has(id)) {
                message.delete()
                return message.channel.send(`Ce salon est soumis a un cooldown de ${humanizeDuration(duration, {language: 'fr'})}.`).then(sent => sent.delete({timeout: 5e3}))
            }
            cooldown.add(id)
            setTimeout(() => cooldown.delete(id), duration)
        }
    }
 
    const args = message.content.trim().split(/ +/g)
    const commandName = args.shift().toLowerCase()
    if (!commandName.startsWith(config.prefix)) return
    const command = client.commands.get(commandName.slice(config.prefix.length))
    if (!command) return
    if (command.guildOnly && !message.guild) return message.channel.send('Cette commande ne peut être utilisée que dans un serveur.')
    command.run(message, args, client)
})
 
client.on('guildMemberAdd', member => {
    member.guild.channels.cache.get(config.greeting.channel).send(`${member}`, new Discord.MessageEmbed()
        .setDescription(`🎉 **__${member} a rejoint le serveur. Nous sommes ${member.guild.memberCount} !__** 🎉`)
        .setColor('#6C00FF'))
    member.roles.add(config.greeting.role)
})
 
client.on('messageReactionAdd', (reaction, user) => {
    if (!reaction.message.guild || user.bot) return
    const reactionRoleElem = config.reactionRole[reaction.message.id]
    if (!reactionRoleElem) return
    const prop = reaction.emoji.id ? 'id' : 'name'
    const emoji = reactionRoleElem.emojis.find(emoji => emoji[prop] === reaction.emoji[prop])
    if (emoji) reaction.message.guild.member(user).roles.add(emoji.roles)
    else reaction.users.remove(user)
})
 
client.on('messageReactionRemove', (reaction, user) => {
    if (!reaction.message.guild || user.bot) return
    const reactionRoleElem = config.reactionRole[reaction.message.id]
    if (!reactionRoleElem || !reactionRoleElem.removable) return
    const prop = reaction.emoji.id ? 'id' : 'name'
    const emoji = reactionRoleElem.emojis.find(emoji => emoji[prop] === reaction.emoji[prop])
    if (emoji) reaction.message.guild.member(user).roles.remove(emoji.roles)
})

client.on('ready', () => {
    const statuses = [
        () => `${client.guilds.cache.size} serveurs`,
        () => `${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} utilisateurs`
    ]
    let i = 0
    setInterval(() => {
        client.user.setActivity(statuses[i](), {type: 'STREAMING', url: 'https://twitch.tv/nozomu'})
        i = ++i % statuses.length
    }, 1e4)
    setInterval(() => {
        const [bots, humans] = client.guilds.cache.first().members.cache.partition(member => member.user.bot)
        client.channels.cache.get(config.serverStats.humans).setName(`𝐦𝐞𝐦𝐛𝐫𝐞 : ${humans.size}`)
        client.channels.cache.get(config.serverStats.bots).setName(`𝐛𝐨𝐭 : ${bots.size}`)
        client.channels.cache.get(config.serverStats.total).setName(`Total : ${client.guilds.cache.first().memberCount}`)
    }, 3e4)
})

client.on('channelCreate', channel => {
    if (!channel.guild) return
    const muteRole = channel.guild.roles.cache.find(role => role.name === 'Muted')
    if (!muteRole) return
    channel.createOverwrite(muteRole, {
        SEND_MESSAGES: false,
        CONNECT: false,
        ADD_REACTIONS: false
    })
})
