let Author = require("../models/author");
let Book = require("../models/book");
let Genre = require("../models/genre");
let async = require("async");
const { body, validationResult } = require('express-validator')

// Mostrar lista de todos los autores.
exports.author_list = function(req, res, next){
    Author.find()
          .sort([["family_name", "ascending"]])
          .exec(function(err, list_authors){
            if(err){return next(err)}
            res.render("author_list", {title: "Author List",
                                       author_list: list_authors});
          });
}

// Mostrar la página de detalles para un autor específico.
exports.author_detail = function(req, res, next){
    async.parallel({

        author(callback){
            Author.findById(req.params.id)
                  .exec(callback);
        }, 
        authors_books(callback){
            Book.find({'author': req.params.id}, 'title summary')
                .exec(callback);
        }
    }, function(err, results){
        if(err){return next(err)}
        if(results.author === null){
            let err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render("author_detail", {
            title: 'Author Detail',
            author: results.author,
            author_books: results.authors_books,
        })
    })
    Author.findById()
}

// Mostrar formulario de creación de autores con verbo GET.
exports.author_create_get = function(req, res){
    res.render('author_form', {
        title: "Create Author"
    });
}

// Gestionar creación de autor con POST.
exports.author_create_post = [
    body("first_name", "Author first name required").trim().isLength({min: 1})
                                                    .escape()
                                                    .withMessage("First name must be specified.")
                                                    .isAlphanumeric()
                                                    .withMessage("First name has non-alphanumeric characters."),
    body("family_name", "Author family name required").trim().isLength({min: 1})
                                                      .escape()
                                                      .withMessage("Family name must be specified.")
                                                      .isAlphanumeric()
                                                      .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth").optional({checkFalsy: true}).isISO8601().toDate(),
    body("date_of_death", "Invalid date of death").optional({checkFalsy: true}).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.render("author_form", {
                title: "Create Author",
                author: req.body,
                errors: errors.array()
            });
            return;
        } else {
            let author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
            });
            author.save(function(err) {
                if(err){return next(err)}
                res.redirect(author.url)
            });
        }
    },
];

// Mostrar formulario para eliminar autor con GET
exports.author_delete_get = function(req, res, next){
    async.parallel({
        author(callback){
            Author.findById(req.params.id).exec(callback);
        },
        books(callback){
            Book.find({"author": req.params.id}).exec(callback);
        }
    }, function(err, results){
        if(err){return next(err)}
        if(results.author === null){
            res.redirect("/catalog/authors")
        }
        res.render("author_delete", {
            title: "Delete Author",
            author: results.author,
            author_books: results.books,
        })
    })
}

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
    async.parallel({
        //Se usa BODY porque la información viene de un formulario, no de una petición HTTP y el URL.
        author(callback){
            Author.findById(req.body.authorid).exec(callback);
        },
        author_books(callback){
            Book.find({"author": req.body.authorid}).exec(callback);
        }
    }, function(err, results){
        if(err) { return next(err) }
        // Comprobar que no existan libros referenciados al autor
        if(results.author_books.length > 0){
            //Si hay libros referenciados, entonces se renderiza de igual manera que con GET
            res.render("author_delete", {
                title: "Delete AUthor",
                author: results.author,
                author_books: results.author_books,
            })
            return;
        } else {
            //EL author no tiene libros, por lo que se borra
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err){
                if(err) { return next(err) }
                res.redirect("/catalog/authors")
            })
        }
    })
};

// Display Author update form on GET.
exports.author_update_get = function(req, res, next) {
    async.parallel({
        author(callback){
            Author.findById(req.params.id).exec(callback);
        },
    }, function(err, results){
        if(err){return next(err)}
        if(results.author === null){
            let err = new Error('Author not found.');
            err.status = 404;
            return next(err);
        }
        res.render("author_form", {
            title: "Update Author",
            author: results.author
        })
    })
};

// Handle Author update on POST.
exports.author_update_post = [
    body("first_name", "Author first name required").trim().isLength({min: 1})
                                                    .escape().withMessage("First name must be specified")
                                                    .isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
    body("family_name", "Author family name required").trim().isLength({min: 1})
                                                      .escape().withMessage("Family name must be specified")
                                                      .isAlphanumeric().withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date").optional({checkFalsy: true}).isISO8601().toDate(),
    body("date_of_death", "Invalid date").optional({checkFalsy: true}).isISO8601().toDate(),

    //Actualizar autor
    (req, res, next) => {
        //Revisar si hay errores
        const errors = validationResult(req);
        //Actualizar autor
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id,
        })
        //Revisar errores
        if(!errors.isEmpty()){
            res.render("author_form", {
                title: "Update Author",
                author: author,
                errors: errors.array(),
            })
            return;
        } else {
            Author.findByIdAndUpdate(req.params.id, author, {}, function(err, updatedAuthor){
                if(err){return(next(err))}
                res.redirect(updatedAuthor.url);
            })
        }
    }
];