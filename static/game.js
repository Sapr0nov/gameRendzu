const socket = io('http://srv2.bez-sso.ru:3000');
/* CREATE FILED */
const createFiled = (n, field) => {
  field.querySelectorAll('div').forEach(el => {
     el.remove(); 
  })

  const block = document.createElement('div');
  block.classList.add("cell");
  block.classList.add("empty");
  
  for (let i = 0; i < n; i++) {
    let newBlock = block.cloneNode(true);
    newBlock.setAttribute('id', i);
    field.append(newBlock);
  }
}
/* //CREATE FILED */
/* FILL FIELD */
const fillFiled = (matrix, players) => {
  const n = matrix.length-1;
  const m = matrix[0].length-1;
  for (let i=0; i < n; i++) {
    for (let j=0; j < m; j++) {
      let id = convertXYtoLine(20,[i,j]);
      if (matrix[i][j]!== 0) {
        document.getElementById(id).classList.add(players[matrix[i][j]]);
      }else{
        document.getElementById(id).classList.remove('last');  
        document.getElementById(id).classList.remove('player1');  
        document.getElementById(id).classList.remove('player2');  
        document.getElementById(id).classList.add('empty');  
      }
    }
  }
}
/* //FILL FIELD */

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

const getCookie = (name) => {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

/* CHECK WINNER */
const checkWin = (matrix, coord) => {
  let win = false;
  let line = 0;
  const player = matrix[coord[0]][coord[1]];

  for (let i = -5; i <= 5; i++) {
    if (coord[1] + i < 0 || coord[1] + i > 19) {
      continue;
    }
    ( matrix[ coord[0] ][ coord[1] + i ] === player ) ? line++ : line = 0;
    if (line > 4) {  return { win : true, player: player, line: [ [coord[0], coord[1]+i], [coord[0], coord[1]+i-1],[coord[0], coord[1]+i-2],[coord[0], coord[1]+i-3],[coord[0], coord[1]+i-4] ] }; }
  }

  line = 0;
  for (let i = -5; i <= 5; i++) {
    if (coord[0] + i < 0 || coord[0] + i > 19 ) {
      continue;
    }
    ( matrix[ coord[0] + i ][ coord[1] ] === player ) ? line++ : line = 0;
    if (line > 4) {  return { win : true, player: player, line: [ [coord[0]+i, coord[1]], [coord[0]+i-1, coord[1]],[coord[0]+i-2, coord[1]],[coord[0]+i-3, coord[1]],[coord[0]+i-4, coord[1]] ] }  }
  }

  line = 0;
  for (let i = -5; i <= 5; i++) {
    if (coord[0] + i < 0 || coord[1] + i < 0 || coord[0] + i > 19 || coord[1] + i > 19) {
      continue;
    }
    ( matrix[ coord[0] + i ][ coord[1] + i ] === player ) ? line++ : line = 0;
    if (line > 4) {  return { win : true, player: player, line: [ [coord[0]+i, coord[1]+i],[coord[0]+i-1, coord[1]+i-1],[coord[0]+i-2, coord[1]+i-2],[coord[0]+i-3, coord[1]+i-3],[coord[0]+i-4, coord[1]+i-4] ] } }
  }

  line = 0;
  for (let i = -5; i <= 5; i++) {
    if (coord[0] - i < 0 || coord[1] + i < 0 || coord[0] - i > 19 || coord[1] + i > 19) {
      continue;
    }
    ( matrix[ coord[0] - i ][ coord[1] + i ] === player ) ? line++ : line = 0;
    if (line > 4) { return { win : true, player: player, line: [ [coord[0]-i, coord[1]+i], [coord[0]-i+1, coord[1]+i-1],[coord[0]-i+2, coord[1]+i-2],[coord[0]-i+3, coord[1]+i-3],[coord[0]-i+4, coord[1]+i-4] ]} }
  }
  
  return win;
}
/* //CHECK WINNER */

/* */
const nextPlayer = (currPlayer) => {
  return (currPlayer==1) ? 2 : 1;
}

/* */
/* COMMON SETTING */
let matrix =  createMatrix(20,20);
const players = ['','player1','player2'];
let clientPlayer = 1;
let currPlayer = 1; 
let lastDot;
let cookies = getCookie("player");
/* //COMMON SETTING */

window.onload = () => {
  
  const field = document.querySelector('.wrapper');
  const endGame = document.querySelector('.endGame');
  const menu = document.querySelector('.menu');
  createFiled(400, field);

    document.querySelectorAll('.popup__close').forEach(block => {
      block.addEventListener('click', (event) => {
        event.target.parentElement.classList.add('hide');
      })
    })

    document.querySelector('.endGame button').addEventListener('click', event => {
      event.preventDefault();
      matrix =  createMatrix(20,20);
      createFiled(400, field);
      endGame.classList.add('hide');
    })

    document.querySelector('.undoBtn').addEventListener('click', event => {
      event.preventDefault();
      const undoBlock = document.querySelector('.last');
      const n = undoBlock.getAttribute('id');
      socket.emit('undo', cookies,n);
    })
    
    document.querySelector('.darkTheme').addEventListener('click', event => {
      event.preventDefault();
      let theme = document.documentElement.style.getPropertyValue('--theme'); 
      (theme === 'light') ? theme = 'dark' : theme = 'light';
      useTheme(theme);
      socket.emit('update','theme',cookies,theme);
        
    })

    document.querySelector('.chatBtn').addEventListener('click', event => {
      event.preventDefault();
      document.querySelector('.chat').classList.toggle('hide');
    })

    document.querySelector('.passBtn').addEventListener('click', event => {
      event.preventDefault();
      socket.emit('msg', cookies,'Я сдаюсь! Вы выиграли!');
      socket.emit('clearMatrix',cookies);
      currPlayer = nextPlayer(clientPlayer);
      document.querySelector('.popup__info').innerHTML = `Победил: ${players[currPlayer]}`;
      menu.classList.add('hide');
      endGame.classList.remove('hide');
    })
    document.querySelector('.roomLink').addEventListener('click', event => {
      event.preventDefault();
      const popUp = document.querySelector('div.invite');
      const text = document.querySelector('input.invite');
      popUp.classList.remove('hide');
      text.value = document.URL;
      text.select();
      document.execCommand('copy');
      })
    
    document.querySelectorAll('.closeMenu').forEach(block => {
      block.addEventListener('click', (event) => {
        event.target.parentElement.classList.add('hide');
      })
    })

    document.querySelector('.chat__title').addEventListener('click', event => {
      event.preventDefault();
      document.querySelector('.history').classList.toggle('history__open');  
      document.querySelector('.sendBlock').classList.toggle('sendBlock__open');  
    })
    
    document.querySelector('.confirmColor').addEventListener('click', event => {
      event.preventDefault();
      let root = document.documentElement; 
      root.style.setProperty('--userColor', document.querySelector('.userColor').value);
      socket.emit('update','color',cookies, document.querySelector('.userColor').value);
    })

    document.querySelector('.confirmName').addEventListener('click', event => {
      event.preventDefault();
      const newName = document.querySelector('.userName');
      if (newName.value.length > 2) {
        socket.emit('update','name',cookies, newName.value);
      }
    })
    document.querySelector('.confirmRoom').addEventListener('click', event => {
      event.preventDefault();
      const newRoom = document.querySelector('select.roomNumber').value;
      socket.emit('update','room',cookies, newRoom);
      location.href = `./?room=${newRoom}`;
    })

    document.querySelector('.sendBlock button').addEventListener('click', event => {
      event.preventDefault();
      sendMsg();
    })

    document.querySelector('.sendBlock input').addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.code === 'NumpadEnter') {
        event.preventDefault();
        sendMsg();
      }
    })
    
    document.querySelector('.menuBtn').addEventListener('click', event => {
      event.preventDefault();
      menu.classList.remove('hide');
    })

    field.addEventListener('click',(event)=>{
      const currBlock = event.target;
      if (!currBlock.classList.contains('empty')) return;

      let n = currBlock.getAttribute('id');
      socket.emit('turn',cookies, n);
    })

  /* FUNCTIONS */
    const sendMsg = () => {
      const msg = document.querySelector('.sendMsg').value;
      msg && socket.emit('msg',cookies, msg);
      document.querySelector('.sendMsg').value = '';
    }

    const showchat = chat => {
      chat.forEach(message => {
        let div = document.createElement('div');
        div.classList.add('message');
        div.textContent = message.dateTime + ' ' + message.player.name + ': ' + message.msg;
        div.style.cssText = `color: ${message.player.color}`;
        document.querySelector('.history').insertBefore(div, document.querySelector('#history>div'));
      })
    }

    const useTheme = (theme) => {
      let root = document.documentElement; 
      if (!theme) {
        theme = root.style.getPropertyValueValue('--theme');
      }
      if (theme==='light' || theme===''){   
        root.style.setProperty('--theme','light');
        root.style.setProperty('--bodyColor','#dcdcdc');
        root.style.setProperty('--shadowColor', '#dcdcdc');
        root.style.setProperty('--lastColor', '#8d8d8d');
        root.style.setProperty('--emptyColor', '#cccccc');
        root.style.setProperty('--borderColor', 'black');
        root.style.setProperty('--btnBorder', 'lightgrey');
        root.style.setProperty('--menuColor', 'darkorchid');
        root.style.setProperty('--textColor', 'whitesmoke');
      }
      else{
        root.style.setProperty('--theme','dark');
        root.style.setProperty('--bodyColor', '#333333');
        root.style.setProperty('--shadowColor', '#222222');
        root.style.setProperty('--lastColor', '#333333');
        root.style.setProperty('--emptyColor', '#444444');
        root.style.setProperty('--borderColor', 'black');
        root.style.setProperty('--btnBorder', '#999999');
        root.style.setProperty('--menuColor', '#491979');
        root.style.setProperty('--textColor', '#898989');
      } 
    }

    /*  ASYNCS FUNCTION */
    socket.on('successConn', () => {
      playerID = getCookie('player') ? getCookie('player') : socket.id;
      socket.emit('addPlayer', playerID);
    })
    
    socket.on('newPlayer', playerID => {
        document.cookie = `player=${playerID}`;
        cookies = playerID;
    })
    socket.on('deletePlayer', playerID => {
        if (playerID === getCookie('player')) {
          document.cookie = "player=''";
          cookies = '';
        }
    })
        
    socket.on('init', (player, room) => {

      if (player && player.id === cookies) {
        document.querySelector('.history').querySelectorAll('div').forEach(message => {
          message.remove();
        });
        showchat(room.historyChat);
        useTheme(player.theme);
        currPlayer = room.currPlayer;
        (player.number === room.currPlayer) ? 'Ваш ход' : 'ожидаем хода противника';
        clientPlayer = player.number;
        console.log(clientPlayer);
        if (player.number===1) {
          document.querySelector('.userName').value = player.name;
          document.querySelector('h2').innerText = 'Игрок: '+player.name;
        } 
        if (player.number===2) {
          let root = document.documentElement; 
          root.style.setProperty('--userColor', '#82d614');
          document.querySelector('h2').innerText = 'Игрок: '+player.name;
          document.querySelector('.userName').value = player.name;
        }
        if (player.number===3) {
          let root = document.documentElement; 
          root.style.setProperty('--userColor', 'grey');
          document.querySelector('h2').innerText = 'Гость (только просмотр)';
          document.querySelector('.userName').value = player.name;
        }
          matrix = room.matrix;
        fillFiled(room.matrix,players);
      }else{
        console.log('new player connected');
      }
    })

    socket.on('anyTurn', (player,n) => {
      const coord = convertLineToXY(20,n);
      let winLine;
      let lastBlock;

      if (lastDot) {
        lastBlock = document.getElementById(lastDot);
        lastBlock.classList.remove('last');
      } 
      lastDot = n;
      const currBlock = document.getElementById(n);
      
      matrix[coord[0]][coord[1]] = currPlayer;
      winLine = checkWin(matrix,coord);

      currBlock.classList.remove('empty');
      currBlock.classList.add(players[currPlayer]);
      currBlock.classList.add('last');
      field.classList.remove(players[currPlayer]);
      currPlayer = nextPlayer(currPlayer);
      field.classList.add(players[currPlayer]);
      let ternText = (player.id === cookies) ?  'ожидаем хода противника' : 'Ваш ход';
      if (clientPlayer !== 3) {
        document.querySelector('h2').innerText = ternText;
      }

      if (!winLine)  return;
      socket.emit('clearMatrix',cookies);
      document.querySelector('.popup__info').innerHTML = `Победил: игрок №${winLine.player}`;
      menu.classList.add('hide');
      endGame.classList.remove('hide');

      let attrArr = winLine.line.map(coord => convertXYtoLine(20, coord) );
      document.querySelectorAll('.wrapper div').forEach( (block) => {
        if ( attrArr.includes( Number(block.getAttribute('id')) )) {
          block.classList.remove(players[1]);
          block.classList.remove(players[2]);
          block.classList.add('win');
        }
      })
    })

    socket.on('anyUndo', (player, n) => {
      const coord = convertLineToXY(20,n);
      let currBlock = document.getElementById(n);
        
      matrix[coord[0]][coord[1]] = 0;

      currBlock.classList.add('empty');
      currBlock.classList.remove('last');
      currBlock.classList.remove(players[currPlayer]);
      field.classList.remove(players[currPlayer]);
      currPlayer = nextPlayer(currPlayer);
      currBlock.classList.remove(players[currPlayer]);
      field.classList.add(players[currPlayer]);

      let ternText = (player.id === cookies) ?  'ожидаем хода противника' : 'Ваш ход';
      if (clientPlayer !== 3) {
        document.querySelector('h2').innerText = ternText;
      }
    })

    /* CHAT */
    socket.on('message', message => {
      showchat([message]);
    });
} 