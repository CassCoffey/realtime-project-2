const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../hosted/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

const io = socketio(app);

const users = {};
const color = ['black', 'green', 'red', 'blue', 'pink', 'grey', 'brown'];

const update = () => {
  const keys = Object.keys(users);
  for (let i = 0; i < keys.length; i++) {
    const user = users[keys[i]];
    user.velocity += 1;
    user.y += user.velocity;
    const floor = 720 - user.height;
    if (user.y > floor) {
      user.y = floor;
      user.velocity = 0;
      user.grounded = true;
    }
    if (user.x < 0) {
      user.x = 0;
    }
    if (user.x > 1280 - user.width) {
      user.x = 1280 - user.width;
    }
    const time = new Date().getTime();
    user.lastUpdate = time;
  }

  io.sockets.in('room1').emit('draw', { users });
};

const onJoined = (sock) => {
  const socket = sock;
  socket.on('join', () => {
    socket.join('room1');
    const time = new Date().getTime();
    const x = Math.floor((Math.random() * (1280 - 50)) + 50);
    const y = Math.floor(20);
    socket.user = `user${(Math.floor((Math.random() * 1000)) + 1)}`;
    socket.currentColor = 0;
    users[socket.user] =
    { lastUpdate: time,
      x,
      y,
      width: 50,
      height: 50,
      color: color[0],
      velocity: 0,
      grounded: false };
  });
  socket.on('cycleColor', () => {
    socket.currentColor++;
    if (socket.currentColor >= color.length) {
      socket.currentColor = 0;
    }

    users[socket.user].color = color[socket.currentColor];
  });
  socket.on('move', (data) => {
    users[socket.user].x += data.move;
  });
  socket.on('jump', () => {
    if (users[socket.user].grounded) {
      users[socket.user].velocity = -20;
      users[socket.user].grounded = false;
    }
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    delete users[socket.user];
  });
};

io.sockets.on('connection', (socket) => {
  onJoined(socket);
  onDisconnect(socket);
});

setInterval(update, 1000 / 10);
