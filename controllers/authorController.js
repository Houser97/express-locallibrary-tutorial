let Author = require("../models/author");
let Book = require("../models/book");
let async = require("async");

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
    res.send("No implementado: Crear autor con GET.");
}

// Gestionar creación de autor con POST.
exports.author_create_post = function(req, res){
    req.send("No implementado: Crear autor con POST");
}

// Mostrar formulario para eliminar autor con GET
exports.author_delete_get = function(req, res){
    res.send("No implementado: Eliminar autor con GET");
}

// Handle Author delete on POST.
exports.author_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author delete POST');
};

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
exports.author_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update POST');
};