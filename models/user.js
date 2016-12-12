/**
 * Created by AJH322 on 2016-11-11.
 */
var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    user_id: {type:String,required:true,unique:true},
    user_pw:{type:String},
    user_name:{type:String},
    user_gender:{type:String}, //남성,여성
    user_species:{type:String}, //과
    user_first:{type:String,default:"0"}, //최초소개팅 했음
    user_session:{type:String,default:""},
    user_token:{type:String,default:""},
    user_on_search:{type:String,default:"0"}, //검색중
    user_on_test:{type:String,default:"0"}, //테스트상태
    user_on_chat:{type:String,default:"0"}, //채팅상태
    user_target_id:{type:String,default:""}, //테스트상태인 상대방 id
    user_like:{type:String,default:"0"}, // partner liked
    chat_name:{type:String,default:""} // chat room name
});
var user = mongoose.model('user', userSchema, "user");
module.exports = user;