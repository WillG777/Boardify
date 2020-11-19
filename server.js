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
  room_id TEXT not null,
  num_players INTEGER not null default 1
)`);
db.run(`CREATE TABLE IF NOT EXISTS Packs (
  pack_id INTEGER not null primary key,
  data TEXT not null
)`)

app.post('/room', (req, res, next) => {
  // keep generating room IDs until we get a new one
  var roomId;
  (function generateRoomId() {
    roomId = parseInt(Math.random()*36**6).toString(36);
    console.log('Generated room id: ',roomId);
    db.get(`SELECT * FROM Rooms WHERE room_id=${roomId}`, (err,row) => {
      if (row && row !== []) return generateRoomId();
      else {
        console.log('About to insert ID: ',roomId);
        db.run(`INSERT INTO Rooms (room_id) VALUES ("${roomId}")`, err => {
          console.log('Last one - sending ID: ',roomId);
          res.status(201).send({room: roomId});
          if (err) console.error(err);
        });
      }
    })
  })();
});

// when DELETE req received, decrease active players by 1, then delete the room if it's 0
app.delete('/room/:roomId', (req, res, next) => {
  db.serialize(()=>{
    db.run(`UPDATE Rooms SET num_players = num_players-1 WHERE room_id=$roomId`, {$roomId: req.params.roomId});
    db.get(`SELECT num_players FROM Rooms WHERE room_id=$roomId`, {$roomId: req.params.roomId}, (err, row) => {
      if (!row) return res.sendStatus(400);
      if (row.num_players === 0) {
        db.run(`DELETE FROM Rooms WHERE room_id=$roomId`, {$roomId: req.params.roomId})
        res.sendStatus(204);
      } else {
        res.status(200).send(row.num_players);
      }
    })
  })
});

app.post('/pack', (req, res, next) => {
  db.run(`INSERT INTO Packs (data) VALUES $data`, {$data: req.body}, function(err) {
    res.status(201).send({packId: this.lastID})
  })
});

app.put('/pack/:id', (req, res, next) => {
  db.run(`UPDATE Packs SET data=$data WHERE pack_id=$packId`, {$data: req.body, $packId: req.params.id}, err => {
    res.sendStatus(err ? 400 : 200)
  })
})

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log('Listening on port: '+PORT);
});
