const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");
const port = process.env.PORT || 5000;
const users = require("./routers/users");

//internal import
const { notFounderHandler, errorHandler } = require("./middleWares/errorHandler");

// express app initialization
const app = express();
dotenv.config();
app.use(
  cors({
    credentials: true,
    crossDomain: true,
    origin: [
      "http://localhost:3000",
      "https://relation-application.web.app/",
      "https://relation-application.firebaseapp.com/",
    ],
  })
);
app.use(express.json());

// database connection with mongoose

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.ebnmt.mongodb.net/relation-app?retryWrites=true&w=majority`;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4,
  })
  .then(() => console.log("database connection successfully"))
  .catch((error) => console.log(error));

//request parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//set view engine
app.set("view engine", "ejs");

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//routers
app.use("/user", users);

//
app.use(notFounderHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`app listen port ${port}`);
});
