const mongoose = require("mongoose")
const {ObjectId} = mongoose.Schema;

const ProductCartSchema = new mongoose.Schema({
    product: { type: ObjectId, ref: "Product"},
    name: String,
    count: Number,
    price: Number

});

const orderSchema = new mongoose.Schema({
    products: [ProductCartSchema],
    transaction_id: {},
    status: {
        type: String,
        default: "Recieved",
        enum: ["Delivered", "Cancelled", "Shipped", "Processing", "Recieved"]
    },
    amount: {type: Number},
    address: String,
    user: {
        type: ObjectId,
        ref: "User"
    }
}, {timestamps: true})

const Order = mongoose.model("Order", orderSchema);
const ProductCart = mongoose.model("ProductCart", ProductCartSchema);

module.exports = { Order, ProductCart }