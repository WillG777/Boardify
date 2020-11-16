const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
const morgan = require('morgan');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.static(__dirname+'/public/'))
// app.use(bodyParser());
// app.use(cors());
app.use(morgan('dev'));

const db = new sqlite3.Database('./database.sqlite')
db.run(`CREATE TABLE IF NOT EXISTS Rooms (
  room_id TEXT not null primary key,
  num_players INTEGER not null default 1
)`)

app.post('/room', (req, res, next) => {
  // keep generating room IDs until we get a new one
  var roomId;
  (function generateRoomId() {
    roomId = parseInt(Math.random()*36**6).toString(36);
    db.get(`SELECT * FROM Rooms WHERE room_id=${roomId}`, row => {
      if (row) generateRoomId();
      else db.run(`INSERT INTO Rooms (room_id) VALUES ("${roomId}")`);
    })
  })();

  res.status(201).send({room: roomId})
});

app.delete('/room/:roomId', (req, res, next) => {
  db.serialize(()=>{
    db.run(`UPDATE Rooms SET num_players = num_players-1 WHERE room_id=$roomId`, {$roomId: req.params.roomId});
    db.get(`SELECT num_players FROM Rooms WHERE room_id=$roomId`, {$roomId: req.params.roomId}, (err, row) => {
      if (row.num_players === 0) {
        db.run(`DELETE FROM Rooms WHERE room_id=$roomId`, {$roomId: req.params.roomId})
        res.sendStatus(204);
      } else {
        res.status(200).send(row.num_players);
      }
    })
  })
})

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log('Listening on port: '+PORT);
});
