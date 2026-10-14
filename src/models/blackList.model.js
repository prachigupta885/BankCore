
const mongoose = require("mongoose");

const tokenBlackListSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to blacklisting"],
        unique: [true, "token is already blacklisted"]
    },

}, {
    timestamps: true
});

tokenBlackListSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 60 * 60 * 24 * 3  //3 days
});

const tokenBlackListModel = mongoose.model(
    "tokenblackList",
    tokenBlackListSchema
);

module.exports = tokenBlackListModel;
