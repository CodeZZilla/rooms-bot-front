const {Schema, model, Types} = require("mongoose");

const schema = new Schema({
    name: {type: String, required: true},
    name_site: {type: String}

});

module.exports = model("City", schema);
