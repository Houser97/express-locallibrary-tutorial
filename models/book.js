const mongoose = require("mongoose");
let { DateTime } = require("luxon");

let Schema = mongoose.Schema;

let BookSchema = new Schema({
    title: {type: String, required:true},
    author: {type: Schema.Types.ObjectId, ref: 'Author', required: true},
    summary: {type: String, required: true},
    isbn: {type: String, required:true},
    genre: [{type: Schema.Types.ObjectId, ref : 'Genre'}]
});

//Virtual para el URL del libro
BookSchema
    .virtual('url')
    .get(function(){
        return '/catalog/book/' + this._id;
    });

BookSchema
    .virtual('due_back_formatted')
    .get(function(){
        return this.due_back ?
        DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED)
        :
        "";
    })

module.exports = mongoose.model('Book', BookSchema);