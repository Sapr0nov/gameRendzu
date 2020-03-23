const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);


class Players extends Array {
  static get [Symbol.species]() { return Array; }
  constructor() {
    super();
  }
  player(id) {
    return this.find(player => (player.id === id))
  }
}
class Rooms extends Array {
  static get [Symbol.species]() { return Array; }
  constructor() {
    super();
  }
  room(id) {
    return this.find(room => (room.id === id))
  }

  delete(roomID, playerID) {
    const room = this.find(room => (room.id === roomID));
    if (room.player1 === playerID) {
      room.player1 = '';
    }
    if (room.player2 === playerID) {
      room.player2 = '';
    }
    return room;
  }
  addPlayer(roomID, playerID) {
    const room = this.find(room => (room.id === roomID));
    const player = players.find(player => (player.id === playerID));
    console.log(room);
    console.log(player);
    if (!room || !player) {
      return
    }
    if (room.player1 === '') {
      room.player1 = playerID;
      player.room = room.id;
      player.number = 1;     
      (player.color) ? player.color : '#4989dc';
      (player.name) ? player.name : 'Player1';
      return;
    }
    if (room.player2 === '' && room.player1 !== playerID) {
      room.player2 = playerID;
      player.room = room.id;
      player.number = 2;
      (player.color) ? player.color : '#82d614';
      (player.name) ? player.name : 'Player2';
      return;
    }
      console.log('guest connection');
      player.room = room.id;
      player.color = 'grey';
      player.name = 'Гость';
      player.number = 3;
    return 3;
  }
}

app.set('port', 3000);
app.use('/static', express.static(__dirname + '/static'));

