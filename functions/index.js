const functions = require("firebase-functions");
const firebase = require("firebase-admin");
const express = require("express");
const engines = require("consolidate");
//const bodyParser = require("body-parser");

const firebaseApp = firebase.initializeApp(
    functions.config().firebase
);

const db = firebaseApp.firestore();

db.settings({
  timestampsInSnapshots: true
});

function getMonthName(month) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthNames[month];
}

function formatPost(post) {
    let docData = post.data();

        const date = docData.date.toDate();
        const dateString = getMonthName(date.getMonth()) + " " + date.getDate() + ", " + date.getFullYear();
        docData.date = dateString;

        docData.postURL = post.ref.path;

        return docData;
}

function requestAllPosts() {
    return db.collection("posts").get().then(
        snap => snap.docs.map(
            doc => formatPost(doc)
        )
    );
}

function requestNLatestPosts(n) {
    return db.collection("posts").limit(n).get().then(
        snap => snap.docs.map(
            doc => formatPost(doc)
        )
    );
}

function requestPost(postID) {
    return db.collection("posts").doc(postID).get().then(
        post => {
            if(post.exists) {
                return formatPost(post);
            }
            
            return null;
        }
    );
}

const app = express();
app.engine("hbs", engines.handlebars);
app.set("views", "./views");
app.set("view engine", "hbs");

app.get("/", (request, response) => {
    //response.set("Cache-Control", "public, max-age=300, s-maxage=600");
    requestNLatestPosts(5).then(posts => {
        response.render("index", {posts});
    });
});

app.get("/posts/:postID", (request, response) => {
    requestPost(request.params.postID).then(post => {
        if (post !== null) {
            response.render("post", post);
        } else {
            response.send("Post does not exist!");
        }
    });
});

app.get("/posts-all", (request, response) => {
    requestAllPosts().then(posts => {
        response.render("all-posts", {posts});
    });
});

exports.app = functions.https.onRequest(app);
