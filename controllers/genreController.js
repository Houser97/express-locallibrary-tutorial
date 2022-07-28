var Genre = require('../models/genre');
let Book = require("../models/book");
let async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find()
         .sort([["name", "ascending"]])
         .exec(function(err, list_genres){
            if(err){return next(err)}
            res.render("genre_list", {title: "Genre List",
                                      genre_list: list_genres});
         })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre(callback){
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books(callback){
            Book.find({'genre': req.params.id}).exec(callback);
        }
    }, function(err, results){
        if(err){return next(err)}
        if(results.genre === null) { //Si no hay resultados
            let err = new Error("Genre not found");
            err.status = 404;
            return next(err);
        }
        // Éxito, llamar a render
        res.render("genre_detail", {
           title: "Genre Detail",
           genre: results.genre,
           genre_books: results.genre_books, 
        })
    })
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: "Create Genre"});
};

// Handle Genre create on POST.
exports.genre_create_post = function(req, res, next) {
    // Paso 1. Sanitizar y validar el campo de nombre.
    body('name', 'Genre name required').trim().isLength({min: 1}).escape();
    // Paso 2. Procesar solicitud.
    (req, res, next) => {
        //Paso 2.1. Atrapar errores
        const errors = validationResult(req);

        //Paso 2.2. Crear objeto GENRE con datos ESCAPED y TRIMMED.
        const genre = new Genre(({name: req.body.name}));

        //Paso 2.3. SI hay errores, volver a mostrar el formulario con los errores.
        if(!errors.isEmpty()){
            res.render("genre_form", {
                title: "Create Genre",
                genre, //Este es el objeto GENRE creado.
                errors: errors.array(),
            });
            return;
        } else {
            //Los datos son válidos
            //Paso 2.4. Comprobar que el objeto creado no exista ya.
            Genre.findOne({name: req.body.name}).exec(function(err, found_genre){
                if(err){return next(err)}
            })

            if(found_genre){
                res.redirect(found_genre.url);
            } else {
                //EN caso de que no exista el género, se guarda la instancia.
                genre.save((err) => {
                    if(err){return next(err)}
                }) 
                // Una vez que se guardó, se redirecciona al usuario al género creado.
                res.redirect(genre.url);
            }
        }
    }
};

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete GET');
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete POST');
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};
