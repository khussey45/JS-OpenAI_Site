


const express = require('express'); 
const router = express.Router(); 


router.get('/', (req, res) => { 
    res.render('home');
    
});

router.get('/text_to_speech', (req, res) => { 
    res.render('text_to_speech');
});

router.get('/story', (req, res) => { 
    res.render('story');
});

router.get('/links', (req, res) => { 
    res.render('links');
});


module.exports = router; 
