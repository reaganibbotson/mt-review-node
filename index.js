const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
	destination: '/files',
	filename: function(req, res, cb){
		cb(null, `${Date.now()} ${path.extname(file.originalname)}`)
	}
})
const upload = multer({storage: storage});

const upload = multer({ storage });

const db = knex({
  client: 'pg',
  // connection: {
  //   connectionString: process.env.DATABASE_URL,
  //   ssl: true,
  // }
  	connection: {
  		host: 'ec2-54-83-29-34.compute-1.amazonaws.com',
  		database: 'd75fsn04uibvce',
  		user:'yfgudxsuxjwxdm',
  		password:'3958146339deb45eaa7f4ba8a74983fd5a5d1ad2ee063b64c629546cc539dc1c',
  		ssl: true,
  		port: 5432
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
});

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
});

app.get('/resort/:resort_id', (req, res)=>{
	const { resort_id } = req.params;
	db.raw(`
		SELECT *
		FROM resorts res
		left join (
			select 
				resort_id,
				avg(total_score) as total_score, 
				avg(powder_score) as powder_score, 
				avg(crowd_score) as crowd_score, 
				avg(village_score) as village_score, 
				avg(price_score) as price_score
			from reviews
			group by resort_id
		) rev
		on res.resort_id = rev.resort_id
		where res.resort_id = ${resort_id}
	`)
	.then(data=>{
		console.log(data.rows[0])
		res.status(200).json(data.rows[0])
	})
	.catch(err=>res.status(400).json(`Unable to retrieve resort info. ${err}`))
});

app.post('/signup',(req, res)=>{
	console.log(req.body);
	const { email, username, password } = req.body;
	if(!email || !username || !password){
		res.status(400).json('Incorrect form data');
	}else{
		const hash = bcrypt.hashSync(password, 10);
		db.insert({
			'email':email,
			'username': username,
			'hash':hash
		})
		.into('users')
		.returning('*')
		.then(user=> res.status(200).json(user[0]))
		.catch(err=> res.status(400).json('Unable to signup, dickwit'))
	}
});

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
				return db.select('email', 'username', 'user_id').from('users').where('email','=', email)
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
});

app.put('/leavereview', (req, res)=>{
	console.log(req.body);
	const { user_id, resort_id, total_score, powder_score, crowd_score, village_score, price_score } = req.body;
	if(!user_id){
		res.status(400).json('Must be signed in to leave review');
	}else{
		db.insert({
			'user_id': user_id,
			'resort_id': resort_id,
			'total_score': total_score,
			'powder_score': powder_score,
			'crowd_score': crowd_score,
			'village_score': village_score,
			'price_score':  price_score
		}).into('reviews')
		.then(res.status(200).json('Review submitted'))
		.catch(res.status(400).json('Error submitting review'))
	}
});

app.post('/uploadFile', upload.single('file'), (req, res)=>{
	const file = req.file
	const body = req.body
	console.log('File = ' + file)
	console.log('Body = ' + body)
	if (!req.file) {
		console.log('No file')
		res.status(400).json('No file yo')
	} else {
		console.log('File uploaded')
		res.status(200).json('File uploaded all g')
	}
});

app.listen(process.env.PORT || 3000, ()=>{
	console.log(`shitfuckball listening on ${process.env.PORT || 3000}`);
});