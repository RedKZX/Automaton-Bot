const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economySchema = require('../../schemas/economySchema');

module.exports = {
    usableInDms: false,
    category: "Economy",
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw money from your bank')
        .addStringOption(option => 
            option.setName('amount')
                .setDescription('Amount to withdraw (number or "all")')
                .setRequired(true)),
        
    async execute(interaction, client) {
        const { guild, user } = interaction;
        const amountInput = interaction.options.getString('amount');
        
        let data = await economySchema.findOne({ Guild: guild.id, User: user.id });
        
        if (!data) {
            return interaction.reply({
                content: "You don't have an economy account yet. Create one using `/economy create`!",
                ephemeral: true
            });
        }
        
        let amount;

        if (amountInput.toLowerCase() === 'all') {
            amount = data.Bank;
        } else {
            amount = parseInt(amountInput);

            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({
                    content: "Please enter a valid positive amount or 'all'.",
                    ephemeral: true
                });
            }
        }

        if (amount > data.Bank) {
            return interaction.reply({
                content: `You don't have that much money in your bank. You only have **$${data.Bank.toLocaleString()}**.`,
                ephemeral: true
            });
        }

        data.Bank -= amount;
        data.Wallet += amount;
        data.CommandsRan += 1;
        
        await data.save();
        
        const embed = new EmbedBuilder()
            .setColor(client.config.embedEconomyColor || '#00FF00')
            .setTitle('💸 Money Withdrawn')
            .setDescription(`You have withdrawn **$${amount.toLocaleString()}** from your bank.`)
            .addFields(
                { name: '💰 New Wallet Balance', value: `$${data.Wallet.toLocaleString()}`, inline: true },
                { name: '🏦 New Bank Balance', value: `$${data.Bank.toLocaleString()}`, inline: true }
            )
            .setFooter({ text: `${guild.name} Economy`, iconURL: guild.iconURL() })
            .setTimestamp();
            
        return interaction.reply({ embeds: [embed] });
    }
};
