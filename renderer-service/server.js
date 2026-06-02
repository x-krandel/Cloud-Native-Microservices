const express = require('express');
const app = express();


const HOST  = '127.0.0.1';
const PORT = 1337;



app.set('views', __dirname);
app.set('view engine', 'ejs');


app.get('/', async (req, res) => {

    const url = req.query.url;

    if (!url) {
        return res.status(400).send("Bad Request: Missing 'url' query parameter");
    }
    try{
        var request = await fetch(url);
        var data = await request.text();
        return res.status(200).send(data);
    } catch (error) {
        return res.status(500).send("Internal Server Error: Unable to fetch the URL");
    }


});

app.listen(PORT, HOST, () => {
    console.log(`Renderer Service is running on: http://${HOST}:${PORT}`);
});
