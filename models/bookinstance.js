const { DateTime } = require("luxon");

let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let BookInstanceSchema = new Schema({
    book: {type: Schema.Types.ObjectId, ref: 'Book', required: true},
//Reference to the associdated book
    imprint: {type: String, required: true},
    status: {type: String, required: true, enum: ['Available', 'Maintenance',
    'Loaned', 'Reserved'], default : 'Maintenance'},
    due_back : {type: Date, default: Date.now}
});

//Virtual for bookinstance's URL
BookInstanceSchema
    .virtual('url')
    .get(function(){
        return '/catalog/bookinstance/' + this._id;
    });

BookInstanceSchema
    .virtual("due_back_formatted")
    .get(function(){
        return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
    })

module.exports = mongoose.model('BookInstance', BookInstanceSchema);