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
var list_m = require('./models/list_m');
var list_w = require('./models/list_w');
var io = require('socket.io')(server);
var FCM = require('fcm').FCM;

var apiKey = ' AIzaSyBmGGlEtd_i9xQojvh0KNqNzgaid2SNgXc';
var fcm = new FCM(apiKey);
function list_m_add(id) {
    var index;
    list_m.findOne({}).sort('-index').exec(function (err, docs) {
        if (docs == null)
            index = 0;
        else
            index = docs.index;
    });
    //인덱스값 찾았으므로 db에 +1해줘서 사람을 순차적으로 넣는다.
    list_m.insert({index: index + 1, user_id: id});
}
function list_w_add(id) {
    var index;
    list_w.findOne({}).sort('-index').exec(function (err, docs) {
        if (docs == null)
            index = 0;
        else
            index = docs.index;
    });
    //인덱스값 찾았으므로 db에 +1해줘서 사람을 순차적으로 넣는다.
    list_w.insert({index: index + 1, user_id: id});
}

function search() {
    console.log("searching!")
    var m, w;
    list_m.find({}).sort('index').exec(function (err, docs) {
        //남자오름차순 여자오름차순 한다음에...
        m = docs;
    })
    list_w.find({}).sort('index').exec(function (err, docs) {
        //남자오름차순 여자오름차순 한다음에...
        w = docs;
    })
    console.log(m[0] + w[0]);
    if (m[0] != null && w[0] != null)
        test(m[0].user_id, w[0].user_id);
}
function send_fcm(m_id, w_id) {
    var m_token, w_token;
    user.findOne({user_id: m_id}).exec(function (err, docs) {
        m_token = docs.user_token;
    })
    user.findOne({user_id: w_id}).exec(function (err, docs) {
        w_token = docs.user_token;
    })
    var message_m = {
        registration_id: m_token, // required
        collapse_key: Date.now(),
        'w_id': w_id
    };
    var message_w = {
        registration_id: w_token, // required
        collapse_key: Date.now(),
        'm_id': m_id
    };


    fcm.send(message_m, function (err, messageId) {
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Sent with m_message ID: ", messageId);
        }
    });
    fcm.send(message_w, function (err, messageId) {
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Sent with w_message ID: ", messageId);
        }
    });
    user.findOne({user_id: m_id}).exec(function (err, doc) { //검색중 끄고 test모드 시작
        console.log(doc);
        if (doc.user_on_search == "1") //검색중인지 여부
        {
            doc.user_on_search = "0";
            doc.user_on_test = "1";
            doc.save();
            console.log("취소 정상적으로 해결");
            res.end("success");
        }
        else {
            console.log("취소 불가");
            res.end("failed");
        }
    })
    user.findOne({user_id: w_id}).exec(function (err, doc) {
        console.log(doc);
        if (doc.user_on_search == "1") //검색중인지 여부
        {
            doc.user_on_search = "0";
            doc.save();
            console.log("취소 정상적으로 해결");
            res.end("success");
        }
        else {
            console.log("취소 불가");
            res.end("failed");
        }
    })
}
function test(m_id, w_id) {
    //db에서 저거된사람들의 인덱스값을 지워야함. 나중에 인덱스0번을 통하여 우선순위기능 해야할듯.
    list_m.remove({user_id: m_id}, function (err) {
        console.log(err);
    });
    list_w.remove({user_id: w_id}, function (err) {
        console.log(err);
    });
    //알림가야하고 앱에서 서로의 프로필이 나와야함.
    send_fcm(m_id, w_id);
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
server.listen(9000, function () {
    var intervalID = setInterval(search(), 10000); //10분
    console.log("running! port:9000");
});
io.sockets.on('connection', function (socket) {
    //room join
    var josn;
    console.log("connected!");

    socket.on('join', function (data) {
        console.log(data);
        json = JSON.parse(data);
        console.log(json);
        console.log(json.userid + "joined" + "roomname:" + json.roomname);
        socket.join(json.roomname);
        io.sockets.in(json.roomname).emit('message', json.userid + "님 입장");
        console.log('JOIN ROOM LIST', io.sockets.adapter.rooms);
    })
    socket.on('message', function (message) {
        console.log("message:" + message);
        io.sockets.emit('message', message);
        // io.sockets.in(json.roomname).emit('message', message);
    })
    socket.on('disconnect', function () {
        console.log('DISCONNESSO!!! ');
    });
})

app.get('/', function (req, res) {
    console.log("get");
    res.sendFile(__dirname + '/index.html');
    /*var user = {
     user_id: "2016022288",
     user_pw: "1234",
     user_name: "지화닝",
     user_gender: "m",
     user_species: "건설환경공학과",
     user_first: "1",
     };
     conn.collection('user').insert(user);
     res.send('Hello World!');*/
});

app.post('/send_token', function (req, res) {
    console.log('token');
    console.log(req.body);
})
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
                    user_gender: req.body.user_gender, //회원가입에 성별 추가함api에서 받아오기
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
    var date = Date.now(); //지금 시각을 세션값으로하면 충분하지않을까?
    user.findOne({user_id: req.body.user_id, user_pw: req.body.user_pw}).exec(function (err, doc) {
        //나중에 로그인 가능여부 판별후에 해야함.
        console.log(doc);
        if (doc != "" && doc != null) //로그인 성공
        {
            //최근로그인기록이나 누적로그인 회수도 기록할까? 이런거 기록하자
            doc["user_session"] = date; //세션값
            doc.save();
            res.end(JSON.stringify(doc));
        }
        else {
            res.end("failed")
        }
    })
});

app.post('/check_session', function (req, res) {
    console.log("세션확인:" + req.body.user_token);
    user.findOne({user_id: req.body.user_id}).exec(function (err, doc) {
        //나중에 로그인 가능여부 판별후에 해야함.
        console.log(doc);
        if (doc.user_session = req.body.user_session) //로그인 성공
        {
            doc["user_token"] = req.body.user_token;
            doc.save();
            console.log(doc);
            res.end("match")
        }
        else {
            res.end("unmatch")
        }
    })
})

app.post('/search_m', function (req, res) { //남자 검색하러옴
    console.log("외로운 남자:" + req.body);
    user.findOne({user_id: req.body.user_id}).exec(function (err, doc) {
        //나중에 로그인 가능여부 판별후에 해야함.
        console.log(doc);
        if (doc.user_on_search == "0") //검색중인지 여부
        {
            doc.user_on_search = "1";
            doc.save();
            list_m_add(req.body.user_id);
            res.end("go");
        }
        else {
            res.end("stop");
        }
    })
})
app.post('/search_w', function (req, res) { //남자 검색하러옴
    console.log("외로운 여자:" + req.body);
    user.findOne({user_id: req.body.user_id}).exec(function (err, doc) {
        //나중에 로그인 가능여부 판별후에 해야함.
        console.log(doc);
        if (doc.user_on_search == "0") //검색중인지 여부
        {
            doc.user_on_search = "1";
            doc.save();
            list_w_add(req.body.user_id);
            res.end("go");
        }
        else {
            res.end("stop");
        }
    })
})

app.post('/search_cancel', function (req, res) { //남자 검색하러옴
    console.log("검색취소하심니다:" + req.body);
    user.findOne({user_id: req.body.user_id}).exec(function (err, doc) {
        console.log(doc);
        if (doc.user_on_search == "1") //검색중인지 여부
        {
            doc.user_on_search = "0";
            doc.save();
            console.log("취소 정상적으로 해결");
            res.end("success");
        }
        else {
            console.log("취소 불가");
            res.end("failed");
        }
    })
})
