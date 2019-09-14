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
        teams.set(token, new Map([
            {userStory: "test story"},
            {state: "voting"},
            {users: []}
        ]));
        socket.emit('receiveToken', {
            "token" : token
        });
    });
    socket.on('newTeamMember', (data) => {
        let currentTeam = teams.get(data.token);
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
    socket.on('newVote', () => {

    });
});

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
