import 'dotenv/config';
import {REST, Routes} from 'discord.js';

    const rest = new REST().setToken(process.env.API_KEY);
    (async () =>
    {
        try {
            console.log('Started refreshing application (/) commands.');
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: [
                    {
                        name: 'test',
                        description: 'Test command',
                    },
                ] },
            );
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })
    
