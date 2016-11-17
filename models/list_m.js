/**
 * Created by AJH322 on 2016-11-17.
 */
var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    index:{type:Number},
    user_id:{type:String}
});
var user = mongoose.model('list_m', userSchema, "list_m");
module.exports = list_m;