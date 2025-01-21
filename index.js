const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())

app.listen(3000)


// day1 : 
// 1. create BE server
// 2. param, query ,body

// ex) http://localhost:3000/stw-cgi/test?action=view&msubmenu=continuous
// * param => first(stw-cgi), second(test)
// * query => ?action=view&msubmenu=continuous
// * body => 
app.get('/:first/:second', function (req, res) {
	const { first } = req.params;
  const { second } = req.params;
  const query = req.query;
  console.log(query);

  if (!query.action || !query.msubmenu) {
    return res.status(400).send("error : 'Missing required query'");
  }

  const resposne = {
    'ac' : query.action,
    'sub' : query.msubmenu
  }
  res.json(resposne);
})
