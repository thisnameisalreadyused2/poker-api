let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);

server.listen(9999);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});
