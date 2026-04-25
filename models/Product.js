const mongoose = require("mongoose");

/* ================= PACKAGE SUB-SCHEMA ================= */
const packageSchema = new mongoose.Schema({
    units: {
        type: Number,
        required: true,
        min: 1
    },
    BP: {
        type: Number,
        required: true,
        min: 0
    },
    remainingUnits: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true });

/* ================= 🔥 ALLOCATION SUB-SCHEMA (NEW) ================= */
const allocationSchema = new mongoose.Schema({
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    unitsTaken: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

/* ================= PRODUCT SCHEMA ================= */
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

    /* ================= FIFO FIELDS ================= */

    productUnits: {
        type: Number,
        default: 0,
        min: 0
    },

    packages: [packageSchema],   // ✅ CORE INVENTORY SYSTEM

    /* 🔥 NEW: TRACK EXACT STOCK USAGE */
    allocations: {
        type: [allocationSchema],
        default: []
    },

    /* ============================================ */

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

/* ================= PRE-SAVE ================= */
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

/* ================= PRE-UPDATE ================= */
productSchema.pre("findOneAndUpdate", function(next){

    const update = this.getUpdate();

    /* deposit recalculation */
    if(update.cost !== undefined ||
       update.depositPercentage !== undefined){

        const cost = Number(update.cost ?? 0);
        const percentage = Number(update.depositPercentage ?? 0);

        update.depositAmount =
        (cost * percentage) / 100;
    }

    /* stock status update */
    if(update.itemsAvailable !== undefined){

        const qty = Number(update.itemsAvailable);

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