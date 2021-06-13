const Discord = require('discord.js')

module.exports = {
    run: message => {
        message.channel.send(new Discord.MessageEmbed()
            .setTitle('Mon titre')
            .setTitle('Bonjour')
            .setDescription('[Recherche Google](https://google.fr) bonjour')
            .setColor('#6C00FF')
            .addField('Champ 1 bonjour', 'Bonjour c\'est moi', true)
            .addField('Champ 2', 'Blabla', true)
            .setAuthor('Tanjiro bonjour', 'https://cdn.discordapp.com/attachments/829142801677680693/837345510838370354/demon-slayer-film.png', 'https://google.fr')
            .setImage('https://cdn.discordapp.com/attachments/829142801677680693/837345804976783420/1069417.jpg')
            .setThumbnail('https://cdn.discordapp.com/attachments/829142801677680693/837345510838370354/demon-slayer-film.png')
            .setFooter('Mon bot perso bonjour', 'https://cdn.discordapp.com/attachments/829142801677680693/837345510838370354/demon-slayer-film.png')
            .setTimestamp()
            .setURL('https://google.fr'))
    },
    name: 'embed'
}