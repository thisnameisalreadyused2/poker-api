const app = require('express')();
const hat = require('hat');
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(9999);
teams = new Map();

app.get('/users', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/register', function (req, res) {
    res.sendFile(__dirname + '/register.html')
});

io.on('connection', function (socket) {
    socket.on('requestToken', () => {
        let token = hat();
        createNewTeam(token);
        socket.emit('receiveToken', {
            "token" : token
        });
    });
    socket.on('newTeamMember', (data) => {
      let currentTeam = teams.get(data.token);
      if (currentTeam === undefined){
        currentTeam = createNewTeam(data.token);
      }

      let currentUserName = data.username;

      if (currentUserName === null) {
          socket.emit('needRegister');
          return;
      }

      currentTeam.get('users').push({
        name: currentUserName,
        socket: socket,
        vote: null
      });
    });
    socket.on('newVote', (data) => {
      let currentTeam = teams.get(data.token);
      let teamUsers = currentTeam.get('users');
      let userIndex = teamUsers.findIndex(user => user.socket.id === socket.id);
      teamUsers[userIndex].vote = data.vote;

      let votes = [];

      for (let userId in teamUsers) {
        if (teamUsers[userId].vote === null) {
          votes = [];
          return;
        }
        votes.push({
          key: teamUsers[userId].socket.id,
          name: teamUsers[userId].name,
          points: teamUsers[userId].vote,
        })
      }
      for (let userId in teamUsers) {
        teamUsers[userId].socket.emit('voteEnded', votes);
      }
    });
    socket.on('onRestartVoting', (data) => {
      let currentTeam = teams.get(data.token);
      let teamUsers = currentTeam.get('users');
      for (let userId in teamUsers) {
        teamUsers[userId].socket.emit('restartVoting');
        teamUsers[userId].vote = null;
      }
    })
});

function createNewTeam(token) {
  let newTeam = new Map();
  newTeam.set("userStory", "User story is not selected");
  newTeam.set("state", "Planning");
  newTeam.set("users", []);
  teams.set(token, newTeam);
  return newTeam;
}

// let usersManager = io
//     .of('/users')
//     .on('connection', function (socket) {
//         socket.on('newUser', (user) => {
//             users.push(user);
//         })
//     })
//     .on('disconnect', function (socket) {
//         socket.on('leaveUser', (user) => {
//             users = users.filter(u => u.name != user.name && u.token != user.token);
//         })
//     });
