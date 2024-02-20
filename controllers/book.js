const Book = require('../models/Book');
const fs = require('fs');


exports.createBook = (req, res, next) => {
    const thingObject = JSON.parse(req.body.book);
    delete thingObject._id;
    delete thingObject._userId;
    const book = new Book({
        ...thingObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
  
    book.save()
    .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
    .catch(error => { res.status(400).json( { error })})
  };



exports.getAllBook = (req, res, next) => {
    Book.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(400).json({ error }));
  };

exports.getOneBook= (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json(book))
      .catch(error => res.status(404).json({ error }));
  };

exports.getBestRating= (req , res , next) =>{
    Book.find()
        .sort({averageRating: -1})
        .limit(3)
        .then(bestRatedBooks => {
            if (bestRatedBooks.length === 0) {
                return res.status(404).json({ message: 'Aucun livre trouvé avec une note moyenne.' });
            }
            res.status(200).json(bestRatedBooks);
        })
    .catch(error => res.status(400).json({error}))
};

exports.modifyBook= (req , res , next)=>{
    const thingObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  
    delete thingObject._userId;
    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message : 'Not authorized'});
            } else {
                Book.updateOne({ _id: req.params.id}, { ...thingObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Objet modifié!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id})
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
  };

exports.postRating = (req, res , next) =>{

        
        if (0 <= req.body.rating <= 5) {
            const ratingObject = { ...req.body, grade: req.body.rating };
            
            delete ratingObject._id;
            
            Book.findOne({_id: req.params.id})
                .then(book => {
                    
                    const newRatings = book.ratings;
                    const userIdArray = newRatings.map(rating => rating.userId);
                    
                    if (userIdArray.includes(req.auth.userId)) {
                        res.status(403).json({ message : 'Vous avez déjà noté le livre' });
                    } else {
                        
                        newRatings.push(ratingObject);
                        
                        const grades = newRatings.map(rating => rating.grade);
                        
                        let some = 0;
                        for( let grade of grades){
                          some +=  grade;
                        }
                        const averageGrades = (some /grades.length).toFixed(1);
                        book.averageRating = averageGrades;
                        
                        Book.updateOne({ _id: req.params.id }, { ratings: newRatings, averageRating: averageGrades, _id: req.params.id })
                            .then(() => { res.status(201).json()})
                            .catch(error => { res.status(400).json( { error })});
                        res.status(200).json(book);
                    }
                })
                .catch((error) => {
                    res.status(404).json({ error });
                });
        } else {
            res.status(400).json({ message: 'La note doit être comprise entre 1 et 5' });
        }
      
}