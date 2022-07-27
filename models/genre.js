let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let GenreSchema = new Schema({
    name: {type: String, required: true, maxLength: 100, minLength: 3}
})

//Virtual for the URL
GenreSchema
    .virtual('url')
    .get(function(){
        return '/catalog/genre/' + this._id;
    });

module.exports = mongoose.model('Genre', GenreSchema);