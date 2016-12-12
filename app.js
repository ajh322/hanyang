var express = require('express');
var app = express();
var mongoose = require('mongoose');
var http = require('http');
var server = http.Server(app);
var bodyParser = require('body-parser');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://35.161.80.18:27017/user');
var conn = mongoose.connection;
var user = require('./models/user');
var list_m = require('./models/list_m');
var list_w = require('./models/list_w');
var chat = require('./models/chat');
var io = require('socket.io')(server);
var request = require('request');

function get_chat_model(chat_id) {
    var chat_Schema = chat;
    var model = mongoose.model(chat_id, chat_Schema, chat_id);
    return model;
}
function list_m_add(id) {
    var index;
    list_m.findOne({}).sort('-index').exec(function (err, docs) {
        console.log(docs);
        if (docs == null) {
            console.log("a");
            index = 0;
        }
        else {
            console.log("b");
            index = docs.index;
        }
        //인덱스값 찾았으므로 db에 +1해줘서 사람을 순차적으로 넣는다.
        conn.collection('list_m').insert({index: index + 1, user_id: id});
    });

}
function list_w_add(id) {
    var index;
    list_w.findOne({}).sort('-index').exec(function (err, docs) {
        console.log(docs);
        if (docs == null) {
            console.log("a");
            index = 0;
        }
        else {
            console.log("b");
            index = docs.index;
        }
        //인덱스값 찾았으므로 db에 +1해줘서 사람을 순차적으로 넣는다.
        conn.collection('list_w').insert({index: index + 1, user_id: id});
    });

}

