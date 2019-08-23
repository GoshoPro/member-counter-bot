const prefix = process.env.DISCORD_PREFIX;
const owners = process.env.BOT_OWNERS.split(/,\s?/);
const GuildModel = require('../../mongooseModels/GuildModel');
const updateCounter = require('../utils/updateCounter');

const enable = {
    name: "enable",
    commands: [prefix+"enable"],
    allowedTypes: ["text"],
    indexZero: true, 
    enabled: true,
    run: (client, message, language) => {
        if (message.member.hasPermission('ADMINISTRATOR') || owners.includes(message.member.id)) {
            GuildModel.findOneAndUpdate({ guild_id:message.guild.id }, {  }, {upsert: true, new: true})
            .then((result) => {
                const newChannel = (message.mentions.channels.size > 0 ) ? message.mentions.channels.first() : message.channel;
                if (!result.channel_id.includes(newChannel.id)) {
                    result.channel_id = [ ...result.channel_id, newChannel.id ];
                    result.save().then(() => {
                        message.channel.send(language.commands.enable.success.replace("{CHANNEL}", newChannel.toString())).catch(console.error);
                        updateCounter(client, message.guild.id);
                    }).catch(console.error);
                } else {
                    message.channel.send(language.commands.enable.error_already_enabled).catch(console.error);
                }
            })
            .catch((e) => {
                console.error(e);
                message.channel.send(language.commands.enable.error_unknown).catch(console.error)
            });
        } else {
            message.channel.send(language.commands.enable.error_no_admin).catch(console.error)
        }
    }
}

const disable = {
    name: "disable",
    commands: [prefix+"disable"],
    allowedTypes: ["text"],
    indexZero: true, 
    enabled: true,
    run: (client, message, language) => {
        if (message.member.hasPermission('ADMINISTRATOR') || owners.includes(message.member.id)) {
            GuildModel.findOneAndUpdate({guild_id:message.guild.id}, {}, {upsert: true})
                .then((result) => {
                    const channelToRemove = (message.mentions.channels.size > 0 ) ? message.mentions.channels.first() : message.channel;
                    result.channel_id = result.channel_id.filter(element => element !== channelToRemove.id);
                    result.save()
                        .then(() => {
                            channelToRemove.setTopic('').catch(console.error);
                            message.channel.send(language.commands.disable.success.replace("{CHANNEL}", channelToRemove.toString())).catch(console.error)
                        })
                        .catch(console.error);
                })
                .catch((e) => {
                    console.error(e);
                    message.channel.send(language.commands.disable.error_unknown).catch(console.error)
                });
        } else {
            message.channel.send(language.commands.disable.error_no_admin).catch(console.error)
        }
    }
}

const list = {
    name: "list",
    commands: [prefix+"list"],
    allowedTypes: ["text"],
    indexZero: true, 
    enabled: true,
    run: (client, message, language) => {
        if (message.member.hasPermission('ADMINISTRATOR') || owners.includes(message.member.id)) {
            GuildModel.findOne({ guild_id:message.guild.id })
            .then((result) => {
                if (result) {
                    if (result.channel_id.length === 0) { 
                        message.channel.send(language.commands.list.no_channels).catch(console.error);
                    } else {
                        let msg = language.commands.list.list;
                        result.channel_id.forEach((channel, i) => {
                            msg += ` <#${channel}>${(i === result.channel_id.length-1) ? '.' : ','}`; 
                        });
                        message.channel.send(msg).catch(console.error);   
                    }
                } else {
                    message.channel.send(language.commands.list.no_channels).catch(console.error);
                }
            })
        } else {
            message.channel.send(language.commands.list.error_no_admin).catch(console.error)
        }
    }
}

const reset = {
    name: "reset",
    commands: [prefix+"reset"],
    allowedTypes: ["text"],
    indexZero: true, 
    enabled: true,
    run: (client, message, language) => {
        if (message.member.hasPermission('ADMINISTRATOR') || owners.includes(message.member.id)) {
            GuildModel.findOneAndRemove({ guild_id:message.guild.id })
            .then((result) => {
                if (result) {
                    result.channel_id.forEach(channel_id => {
                        client.channels.get(channel_id).setTopic('').catch(console.error)
                    });
                }
                message.channel.send(language.commands.reset.done).catch(console.error);
            }).catch(e => {
                message.channel.send(language.commands.reset.error_unknown).catch(console.error)
            })
        } else {
            message.channel.send(language.commands.reset.error_no_admin).catch(console.error)
        }
    }
}

const setDigit = {
    name: "setDigit",
    commands: [prefix+"setDigit"],
    allowedTypes: ["text"],
    indexZero: true,
    enabled: true,
    run: (client, message, language) => {
        if (message.member.hasPermission('ADMINISTRATOR') || owners.includes(message.member.id)) {
            const args = message.content.split(" ");
            if (args.length === 3) {
                const digitToUpdate = args[1].slice(0, 1);
                const newDigitValue = args[2];
                GuildModel.findOne({guild_id:message.guild.id})
                .then((guild_settings) => {
                    guild_settings.custom_numbers[digitToUpdate] = newDigitValue
                    guild_settings.save()
                    .then(() => {
                        message.channel.send(language.commands.setDigit.success).catch(console.error);
                        updateCounter(client, message.guild.id);
                    })
                })
                .catch(() => {
                    message.channel.send(language.commands.setDigit.error_unknown).catch(console.error)
                })
            } else {
                message.channel.send(language.commands.setDigit.error_missing_params).catch(console.error)
            }
        } else {
            message.channel.send(language.commands.setDigit.error_no_admin).catch(console.error)
        }
    }
}

const setTopic = {
    name: "setTopic",
    commands: [prefix+"setTopic"],
    allowedTypes: ["text"],
    indexZero: true,
    enabled: true,
    run: (client, message, language) => {
        if (message.member.hasPermission('ADMINISTRATOR') || owners.includes(message.member.id)) {
            const args = message.content.split(" ");
            if (args.length > 1) {
                const newTopic = message.content.slice((prefix+"setTopic ").length);
                GuildModel.findOneAndUpdate({guild_id:message.guild.id}, {topic: newTopic})
                .then(() => {
                    message.channel.send(language.commands.setTopic.success).catch(console.error)
                    updateCounter(client, message.guild.id);
                })
                .catch(() => {
                    message.channel.send(language.commands.setTopic.error_unknown).catch(console.error)
                })
            } else {
                message.channel.send(language.commands.setTopic.error_missing_params).catch(console.error)
            }
        } else {
            message.channel.send(language.commands.setTopic.error_no_admin).catch(console.error)
        }
    }
}

const update = {
    name: "update",
    commands: [prefix+"update"],
    allowedTypes: ["text"],
    indexZero: true,
    enabled: true,
    run: (client, message, language) => {
        if (message.member.hasPermission('ADMINISTRATOR') || owners.includes(message.member.id)) {
            updateCounter(client, message.guild.id);
            message.channel.send(language.commands.update.success).catch(console.error);
        } else {
            message.channel.send(language.commands.update.error_no_admin).catch(console.error);
        }
    }
}

module.exports = [ enable, disable, list, reset, setDigit, setTopic, update ];