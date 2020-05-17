const Product = require("../models/product");
const formiable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

// middleware
exports.getProductById = (req, res, next, id) => {
    Product.find(id)
    .populate("category")
    .exec((err, product) => {
        if(err || !product){
            return res.status(400).json({
                error: "Couldn't find this proudct!"
            })
        }
        req.product = product;
        next();
    });
};
// middleware
exports.photo = (req, res, next) => {
    if (req.product.photo.data) {
        res.set("Content-Type", req.product.photo.contentType);
        return res.send(req.product.photo.data)
    }
    next();
};

// create product route
exports.createProduct = (req, res) => {
    let form = new formiable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, file) => {
        if(err){
            return res.status(400).json({
                error: "problem with image"
            });
        }

        // destruct the fields
        const { name, description, price, category, stock } = fields;
        if(!name || !description || !price || !category || !stock){
            return res.status(400).json({
                error: "Please include all fields!"
            })
        }

        // todo: restriction for fields
        let product = new Product(fields);
        if(file.photo){
            if( file.photo.size > 3000000){
                return res.status(400).json({
                    error: "File size too big!"
                });
            }
            product.photo.data = fs.readFileSync(file.photo.path);
            product.photo.contentType = file.photo.type;
        }

        // save to DB
        product.save((err, product) => {
            if(err || !product){
                return res.status(400).json({
                    error: "Could not create ptoduct in DB!"
                });
            }
            return res.json(product);
        });


    });
}

// get product route
exports.getProduct = (req, res) => {
    req.product.photo = undefined;
    return res.json( req.product );
};

// update product route
exports.updateProduct = (req, res) => {
    let form = new formiable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, file) => {
        if (err) {
            return res.status(400).json({
                error: "problem with image"
            });
        }

        // updation code
        let product = req.product;
        product = _.extend(product, fields);
        
        if (file.photo) {
            if (file.photo.size > 3000000) {
                return res.status(400).json({
                    error: "File size too big!"
                });
            }
            product.photo.data = fs.readFileSync(file.photo.path);
            product.photo.contentType = file.photo.type;
        }

        // save to DB
        product.save((err, product) => {
            if (err || !product) {
                return res.status(400).json({
                    error: "Could not update ptoduct in DB!"
                });
            }
            return res.json(product);
        });


    });
};

// delete product route
exports.removeProduct = (req, res) => {
    const product = req.product;
    product.remove((err, deletedProduct) => {
        if(err){
            return res.status(400).json({
                error: `Failed to delete the product "${deletedProduct}" `
            })
        }
        return res.json({
            message: "Deletion was successful",
            deletedProduct
        })
    })
    
};
// get all products
exports.getAllProducts = (req, res) => {

    let limit = req.query.limit ? parseInt(req.query.limit) : 8;
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id" ;

    Product.find()
        .select("-photo")
        .populate("category")
        .sort([[sortBy, "asc"]])
        .limit(limit)
        .exec((err, products) => {
            if(err || !products){
                return res.status(400).json({
                    error: "No products in DB"
                });
            }
            return res.json(products);
        });
};
exports.getAllUniqueCategories = (req, res) => {
    Product.distinct("category", {}, (err, category) => {
        if(err){
            return res.status(400).json({
                error: "No category found"
            });
        }
        return res.json(category);
    })
}



// middleware to update inventory when an order is placed(update stock and sold)
exports.updateInventory = (req, res, next) => {
    let myOperations = req.body.order.products.map( prod => {
        return {
            updateOne: {
                filter: {_id: prod._id},
                update: {$inc: {stock: -prod.count, sold: +prod.count}}
            }
        };
    });
    Product.bulkWrite(myOperations, {}, (err, products) => {
        if(err){
            return res.status(400).json({
                error: "Bulk operations failed!, to update stock and sold"
            });
        }
        next();
    })
}