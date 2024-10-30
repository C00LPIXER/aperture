const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
    walletHistory: [
        {
            transactionType: {
                type: String,
                enum: ["credit", "debit"],
                required: true,
            },
            amount: {
                type: Number,
                required: true,
            },
            date: {
                type: Date,
                default: Date.now,
            },
            description: {
                type: String,
                enum: ["Refund", "Add to Wallet", "Purchase"]
            },
        }
    ]
});

module.exports = mongoose.model("Wallet", walletSchema);
