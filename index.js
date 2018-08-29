const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'ribbotson',
    password : '',
    database : 'mt-review'
  }
});

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/signup',(req, res)=>{
	const { email, fullName, password } = req.body;
	const hash = bcrypt.hashSync(password, 10);
	db.transaction((trx)=>{
		db.insert({
			email: email, 
			password:hash
		})
		.into('login')
		.returning('email')
		.then((loginEmail)=>{
			return trx('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					name: fullName
				})
				.then(user=>{
					res.json(user[0]);
				})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err=> res.status(400).json('Unable to register dickwit'))
})

app.post('/login', (req, res)=>{
	const { email, password } = req.body;
	db.select('email', 'hash').from('login')
	.where('email', '=',email)
	.then(data =>{
		const validPassword = bcrypt.compareSync(password, data[0].hash);
		if(validPassword){
			return db.select('*').from('users').where('email','=', email)
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
});