function search() {
    console.log("searching!")
    list_m.find({}).sort('index').exec(function (err, docs_m) {
        //남자오름차순 여자오름차순 한다음에...
        console.log("a!")
        list_w.find({}).sort('index').exec(function (err, docs_w) {
            //남자오름차순 여자오름차순 한다음에...
            console.log("b")
            try {
                console.log("c")
                console.log(docs_m[0] + docs_w[0]);
                if (docs_m[0] != null && docs_w[0] != null)
                    test(docs_m[0].user_id, docs_w[0].user_id);
            } catch (e) {
                console.log(e)
            }

        })

    })


}
function make_test_state(m_id, w_id) {
    user.find({$or: [{user_id: m_id}, {user_id: w_id}]}).exec(function (err, docs) {
            docs.forEach(function (doc) {
                if (doc.user_gender == "남성") {
                    console.log(doc);
                    if (doc.user_on_search == "1") //검색중인지 여부
                    {
                        doc.user_on_search = "0";
                        doc.user_on_test = "1";
                        doc.user_target_id = w_id;
                        doc.save();
                        console.log("취소 정상적으로 해결");
                        sendMessageToUser(doc.user_token, {status: "test"});
                    }
                    else {
                        console.log("취소 불가");
                    }
                }
                else {
                    console.log(doc);
                    if (doc.user_on_search == "1") //검색중인지 여부
                    {
                        doc.user_on_search = "0";
                        doc.user_on_test = "1";
                        doc.user_target_id = m_id;
                        doc.save();
                        console.log("취소 정상적으로 해결");
                        sendMessageToUser(doc.user_token, {status: "test"});
                    }
                    else {
                        console.log("취소 불가");
                    }

                }

            })
        }
    )
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
    make_test_state(m_id, w_id);
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
function sendMessageToUser(deviceId, message) {
    var str_body, str_click_action;
    switch (message.status) {
        case 'test':
            console.log("1");
            str_body = "상대방을 찾았습니다!";
            str_click_action = "OPEN_ACTIVITY_test";
            break;
        case 'chat':
            str_body = "대화가 시작됩니다!";
            str_click_action = "OPEN_ACTIVITY_chat";
            break;
        case 'one_more':
            str_body = "상대방이 수락했습니다!";
            str_click_action = "OPEN_ACTIVITY_test";
            break;
        case 're':
            str_body = "거절당했습니다.";
            str_click_action = "OPEN_ACTIVITY_main";
            break;
        case 'add_chat':
            str_body = "메시지가 도착하였습니다.";
            str_click_action = "OPEN_ACTIVITY_chat";
            break;
        default:
            console.log("sendMessageToUser err");
            break;
    }
    request({
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {
            'Content-Type': ' application/json',
            'Authorization': 'key=AAAAZSqy11g:APA91bEyvoVvD7r2XkV1tiKAgeE9zhueIzQCj6YX2E85RuB5-ai754eg6QU4D8rUjMbFBFS3trZ2trXdH2i1q01K1dDDVyOkev_zHmsqp8n6ypvL_qYXpJwiZ8r7Z5iTos9cpWk1HK2rlnJJxFT7lamJ6nsopRTQWg'
        },
        body: JSON.stringify(
            {
                notification: {
                    body: str_body,
                    click_action: str_click_action
                },
                data: message,
                //"to": deviceId
                to: deviceId
            }
        )
    }, function (error, response, body) {
        if (error) {
            console.error(error, response, body);
        }
        else if (response.statusCode >= 400) {
            console.error('HTTP Error: ' + response.statusCode + ' - ' + response.statusMessage + '\n' + body);
        }
        else {
            console.log('Done!')
            console.log(body);
        }
    });
}
server.listen(9000, function () {
    setInterval(search, 10000); //10분
    console.log("running! port:9000");
    //sendMessageToUser("c8N_dCbmbYU:APA91bGh2z5__tLcXWcGqzYK7pBIfWUDqlIAGvZun1VPtUeWkO-PNVCShdvqlQ7xiyyaaSrVDKmNLMlPc5_ocmZi5kQgnppE2NU5HO4R62cmy19w4viupnqV4XxRiXSkaKkGS8_Bu1I6", {status: "test"});
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
app.post('/get_target_data', function (req, res) {
    console.log("target_data_needed");
    user.findOne({user_id: req.body.user_id}).exec(function (err, doc_f) {
        console.log(doc_f);
        user.findOne({user_id: doc_f.user_target_id}).exec(function (err, doc_l) {
            console.log(doc_l);
            res.end(JSON.stringify(doc_l));
        })
    })
});
function make_chat(id, id_l) {
    //console.log("making chat")
    var chat_Schema = chat;
    //first comment
    //{ "_id" : ObjectId("584ebda72e278c7076bdf6e4"), "sent_by" : "admin", "msg" : "4님 2님 즐거운 시간 보내세요~", "index" : 0 }
    mongoose.model(id + "/" + id_l, chat_Schema, id + "/" + id_l);
    var message = {
        sent_by: "admin",
        msg: id + "님 " + id_l + "님 즐거운 시간 보내세요~",
        index: 0
    };
    conn.collection(id + "/" + id_l).insert(message);
}
app.post('/add_chat', function (req, res) {
    /*
     req.body parm
     String user_id
     String msg

     res
     no specific json data
     just "success" or "error"

     push notification to target_id
     add msg to db
     */
    console.log("add_chat");
    console.log(req.body);
    try {
        user.findOne({user_id: req.body.user_id}).exec(function (err, doc) {
            //find the index
            get_chat_model(doc.chat_name).findOne({}).sort('-index').exec(function (err, doc_l) {
                var val = 0;
                //send notification to target_id
                sendMessageToUser(doc.user_target_id, {status: "add_chat", msg:req.body.msg});
                val = doc_l.index;
                console.log("index num:" + val);

                //add msg to db
                var message = {
                    sent_by: req.body.user_id,
                    msg: req.body.msg,
                    index: val + 1
                };
                conn.collection(doc.chat_name).insert(message);
                res.end("success");
            })

        });
    } catch (e) {
        console.log("add_chat err:" + e);
        res.end("err");
    }
})
app.post('/test_ans', function (req, res) {
    console.log("test_answer");
    console.log(req.body);
    if (req.body.user_ans == "accept") {
        //둘다 수락인지 아닌지 확인하고 한명만 수락이면 패스 둘다 수락이면 채팅방 ㄱㄱ
        //when the match success
        user.findOne({user_id: req.body.user_id}).exec(function (err, doc) {
            user.findOne({user_id: doc.user_target_id}).exec(function (err, doc_l) {
                if (doc_l.user_like == "1") {

                    //set user's chat_name data
                    doc.chat_name = doc.user_id + "/" + doc.user_target_id;
                    doc_l.chat_name = doc.user_id + "/" + doc.user_target_id;

                    //메시지발송하기
                    doc_l.user_on_chat = "1";
                    doc_l.user_on_test = "0";
                    doc.user_on_chat = "1";
                    doc.user_on_test = "0";
                    doc_l.save();
                    doc.save();
                    sendMessageToUser(doc_l.user_token, {status: "chat"});
                    sendMessageToUser(doc.user_token, {status: "chat"});
                    console.log("1");

                    //make chat collection
                    make_chat(doc.user_id, doc_l.user_id);
                    res.end("chat");
                }
                else {
                    //one person accepted
                    doc.user_like = "1";
                    doc.save();
                    sendMessageToUser(doc_l.user_token, {status: "one_more"}); //상대방에게 좋아요
                    console.log("2");
                    res.end("yet");
                }
            })

        })
    }
    else if (req.body.user_ans == "reject") {
        //전부 파토내버림 ㅃㅃ
        //reject!
        user.findOne({user_id: req.body.user_id}).exec(function (err, doc) {
            user.findOne({user_id: doc.user_target_id}).exec(function (err, doc_l) {
                doc_l.user_target_id = "";
                doc_l.user_on_test = "0";
                doc_l.like = "0";
                doc_l.save();
                doc.user_target_id = "";
                doc.like = "0";
                doc.user_on_test = "0";
                doc.save();
                sendMessageToUser(doc_l.user_token, {status: "re"});
                sendMessageToUser(doc.user_token, {status: "re"});
                res.end("bye");
            })
        })
    }
    else {
        console.log("error");
    }
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
            res.end(JSON.stringify(doc))
        }
        else {
            res.end("unmatch")
        }
    })
})
app.post('/debug_session', function (req, res) {
    console.log("세선디버그 가:");
    user.findOne({user_id: "가"}).exec(function (err, doc) {
        //나중에 로그인 가능여부 판별후에 해야함.
        console.log(doc);
        doc.save();
        res.end(JSON.stringify(doc))
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
            doc.user_target_id = "";
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
