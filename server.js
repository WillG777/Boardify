const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
const morgan = require('morgan');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.static(__dirname+'/public/'))
// app.use(bodyParser());
// app.use(cors());
app.use(morgan('tiny'));

const db = new sqlite3.Database('./database.sqlite')
db.run(`CREATE TABLE Rooms (
  room_id TEXT not null primary key
)`)

app.get('/room', (req, res, next) => {
  // keep generating room IDs until we get a new one
  var roomId;
  (function generateRoomId() {
    roomId = parseInt(Math.random()*36**6).toString(36);
    db.get(`SELECT * FROM Rooms WHERE room_id=${roomId}`, row => {
      if (row) generateRoomId();
      else db.run(`INSERT INTO Rooms (room_id) VALUES ("${roomId}")`);
    })
  })();

  res.send({room: roomId})
});


const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log('Listening on port: '+PORT);
});
