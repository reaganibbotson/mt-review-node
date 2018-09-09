const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'Slinki124',
    database : 'postgres'
  }
});

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/signup',(req, res)=>{
	const { email, fullName, password } = req.body;
	const hash = bcrypt.hashSync(password, 10);
	db.insert({
		email:email,
		full_name: fullName,
		hash:hash
	})
	.into('users')
	.returning('full_name')
	.then(user=> res.status(400).json(user[0]))
	.catch(err=> res.status(400).json('Unable to signup, dickwit'))
})

app.post('/login', (req, res)=>{
	const { email, password } = req.body;
	db.select('email', 'hash').from('users')
	.where('email', '=',email)
	.then(data =>{
		const validPassword = bcrypt.compareSync(password, data[0].hash);
		if(validPassword){
			return db.select('email', 'full_name', 'user_id').from('users').where('email','=', email)
			.then(user=>{
				res.json(user[0]);
			})
			.catch(err=> res.status(400).json('Not a valid user'))
		} else {
			res.status(400).json('Invalid credentials')
		}
	})
	.catch(err=> res.status(400).json('Invalid credentials'))
})

app.listen(3000, ()=>{
	console.log("shitfuckball");
	db.select('*').from('users')
		.then(data=> console.log)
});
