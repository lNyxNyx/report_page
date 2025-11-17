const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 8080;
const path = require('path');
const router = require('./routes/router');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router);
app.listen(PORT, ()=>{
    console.log(`Server up | Porta:${PORT}`);
});
 
 