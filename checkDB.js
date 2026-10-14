require("dotenv").config()
const mongoose = require("mongoose")

async function run() {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("DB name:", mongoose.connection.name)

    const cols = await mongoose.connection.db.listCollections().toArray()
    for (const c of cols) {
        const count = await mongoose.connection.db.collection(c.name).countDocuments()
        console.log(JSON.stringify(c.name), "->", count, "documents")
    }
    await mongoose.disconnect()
}
run()