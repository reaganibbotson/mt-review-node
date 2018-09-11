const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'reagan',
    password : 'Slinki124',
    database : 'postgres'
  }
});

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/home', (req, res)=>{
	db('resorts').distinct('region').select()
	.then(data=>{
		res.status(200).send(data);
	})
	.catch(err=>res.status(400).send('There was an error getting regions.' + err))
})

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

app.put('/leave-review', (req, res)=>{
	const { userID, resortID, overallRating, powderRating, crowdRating, villageRating, priceRating } = req.body;
	db.insert({
		user_id: userID,
		resort_id: resortID,
		total_score: overallRating,
		powder_score: powderRating,
		crowd_score: crowdRating,
		village_score: villageRating,
		price_score:  priceRating
	}).into('reviews')
	.then(res.status(200).json('Review submitted'))
	.catch(res.status(400).json('Error submitting review'))
})

app.post('/see-review', (req, res)=>{
	const { resortID } = req.body;
	db.select(db.raw(`
		resort_id, 
		avg(total_score) as total_score, 
		avg(powder_score) as powder_score, 
		avg(crowd_score) as crowd_score, 
		avg(village_score) as village_score, 
		avg(price_score) as price_score`))
	.from('reviews')
	.where('resort_id', '=', resortID)
	.groupBy('resort_id')
	.returning('resort_id')
	.then(data=>{
		res.status(200).json(data[0]);
	})
	.catch(err=> res.status(400).json('Unable to retrieve reviews'));
})

app.listen(3000, ()=>{
	console.log("shitfuckball");
});
