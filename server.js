const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');

const app = express();
app.use(express.static(__dirname+'/public/'))
// app.use(bodyParser());
// app.use(cors());

app.get('/room', (req, res, next) => {
  const roomId = parseInt(Math.random()*36**6).toString(36);
  // TODO make sure room ID not already in use
  res.send({room: roomId})
});


app.listen(process.env.PORT || 4001);
// test comment
