var express = require('express');
var app = express();
var mongoose = require('mongoose');
var http = require('http');
var server = http.Server(app);
var bodyParser = require('body-parser');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://35.163.104.205:27017/user');
var conn = mongoose.connection;
var user = require('./models/user');
var io = require('socket.io')(server);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
server.listen(9000, function () {
    console.log("running! port:9000");
});
io.on('connection', function (socket) {
    console.log('a user connected');
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});
app.get('/', function (req, res) {
    console.log("get");
    var user = {
        user_id: "2016022288",
        user_pw: "1234",
        user_name: "지화닝",
        user_gender: "m",
        user_species: "건설환경공학과",
        user_first: "1",
    };
    conn.collection('user').insert(user);
    res.send('Hello World!');
});

/*io.sockets.on('connection', function (socket) {
 //room join
 socket.on('join', function (data) {
 console.log(data.userid + "joined" + "roomname:" + data.roomname);
 socket.join(data.roomname);
 socket.set('room', data.roomname);
 socket.get('room', function (error, room) {
 io.sockets.in(room).emit('join', data.userid);
 })
 })
 socket.on('message', function (message) {
 console.log("message:" + data.message);
 socket.get('room', function (error, room) {
 io.sockets.in(room).emit('message', message);
 })
 })
 socket.on('disconnection', function () {
 console.log("disconnected");
 });
 })*/

app.post('/sign_in', function (req, res) {
    console.log('get');
    console.log(req.body);
    user.find({user_id: req.body.user_id}).exec(function (err, doc) {
        console.log(doc);
        //나중에 로그인 가능여부 판별후에 해야함.
        if (doc == "") {
            if (true)//api 사용하여 존재하는 학번, 재학생인지 판단인지 확인
            {
                var user = {
                    user_id: req.body.user_id,
                    user_pw: req.body.user_pw,
                    user_name: req.body.user_name,
                    //user_gender: req.body.user_gender, api에서 받아오기
                    //user_species: req.body.user_species, api에서 받아오기
                    user_first: "1"
                };
                conn.collection('user').insert(user);
                res.end("success");
            }
            else {
                res.end("ID not exist")
            }
        }
        else {
            res.end("alreay exists")
        }
    })
});
app.post('/login', function (req, res) {
    console.log(req.body);
    user.find({user_id: req.body.user_id, user_pw: req.body.user_pw}).exec(function (err, doc) {
        //나중에 로그인 가능여부 판별후에 해야함.
        console.log(doc);
        if (doc != "") //로그인 성공
        {
            //최근로그인기록이나 누적로그인 회수도 기록할까? 이런거 기록하자
            res.end(JSON.stringify(doc));
        }
        else {
            res.end("failed")
        }
    })
});

