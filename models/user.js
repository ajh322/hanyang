/**
 * Created by AJH322 on 2016-11-11.
 */
var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    user_id: {type:Number,required:true,unique:true},
    user_pw:{type:String},
    user_name:{type:String},
    user_gender:{type:String},
    user_species:{type:String},
    user_first:{type:String,default:"0"}, //최초소개팅 했음
});
var user = mongoose.model('user', userSchema, "user");
module.exports = user;