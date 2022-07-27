const { DateTime } = require("luxon");

let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let AuthorSchema = new Schema(
    {
        first_name: {type: String, required: true, maxLength: 100},
        family_name: {type: String, required: true, maxLength: 100},
        date_of_birth: {type: Date},
        date_of_death: {type: Date},
    }
);

// Virtual for author's full name
AuthorSchema
    .virtual("name")
    .get(function(){
        //Para prevenir erroers en donde un autor no tenga ni nombre o apellido,
        // hay que asegurar que se maneja la excepción al retornar un STRING vacío
        // en ese caso.
        let fullname = '';
        if(this.first_name && this.family_name){
            fullname = this.family_name + ', ' + this.first_name
        }
        if(!this.first_name || !this.family_name){
            fullname = '';
        }
        return fullname;
    })

//Virtual for author's lifespan
AuthorSchema.virtual("lifespan").get(function(){
    let lifetime_string = '';
    if(this.date_of_birth){
        lifetime_string = this.date_of_birth.getFullYear().toString();
    }
    lifetime_string += " - ";
    if(this.date_of_death){
        lifetime_string += this.date_of_death.getFullYear();
    }
    return lifetime_string;
})

//Virtual for author's URL
AuthorSchema
    .virtual("url")
    .get(function(){
        return '/catalog/author' + this._id;
    });

AuthorSchema
    .virtual("birth_formatted")
    .get(function(){
        return this.date_of_birth ? 
        DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) 
        : 
        "";
    });

AuthorSchema
    .virtual("death_formatted")
    .get(function(){
        return this.date_of_death ? 
        DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) 
        : 
        "";
    });
//Export model
module.exports = mongoose.model('Author', AuthorSchema);