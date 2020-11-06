const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();
app.use(express.static(__dirname+'/public/'))
// app.use(bodyParser());
// app.use(cors());
app.use(morgan('tiny'));

app.get('/room', (req, res, next) => {
  const roomId = parseInt(Math.random()*36**6).toString(36);
  // TODO make sure room ID not already in use
  res.send({room: roomId})
});


const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log('Listening on port: '+PORT);
});
