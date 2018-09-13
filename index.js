const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  }
});

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/regions', (req, res)=>{
	db.select(db.raw('distinct region'))
	.from('resorts')
	.then(data=>{
		res.status(200).json(data);
		console.log(data);
	})
	.catch(err=> res.status(400).json('Couldn\'t load regions. Error:' + err));
})

app.get('/resorts/:region', (req, res)=>{
	const { region } = req.params;
	console.log(region);
	db.select('resort_id', 'resort_name')
		.from('resorts')
		.where('region','=',region)
	.then(data=>{
		res.status(200).json(data);
		console.log(data);
	})
	.catch(err=>res.status(400).json('Unable to retrieve resort list' + err));
})

app.get('/resort:resort_id', (req, res)=>{
	const { resort_id } = req.params;
	db.select('resort_id', '')
})

app.post('/signup',(req, res)=>{
	const { email, fullName, password } = req.body;
	if(!email || !fullName || !password){
		res.status(400).json('Incorrect form data');
	}else{
		const hash = bcrypt.hashSync(password, 10);
		db.insert({
			email:email,
			username: username,
			hash:hash
		})
		.into('users')
		.returning('full_name')
		.then(user=> res.status(400).json(user[0]))
		.catch(err=> res.status(400).json('Unable to signup, dickwit'))
	}
})

app.post('/login', (req, res)=>{
	const { email, password } = req.body;
	if(!email || !password){
		res.status(400).json('Incorrect form data');
	}else{
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
	}
})

app.put('/leave-review', (req, res)=>{
	const { userID, resortID, overallRating, powderRating, crowdRating, villageRating, priceRating } = req.body;
	if(!userID){
		res.status(400).json('Must be signed in to leave review');
	}else{
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
	}
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

app.listen(process.env.PORT || 3000, ()=>{
	console.log("shitfuckball");
});