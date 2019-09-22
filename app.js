const app = require('express')();
const hat = require('hat');
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(9999);
teams = new Map();

function createNewTeam(token) {
  let newTeam = new Map();
  newTeam.set("userStory", "User story is not selected");
  newTeam.set("state", "Planning");
  newTeam.set("users", []);
  teams.set(token, newTeam);

  return newTeam;
}

function getCurrentTeam(token) {
  let currentTeam = teams.get(token);
  if (currentTeam === undefined) {
    currentTeam = createNewTeam(token);
  }

  return currentTeam;
}

io.on('connection', function (socket) {
  socket.on('requestToken', () => {
      let token = hat();
      createNewTeam(token);
      socket.emit('receiveToken', {
          "token" : token
      });
  });

  socket.on('newTeamMember', (data) => {
    let currentTeam = getCurrentTeam(data.token);
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
    let currentTeam = getCurrentTeam(data.token);
    let teamUsers = currentTeam.get('users');
    let userIndex = teamUsers.findIndex(user => user.socket.id === socket.id);
    teamUsers[userIndex].vote = data.vote;

    let votes = [];

    teamUsers.forEach((user) => {
      if (user.vote === null) {
        votes.length = 0;
        return;
      }

      votes.push({
        key: user.socket.id,
        name: user.name,
        points: user.vote,
      })
    });

    teamUsers.forEach((user) => {
      user.socket.emit('voteEnded', votes);
    });
  });

  socket.on('onRestartVoting', (data) => {
    let currentTeam = getCurrentTeam(data.token);
    let teamUsers = currentTeam.get('users');

    teamUsers.forEach((user) => {
      user.socket.emit('restartVoting');
      user.vote = null;
    });
  });

  socket.on('changeUserStory', (data) => {
    let currentTeam = getCurrentTeam(data.token);
    let teamUsers = currentTeam.get('users');

    teamUsers.forEach((user) => {
      user.socket.emit('onChangeUserStory', data);
    })
  });

  socket.on('disconnect', () => {
    let currentTeam = null;
    let currentUser = null;

    teams.forEach((team) => {
      team.get('users').forEach((departedUser) => {
        if (departedUser.socket.id === socket.id) {
          currentTeam = team;
          currentUser = departedUser;
        }
      });
    });

    if (currentTeam && currentUser) {
      console.log("User %s left", currentUser.name);
      currentTeam.get('users').filter((user) => user.socket.id !== currentUser.socket.id);
    }
  });
})
