/**
 * Created by AJH322 on 2016-11-11.
 */
var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    user_id: {type:String,required:true},
    msg: {type:String},
    index:{type:Number,required:true,unique:true}
});
module.exports = userSchema;