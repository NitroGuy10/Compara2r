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

    const comparison = {
        line1: line1,
        text1: dataset.getLine(line1),
        line2: line2,
        text2: dataset.getLine(line2)
    }
    
    db.storePrompt(db.makeHash(request.ip), [line1, line2])
    response.send(comparison)

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
    db.exportJSON((rows) => {
        response.attachment()
        response.type("json")
        response.send(JSON.stringify(rows))
    })
})

app.get("/dataset/" + process.env.ADMIN_PASSWORD, (request, response) => {
    response.download(__dirname + dataset.getFileName())
})

app.listen(port, () => {
    console.log("Listening on port " + port)
})
