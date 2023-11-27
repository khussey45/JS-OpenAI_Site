const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const apiUrl = 'https://api.openai.com/v1/engines/davinci/completions';
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Set up Handlebars view engine
app.set('views', path.join(__dirname, "/Views"));
app.engine('hbs', exphbs({
    extname: '.hbs',
    defaultLayout: 'layout',
    layoutsDir: path.join(__dirname, "/Views/layouts")
}));
app.set('view engine', 'hbs');

// Serve static files from the root directory
app.use(express.static(__dirname));
app.use(bodyParser.json());

// Import and use your main router
const indexRouter = require('./Routers/index');
app.use('/', indexRouter);

app.post('/generate-speech', async (req, res) => {
    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: req.body.text
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const speechFilePath = path.join(__dirname, 'speech.mp3');
        await fs.promises.writeFile(speechFilePath, buffer);

        res.json({ url: '/speech.mp3' });
    } catch (error) {
        console.error('Error generating speech:', error);
        res.status(500).send('Error generating speech');
    }
});

// Story generation function using OpenAI
async function generateStory(prompt) {
    const headers = {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
    };

    const data = {
        model: "text-davinci-003", 
        prompt: prompt,
        max_tokens: 500
    };

    try {
        const response = await axios.post('https://api.openai.com/v1/completions', data, { headers: headers });
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error('Error generating story:', error);
        throw error;  // Rethrow the error to be handled by the caller
    }
}

// POST route for generating a story
app.post('/generate-story', async (req, res) => {
    try {
        // You can modify the prompt as needed or get it from the request
        const story = await generateStory("Write a story about a programmer that discovered aliens");
        res.json({ story: story });
    } catch (error) {
        console.error('Error in /generate-story route:', error);
        res.status(500).send('Error generating story');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
