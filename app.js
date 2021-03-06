var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var http = require('http');
var server = http.Server(app);
var bodyParser = require('body-parser');
mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://35.161.80.18:27017/user');
var conn = mongoose.createConnection('mongodb://35.161.80.18:27017/user');
var conn2 = mongoose.createConnection('mongodb://35.161.80.18:27017/chat');
var user = require('./models/user');
var list_m = require('./models/list_m');
var list_w = require('./models/list_w');
var chat = require('./models/chat');
var io = require('socket.io')(server);
var request = require('request');
var Worker = require('webworker-threads').Worker;
var multer = require('multer')
var path = require('path');

var storage_main = multer.diskStorage({
    destination: 'public/images',
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

var upload = multer({storage: storage_main});
var fs = require('fs');

function get_chat_model(chat_id) {
    var chat_Schema = chat;
    var model = conn2.model(chat_id, chat_Schema, chat_id);
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

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
function sendMessageToUser(deviceId, message) {
    console.log("test");
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
                    tag:deviceId,
                    body: str_body,
                    click_action: str_click_action
                },
                data: message,
                //"to": deviceId
                to: deviceId,
                collapse_key:deviceId
            }
        )
    }, function (error, response, body) {
        var obj = JSON.parse(body);
        console.log(typeof (obj.results[0].error));
        console.log(typeof (JSON.stringify(obj.results[0].error)));
        if (obj.results[0].error + "" == "MissingRegistration") {
            console.log("resend!");
            console.log("devideId" + deviceId);
            console.log("message" + JSON.stringify(message));
            //sendMessageToUser(deviceId, message);
        }
        console.log("에러사항" + obj.results[0].error);
        if (error) {
            console.log(body);
        }
        else if (response.statusCode >= 400) {
            console.error('HTTP Error: ' + response.statusCode + ' - ' + response.statusMessage + '\n' + body);
        }
        else {
            console.log('Done!')
            console.log("devideId" + deviceId);
            console.log(("message" + JSON.stringify(message)));
            console.log(body);
        }
    });
}
server.listen(9000, function () {
    // search_worker();
    //setInterval(search, 10000); //10분
    worker();
    console.log("running! port:9000");

    
});
function worker() {
    var worker = new Worker(function () {
        postMessage("");
        this.onmessage = function (event) {
            self.close();
        };
    });
    worker.onmessage = function (event) {
        setInterval(search, 10000);
    };
    worker.postMessage("");
}
function search() {
    console.log("searching!")/*
    user.findOne({user_id: "ㅎㅇ"}).exec(function (err, doc_1) {
        sendMessageToUser(doc_1.user_token, {sent_by: "2", status: "add_chat", msg: "테스팅"});
    })*/
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
    console.log(__dirname);
    //res.sendFile(__dirname + '/index.html');

    /*console.log("add_chat");
     try {
     user.findOne({user_id: "ㄴ"}).exec(function (err, doc) {
     //ㄴ가 메시지를 보내므로 ㄱ한테서 알람이 와야함.
     var val = 0; //msg index
     var target_token = ""; //target token

     //target token initialize
     user.findOne({user_id: doc.user_target_id}).exec(function (err, doc_1) {
     target_token = doc_1.user_token;
     })

     //find the index
     get_chat_model(doc.chat_name).findOne({}).sort('-index').exec(function (err, doc_l) {

     //send notification to target_id
     sendMessageToUser(target_token, {status: "add_chat", msg: "테스트"});
     val = doc_l.index;
     console.log("index num:" + val);

     //add msg to db
     var message = {
     sent_by: "don milse",
     msg: "테스트",
     index: val + 1
     };
     conn.collection(doc.chat_name).insert(message);
     })
     res.end();
     });
     } catch (e) {
     console.log("add_chat err:" + e);
     res.end("err");
     }*/
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
    conn2.model(id + "/" + id_l, chat_Schema, id + "/" + id_l);
    var message = {
        sent_by: "admin",
        msg: id + "님 " + id_l + "님 즐거운 시간 보내세요~",
        index: 0
    };
    conn2.collection(id + "/" + id_l).insert(message);
}
app.post('/get_chatdata', function (req, res) {
    /*
     get whole chat data

     req.body parm
     String user_id

     res
     data exmaple
     [{index:0,msg:"asdd",sent_by:"admin"}, {index:0,msg:"asdd",sent_by:"admin"}, {index:0,msg:"asdd",sent_by:"admin"}]
     */
    user.findOne({user_id: req.body.user_id}).exec(function (err, doc) {
        get_chat_model(doc.chat_name).find({}).exec(function (err, doc_l) {
            res.end(JSON.stringify(doc_l));
        })
    })
});
app.post('/add_img', upload.single('file'), function (req, res) {
    /*
     req.body parm
     String user_id
     File file

     res
     no specific json data
     just "success" or "error"

     push notification to target_id
     add msg to db
     */
    //console.log(req.file);

    /*
     user -> img_dir must be changed,
     delete image if already exsit
     */
    if (req.file != null) {
        user.findOne({user_id: req.body.user_id}).exec(function (err, doc) {
            if (doc.profile_img_dir != "") {
                //refresh image
                fs.unlink(doc.profile_img_dir, function (err) {
                    if (err) return console.log(err);
                });
            }
            doc.profile_img_dir = req.file.path;
            doc.save();
        })
    }
    res.end();
})
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
    if (req.body.user_id != "" && req.body.msg != "") {
        try {
            user.findOne({user_id: req.body.user_id}).exec(function (err, doc) {

                var val = 0; //msg index
                var target_token = ""; //target token

                //target token initialize
                user.findOne({user_id: doc.user_target_id}).exec(function (err, doc_1) {
                    target_token = doc_1.user_token;

                    //sometimes target token initialize works slowly.
                    return after();
                })

                function after() {
                    //find the index
                    get_chat_model(doc.chat_name).findOne({}).sort('-index').exec(function (err, doc_l) {

                        //send notification to target_id
                        if (target_token != doc.user_token) //이거때문에 디버깅 불가능함.
                        {
                            console.log("target_token:" + target_token);
                            console.log("doc.user_token:" + doc.user_token);
                            sendMessageToUser(target_token, {sent_by: req.body.user_id, status: "add_chat", msg: req.body.msg});
                        }
                        val = doc_l.index;
                        console.log("index num:" + val);

                        //add msg to db
                        var message = {
                            sent_by: req.body.user_id,
                            msg: req.body.msg,
                            index: val + 1
                        };
                        conn2.collection(doc.chat_name).insert(message);
                        res.end("success");
                    })
                }
            });
        } catch (e) {
            console.log("add_chat err:" + e);
            res.end("err");
        }
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
            if (doc.user_gender == "남성") {
                list_m.remove({user_id: req.body.user_id}, function (err) {
                    console.log(err);
                });
            }
            else if (doc.user_gender == "여성") {
                list_w.remove({user_id: req.body.user_id}, function (err) {
                    console.log(err);
                });
            }
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
