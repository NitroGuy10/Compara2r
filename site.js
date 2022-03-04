const express = require("express")
const res = require("express/lib/response")
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
    const line1 = Math.floor(Math.random() * (dataset.getNumLines() - 1)) + 1
    let line2
    do
    {
        line2 = Math.floor(Math.random() * (dataset.getNumLines() - 1)) + 1
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
            response.send(comparison)
        })
    })
})

app.post("/comparison", (request, response) => {
    console.log(request.body)
    if (request.body.voteLine && typeof request.body.voteLine === "string")
    {
        console.log("That's one vote for: " + request.body.voteLine)
    }
    response.send("yep")
})

app.get("/results", (request, response) => {
    // TODO send csv file of results
    // each item in dataset with how many votes, how many flags, who voted for it (and how many times), who flagged it
    // sorted by how many votes
    // exclude data from blacklisted users
})

app.get("/users", (request, response) => {
    // TODO send csv file of users
    // each user that ever submitted anything with how many things they voted for, how many things they flagged, what they voted for (and how many times), what they flagged
    // sorted by number of votes
    // exclude data from blacklisted users
})

app.get("/dataset", (request, response) => {
    // TODO send csv file of dataset
    // the decimal line number, the base 64 line number, the item itself
})

app.listen(port, () => {
    console.log("Listening on port " + port)
})
