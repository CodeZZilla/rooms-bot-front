const {Schema, model, Types} = require("mongoose");

const schema = new Schema({
    chat: {type: String, required: true},
    name: {type: String, required: true},
    last_name: {type: String},
    idCity: {type: Types.ObjectId, ref:'City'}


});

module.exports = model("User", schema);
