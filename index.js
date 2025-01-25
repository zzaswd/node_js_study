const mongoose = require('mongoose');
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express()

app.use(cors())

/*
  /stw-cgi/policy.cgi?action=set&msubmenu=telecom&name=SKT
*/

// mongoose.connect('mongodb://localhost:27017/mydatabase', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('MongoDB 연결 성공'))
// .catch(err => console.error('MongoDB 연결 실패:', err));

// mongoose.connect('mongodb://localhost:27017/mydatabase') // local
const uri = 'mongodb+srv://sihyeong:tlguddl1Wkd!@cluster0.ae74r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0' ;

mongoose.connect(uri)
  .then(() => console.log('MongoDB Atlas 연결 성공'))
  .catch(err => console.error('MongoDB Atlas 연결 실패:', err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to the database!');
});

const itemSchema = new mongoose.Schema({
  msubmenu: String,
  name: String,
  date: { type: Date, default: Date.now },
  fee: Number
});

const Item = mongoose.model('Item', itemSchema);

app.use(bodyParser.json());


// app.use((req, res, next) => {
//   const paramPattern = /^\/[\w-]+\/[\w-]+$/;
//   if (!paramPattern.test(req.originalUrl)) {
//       // 링크 형식이 아닌 경우 400 에러를 반환합니다.
//       return res.status(400).send('잘못된 URL 형식입니다.');
//   }
//   next();
// });

app.get('/:first/:second', async (req, res) => {
  const {action, msubmenu, name} = req.query;
  
  if (action === 'set') {
    // Store to DB
    const data = new Data({name, msubmenu});
    await data.save();
    res.send(`first: ${req.params.first}, second: ${req.params.second} 
      Save data => {Name : ${name} ,msubmenu : ${msubmenu}}`);

  } else if (action === 'view') {
    const data = await Data.findOne({msubmenu});
    if (data) {
      const str = {
        name : data.name,
        msubmenu : data.msubmenu,
      };
      res.json(str);
    } else {
      res.send('No data found (msubmenu=${msubmenu})');
    }
  } else {
    res.send('Invalid action');
  }

});

app.post('/:cgi/:category', (req, res) => {
  const {cgi, category} = req.params;
  const action = req.query.action;
  const { msubmenu, name, date, number } = req.body;

  if (cgi !== 'stw-cgi') {
    return res.status(400).send('Invalid first parameter');
  }

  if (category !== 'policy.cgi') {
    return res.status(400).send('Invalid second parameter');
  }

  if (action === 'set') {
    const newItem = new Item({
      msubmenu,
      name,
      date: new Date(date),
      fee: Number(number)
    });

    newItem.save()
      .then(() => res.send('Document inserted'))
      .catch(err => res.send(err));
  } else if (action === 'view') {
    Item.find()
      .then(results => res.send(results))
      .catch(err => res.send(err));
  } else if (action === 'update') {
    Item.updateOne({ msubmenu }, {
      $set: {
        name,
        date: new Date(date),
        number: Number(number)
      }
    })
    .then(() => res.send('Document updated'))
    .catch(err => res.send(err));
  } else {
    res.send('Invalid action');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});





