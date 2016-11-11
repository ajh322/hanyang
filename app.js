var app = express();
var express = require('express');
var mongoose = require('mongoose');
var http = require('http');
var server = http.createServer(app);
var bodyParser = require('body-parser');
mongoose.connect('mongodb://35.163.104.205:27017/user');
var conn = mongoose.connection;
var user = require('./models/user');

app.listen(9000, function () {
});

app.get('/', function (req, res) {
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
app.post('/log_in', function (req, res) {
    user.find({user_id: req.body.user_id, user_pw:req.body.user_pw}).exec(function (err, doc) {
        //나중에 로그인 가능여부 판별후에 해야함.
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