app.get('/rendzu', (request, response) => {
  response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(3000, () => {
  console.log('Starting server on port 3000');
});
/* HELP FUNCTION */
const getParams = (href) =>  {
  const match = href.match(/\?(.*?)(?:#|$)/i);
  let getData = {};
  
  if (match && match[1])
  {
    var param = match[1].split('&');
    if (param)
      {
        for (var i = 0; i < param.length; i++)
          {
            getData[param[i].split('=')[0]] = param[i].split('=')[1];
          }
      }

  return getData;
  }
}

const createMatrix = (n,m) => {
  result = new Array(n);
  
  for (let i=0; i < m; i++) {
    result[i] = new Array(m).fill(0);
  }

  return result;
}

const convertLineToXY = (width, n) => {
  return [ n - (Math.floor(n/width) * width) , Math.floor(n/width)];
}

const convertXYtoLine = (width, coord) => {
  return coord[1]*width + coord[0];
}

/* ASYNC HELP FUNCTIONS*/
const reinitAll = (socketID) => {
  const player = players.player(socketID);
  const room = rooms.room(player.room);
  if (!room || !player) {
    console.log('err room not finded', room);
    return
  }
  const player1 = players.player(room.player1);
  const player2 = players.player(room.player2);
  io.emit('init', player1, room);
  io.emit('init', player2, room);
}

/* //HELP FUNCTION */
/* MAIN LOGICAL BLOCK */
const gameParams = {
  widthField: 20,
}

const players = new Players();
const rooms = new Rooms();

io.on('connection', socket => {
  console.log('connect id = ',socket.id);
  io.emit('successConn');

  socket.on('disconnect', () => {
    console.log('disconnect ', socket.id);
  });

  socket.on('addPlayer', playerID => {
    /* check player */
    let player = players.player(playerID);
    if (!player) {
      socket.emit('deletePlayer', playerID);
      playerID = socket.id;
      player = {
        id: playerID,
        room: '',
        number: 1,
        color: '#4989dc',
        name: 'Player1',
        theme: 'light'
      }
      socket.emit('newPlayer',playerID);
      players.push(player);
    }
    /* //check player */
    /* check room */
    let roomID = 0;
    let getParametrs = getParams(socket.handshake.headers.referer);
    if (getParametrs && getParametrs.room) {
      roomID = getParametrs.room;
    }
    // Если игрок сменил комнату удаляем его из старой
     if (roomID !== player.room) {
      const tmpRoom = rooms.room(player.room);
      if (tmpRoom && tmpRoom.player1 === player.id) {
        tmpRoom.player1 = '';
      }
      if (tmpRoom && tmpRoom.player2 === player.id) {
          tmpRoom.player2 = '';
      }
    }

    let room = rooms.room(roomID);
    if (!room) {
      room = {
        id: roomID,
        player1: '',
        player2: '',
        currPlayer: 1,
        matrix: createMatrix(gameParams.widthField,gameParams.widthField),
        historyChat : [],
        historyTurns : [],
      };
      rooms.push(room);
    }
    if (room.player1 === playerID || room.player2 === playerID) {
      reinitAll(player.id);
      return; 
      // TODO ЕСЛИ ГОСТЬ ОСТАЛСЯ В ТОЙ ЖЕ КОМНАТЕ и обновил страницу??
    }
    rooms.addPlayer(room.id, playerID);
    reinitAll(player.id);
   
/*
    if (room.player1 === '') {
      room.player1 = playerID;
      player.room = room.id;
    } else if 
    (room.player2 === '' && room.player1 !== playerID) {
      room.player2 = playerID;
      player.room = room.id;
      player.color = '#82d614';
      player.name = 'Player2';
      player.number = 2;
    }else {
      console.log('guest connection');
      player.room = room.id;
      player.color = 'grey';
      player.name = 'Гость';
      player.number = 3;
      }
    */  
      let {matrix, ...showRoom} = room;
      console.log('add player into the room ', showRoom);
  });
  /*TODO не нужная пока функция */ 
  socket.on('updateID', playerID => {
    players.forEach( player => {
      if (player.id === playerID) {
        delete player;
      }
    });
  });

  socket.on('turn', (playerID, coords) => {
      const player = players.player(playerID);
      if (!player) return;

      const room = rooms.room(player.room);
      if (!room || room.currPlayer !== player.number) return;

      const coord = convertLineToXY(gameParams.widthField,coords);
      if (room.matrix[coord[0]][coord[1]]!==0) return;

      room.matrix[coord[0]][coord[1]] = player.number;
      (room.currPlayer === 1) ? room.currPlayer = 2 : room.currPlayer = 1;
      room.historyTurns.push(player, coords);
      io.emit('anyTurn', player, coords);
  });

  socket.on('undo', (playerID, coords) => {
    const player = players.player(playerID);
    if (!player) return;

    const room = rooms.room(player.room);
    const coord = convertLineToXY(gameParams.widthField,coords);
    (room.currPlayer === 1) ? room.currPlayer = 2 : room.currPlayer = 1;

    if (!room || room.currPlayer !== player.number) return;
    if (room.matrix[coord[0]][coord[1]]!==room.currPlayer) return;

    room.matrix[coord[0]][coord[1]] = 0;
    io.emit('anyUndo', player, coords);
  });


  socket.on('update', (type, playerID, data) => {
    const player = players.player(playerID);
    if (!player) return;
    switch (type) {
      case 'color' : player.color = data; console.log(rooms); break;
      case 'theme' : player.theme = data; break;
      case 'name' : player.name = data; break;
      case 'room' : 
            rooms.delete(player.room, playerID);
            rooms.addPlayer(data, playerID); 
            player.room = data;
            break;
    }
    reinitAll(playerID);
  });

  socket.on('clearMatrix', (playerID) => {
    const player = players.player(playerID);
    const room = rooms.room(player.room);
    room.matrix = createMatrix(gameParams.widthField,gameParams.widthField);
    const player1 = players.player(room.player1);
    const player2 = players.player(room.player2);
    io.emit('init', player1, room);
    io.emit('init', player2, room);
  });
  
  socket.on('msg', (playerID, text) => {
    const player = players.player(playerID);
    if (!player) {
      console.log('Игрок не найден');
      return
    }
    const now = new Date();
    const hour = now.getHours() < 10 ? '0' + now.getHours() : now.getHours();
    const min = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
    const sec = now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds();
    const message = {
      dateTime: hour + ':' + min + ':' + sec,
      msg: text,
      player: player
    };
    let room = rooms.room(player.room); 
    if (!room) {
      console.log('Error try to send msg from player without room');
      return
    }
    room.historyChat.push(message);

    io.sockets.emit('message', message);
  });

});