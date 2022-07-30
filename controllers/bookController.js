var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
let { body, validationResult } = require("express-validator");

var async = require('async');

exports.index = function(req, res) {

    async.parallel({
        book_count(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books.
exports.book_list = function(req, res, next) {
    Book.find({}, "title author")
        .sort({title:1})
        .populate('author')
        .exec(function(err, list_books){
            if(err){return next(err)}
            // Todo salió bien, por lo que se renderiza la plantilla
            res.render("book_list", {title: 'Book list', book_list: list_books})
        })
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {
    async.parallel({
        book(callback){
            Book.findById(req.params.id)
                .populate("author")
                .populate("genre")
                .exec(callback);
        },
        book_instance(callback){
            BookInstance.find({'book': req.params.id})
                        .exec(callback);
        }
    }, function(err, results){
        if(err){return next(err)}
        if(results.book === null){
            let err = new Error('Book not found');
            err.status = 404;
            return next(err);
        } 
        res.render("book_detail", {
            title: results.book.title,
            book: results.book,
            book_instances: results.book_instance,
        })
    })
};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {

    async.parallel({
        authors(callback){
            Author.find(callback)
        },
        genres(callback){
            Genre.find(callback);
        }
    }, function(err, results){
        if(err) { return  next(err);}
        res.render("book_form", {
            title: "Create Book",
            authors: results.authors,
            genres: results.genres,
        })
    })
};

// Handle book create on POST.
exports.book_create_post = [
    //Convertir el género ingresado por el usuario en un arreglo
    (req, res, next) => {
        if(!(Array.isArray(req.body.genre))){
            if(typeof req.body.genre === 'undefined'){
                req.body.genre = []
            } else {
                req.body.genre = [...req.body.genre];
            }
        }
        next();
    },

    body("title", "Title must not be empty").trim().isLength({min: 1}).escape(),
    body('author', 'Author must not be empty').trim().isLength({min: 1}).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({min: 1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({min: 1}).escape(),
    body('genre.*').escape(),

    (req, res, next) => {
        const errors = validationResult(req)
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });

        if(!errors.isEmpty()){
            // Se deben buscar de nuevo a los autore y géneros
            async.parallel({
                authors(callback){
                    Author.find(callback);
                },
                genres(callback){
                    Genre.find(callback);
                }
            }, function(err, results){
                if(err){return next(err)}

                //Se marcan los géneros seleccionados como CHECKED
                for(let i = 0; i<results.genres.length; i++){
                    if(book.genre.indexOf(results.genres[i]._id) > -1){
                        results.genres[i].checked = 'true';
                    }
                }

                res.render('book_form', {
                    title: 'Create Book',
                    authors: results.authors,
                    genres: results.genres,
                    errors: errors.array(),
                    book: book,
                });
            });
            return;
        } else {
            //Los datos ingresados son válidos
            book.save(function(err){
                if(err){return next(err)}
                res.redirect(book.url);
            });
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book(callback){
            Book.findById(req.params.id).populate("author").populate("genre").exec(callback);
        },
        book_instances(callback){
            BookInstance.find({"book": req.params.id}).populate("book").exec(callback);
        },
    }, function(err, results){
        if(err) { return next(err); }
        if(results.book === null){
            res.redirect("/catalog/books")
        }
        res.render("book_delete", {
            title: "Delete Book",
            book: results.book,
            book_instances: results.book_instances,
        })
    })
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
    async.parallel({
        book(callback){
            Book.findById(req.body.bookid).exec(callback);
        },
        book_instances(callback){
            BookInstance.find({"book": req.body.bookid}).exec(callback);
        },
    }, function(err, results){
        if(err) { return next(err) }
        if(results.book_instances.length > 0){
            //El objeto sigue estando referenciado por otro, por lo que se renderiza como con GET el FORM
            res.render("book_delete", {
                title: "Delete Book",
                book: results.book,
                book_instances: results.book_instances,
            })
            return;
        } else {
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err){
                if(err){ return next(err) }
                res.redirect("/catalog/books");
            })
        }
    })
};

// Display book update form on GET.
exports.book_update_get = function(req, res) {
    async.parallel({
        book(callback){
            Book.findById(req.params.id).populate("author").populate("genre").exec(callback);
        },
        authors(callback){
            Author.find(callback);
        },
        genres(callback){
            Genre.find(callback);
        }
    }, function(err, results){
        if(err) { return next(err); }
        if(results.book === null){
            let err = new Error("Book not found");
            err.status = 404;
            return next(err);
        }
        //Success
        //Marcar todos los géneros seleccionados como CHECKED
        results.genres.forEach(genre => {
            //Se revisan los géneros incluidos en el libro para ver si coincide con el actual género de iteración.
            //Se hace por medio del _id
            results.book.genre.forEach(book_genre => {
                if(genre._id.toString() === book_genre._id.toString()){
                    genre.checked = "true";
                }
            })
        });
        res.render("book_form", {
            title: "Update Book",
            authors: results.authors,
            genres: results.genres,
            book: results.book,
        })
    })
};

// Handle book update on POST.
exports.book_update_post = [

    //Convertir el género en un arreglo
    (req, res, next) => {
        if(!Array.isArray(req.body.genre)){
            if(typeof req.body.genre === "undefined"){
                req.body.genre = [];
            } else {
                req.body.genre = [req.body.genre];
            }
        }
        next();
    },

    //Validar y sanitizar 
    body("title", 'Title must not be empty').trim().isLength({min: 1}).escape(),
    body('author', "Author must not be empty").trim().isLength({min: 1}).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({min: 1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({min: 1}).escape(),
    body('genre.*').escape(),

    //Proceso después de validación
    (req, res, next) => {
        const errors = validationResult(req);

        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre === 'undefined' ? [] : req.body.genre),
            _id: req.params.id, //Si no se especifica entonces se le iba a crear uno nuevo
        });

        if(!errors.isEmpty()){
            //Hay errores en los datos dados en el formulario, por lo que se debe renderizar de nuevo
            async.parallel({
                authors(callback){
                    Author.find(callback);
                },
                genres(callback){
                    Genre.find(callback);
                }
            }, function(err, results){  
                //Marcar géneros como CHECKED
                results.genres.forEach(genre => {
                    if(book.genre.indexOf(genre)>-1){
                        genre.checked = 'true';
                    }
                })
                res.render("book_form", {
                    title: "Update Book",
                    authors: results.authors,
                    genres: results.genres,
                    book: book,
                    errors: errors.array(),
                });
            });
            return;
        } else {
            //Los datos son válidos
            Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook){
                if(err) { return next(err) }
                res.redirect(thebook.url)
            })
        }
    }
];