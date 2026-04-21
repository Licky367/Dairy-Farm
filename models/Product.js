const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
id: {
type: String,
required: true,
unique: true,
trim: true
},

name: {
type: String,
required: true,
trim: true
},

category: {
type: String,
required: true,
trim: true
},

image: {
type: String,
default: ""
},

cost: {
type: Number,
required: true,
min: 0
},

depositPercentage: {
type: Number,
required: true,
min: 0,
max: 100
},

depositAmount: {
type: Number,
required: true,
min: 0,
default: 0
},

itemsAvailable: {
type: Number,
required: true,
min: 0,
default: 0
},

description: {
type: String,
required: true,
trim: true
},

status: {
type: String,
enum: ["In Stock", "Low Stock", "Out of Stock"],
default: "In Stock"
}
},
{
timestamps: true
}
);

/* AUTO CALCULATIONS BEFORE SAVE */
productSchema.pre("save", function(next){

this.depositAmount =
(this.cost * this.depositPercentage) / 100;

/* AUTO STOCK STATUS */
if(this.itemsAvailable <= 0){
this.status = "Out of Stock";
}
else if(this.itemsAvailable <= 5){
this.status = "Low Stock";
}
else{
this.status = "In Stock";
}

next();
});

/* AUTO CALCULATIONS BEFORE UPDATE */
productSchema.pre("findOneAndUpdate", function(next){

const update = this.getUpdate();

if(update.cost !== undefined ||
update.depositPercentage !== undefined){

const cost =
Number(update.cost ?? 0);

const percentage =
Number(update.depositPercentage ?? 0);

update.depositAmount =
(cost * percentage) / 100;
}

if(update.itemsAvailable !== undefined){

const qty =
Number(update.itemsAvailable);

if(qty <= 0){
update.status = "Out of Stock";
}
else if(qty <= 5){
update.status = "Low Stock";
}
else{
update.status = "In Stock";
}

}

next();
});

module.exports =
mongoose.model("Product", productSchema);