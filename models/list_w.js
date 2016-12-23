/**
 * Created by AJH322 on 2016-11-17.
 */
var mongoose = require('mongoose');
var conn = mongoose.createConnection('mongodb://35.161.80.18:27017/user');
var userSchema = new mongoose.Schema({
    index:{type:Number},
    user_id:{type:String}
});
var list_w = conn.model('list_w', userSchema, "list_w");
module.exports = list_w