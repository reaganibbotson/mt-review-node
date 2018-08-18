const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/signup',(req, res)=>{
	
})

app.listen(3000, ()=>{
	console.log("shitfuckball");
});
