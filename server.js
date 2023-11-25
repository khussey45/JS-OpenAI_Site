const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const OpenAI = require('openai');
const axios = require('axios');

require('dotenv').config();

const app = express();
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const apiUrl = 'https://api.openai.com/v1/engines/davinci/completions';

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

// Body Parser middleware to handle JSON data
app.use(bodyParser.json());

// Import and use your main router
const indexRouter = require('./Routers/index');
app.use('/', indexRouter);

// POST route for generating speech
app.post('/generate-speech', async (req, res) => {
    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: req.body.text
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const speechFilePath = path.join(__dirname, 'speech.mp3'); // Save in root directory
        await fs.promises.writeFile(speechFilePath, buffer);

        res.json({ url: '/speech.mp3' });
    } catch (error) {
        console.error('Error generating speech:', error);
        res.status(500).send('Error generating speech');
    }
});

app.post('/generate-story', async (req, res) => {
    try {
        const response = await axios.post(apiUrl, {
            prompt: "Write a short story about programmers solving AGI", // or any other prompt
            max_tokens: 150
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // Corrected this line
            }
        });

        const generatedText = response.data.choices[0].text;
        res.json({ story: generatedText });
    } catch (error) {
        console.error('Error generating story:', error.response ? error.response.data : error.message);
        res.status(500).send('Error generating story');
    }
});





// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
