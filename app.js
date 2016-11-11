var express = require('express');
var app = express();
var mongoose = require('mongoose');
var http = require('http');
var server = http.createServer(app);
var bodyParser = require('body-parser');
mongoose.connect('mongodb://35.163.104.205:27017/user');
var conn = mongoose.connection;
var user = require('./models/user');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.listen(9000, function () {
    console.log("running! port:9000");
});

app.get('/', function (req, res) {
    console.log("get");
    var user = {
        user_id: "ajh322",
        user_pw: "1234",
        user_name: "지화닝",
        user_gender: "m",
        user_species: "건설환경공학과",
        user_first: "1",
    };
    conn.collection('user').insert(user);
    res.send('Hello World!');
});
app.post('/sign_in', function (req, res) {
    user.find({user_id: req.body.user_id}).exec(function (err, doc) {
        //나중에 로그인 가능여부 판별후에 해야함.
        if (doc == null) //회원가입 성공
        {
            var user = {
                user_id: req.body.user_id,
                user_pw: req.body.user_pw,
                user_name: req.body.user_name,
                user_gender: req.body.user_gender,
                user_species: req.body.user_species,
                user_first: "1",
                _id: new ObjectID()
            };
            conn.collection('user').insert(user);
            res.end("success");
        }
        else {
            res.end("failed")
        }
    })
});
app.post('/login', function (req, res) {
    console.log(req.body.user_id+req.body.user_pw);
    user.find({user_id: req.body.user_id, user_pw:req.body.user_pw}).lean().exec(function (err, doc) {
        //나중에 로그인 가능여부 판별후에 해야함.
console.log(doc);
        if (doc != null) //로그인 성공
        {
            //최근로그인기록이나 누적로그인 회수도 기록할까? 이런거 기록하자
            res.end(JSON.stringify(doc));
        }
        else {
            res.end("failed")
        }
    })
});

