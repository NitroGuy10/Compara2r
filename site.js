const dotenv = require("dotenv")
dotenv.config()

const express = require("express")
const res = require("express/lib/response")
const { database } = require("pg/lib/defaults")
const app = express()
const port = process.env.PORT || 3000

const db = require("./database.js")
const dataset = require("./dataset.js")


app.use(express.json())
app.use("/static", express.static("static"))

app.get("/", (request, response) => {
    response.sendFile(__dirname + "/pages/index.html")
})

app.get("/comparison", (request, response) => {
    const line1 = Math.floor(Math.random() * (dataset.getNumLines())) + 1
    let line2
    do
    {
        line2 = Math.floor(Math.random() * (dataset.getNumLines())) + 1
    }
    while (line2 == line1)

    dataset.getLine(line1, (text1) => {
        dataset.getLine(line2, (text2) => {
            const comparison = {
                line1: line1,
                text1: text1,
                line2: line2,
                text2: text2
            }
            
            db.storePrompt(db.makeHash(request.ip), [line1, line2])
            response.send(comparison)
        })
    })
})

app.post("/comparison", (request, response) => {
    if (request.body.voteLine && typeof request.body.voteLine === "number" &&
        request.body.passUpLine && typeof request.body.passUpLine === "number" &&
        request.body.isFlag != undefined && typeof request.body.isFlag === "boolean" &&
        request.body.voteLine > 0 && request.body.voteLine <= dataset.getNumLines() &&
        request.body.passUpLine > 0 && request.body.passUpLine <= dataset.getNumLines())
    {
        db.vote(db.makeHash(request.ip), request.body)
    }

    response.send({ })
})

app.get("/results/" + process.env.ADMIN_PASSWORD, (request, response) => {
    // TODO send csv file of results
    // but only if you can guess the super long secret password
    // each item in dataset with percent of matchups won, how many votes, how many flags, how many passups, who voted for it (and how many times), who flagged it, who passed up on it (and how many times),
    // sorted by percent of matchups won
    // exclude data from blacklisted users
    response.send("<p>results!</p>")
})

app.get("/users/" + process.env.ADMIN_PASSWORD, (request, response) => {
    // TODO send csv file of users
    // but only if you can guess the super long secret password
    // each user that ever submitted anything with how many things they voted for, how many things they flagged, how many things they passed up on, what they voted for (and how many times), what they flagged, what they passed up on (and how many times),
    // sorted by number of votes
    // exclude data from blacklisted users
    response.send("<p>users!</p>")
})

app.get("/dataset/" + process.env.ADMIN_PASSWORD, (request, response) => {
    // TODO send csv file of dataset
    // but only if you can guess the super long secret password
    // the decimal line number, the item itself
    response.send("<p>dataset!</p>")
})

app.listen(port, () => {
    console.log("Listening on port " + port)
})
