require("dotenv").config()
const mongoose = require("mongoose")
const userModel = require("./src/models/user.model")

async function run() {
    await mongoose.connect(process.env.MONGO_URI)

    const result = await userModel.collection.updateOne(
        { email: "system@gmail.com" },   // <-- apna system user ka email yahan likho
        { $set: { systemUser: true } }
    )

    console.log("matched:", result.matchedCount, "modified:", result.modifiedCount)
    await mongoose.disconnect()
}
run()