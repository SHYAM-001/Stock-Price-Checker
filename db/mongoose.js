var mongoose = require("mongoose");
require("dotenv").config();

const CONNECTION_STRING = "mongodb+srv://shyamkathir:Shyamsharmi007@cluster0.byojbkp.mongodb.net/freecodecamp?retryWrites=true&w=majority"; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

mongoose.connect(CONNECTION_STRING, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
const db = mongoose.connection;
db.on("error", console.error.bind("console", "connection error"));
db.once("open", () =>
  console.log("Connection successfully established to database!")
);

module.exports = db;
