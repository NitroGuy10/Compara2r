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
    const itemNum1 = Math.floor(Math.random() * (dataset.getNumItems()))
    let itemNum2
    do
    {
        itemNum2 = Math.floor(Math.random() * (dataset.getNumItems()))
    }
    while (itemNum2 == itemNum1)

    const comparison = {
        itemNum1: itemNum1,
        text1: dataset.getItem(itemNum1),
        itemNum2: itemNum2,
        text2: dataset.getItem(itemNum2)
    }
    
    db.storePrompt(db.makeHash(request.ip), [itemNum1, itemNum2])
    response.send(comparison)

})

app.post("/comparison", (request, response) => {
    if (request.body.voteItemNum && typeof request.body.voteItemNum === "number" &&
        request.body.passUpItemNum && typeof request.body.passUpItemNum === "number" &&
        request.body.isFlag != undefined && typeof request.body.isFlag === "boolean" &&
        request.body.voteItemNum > 0 && request.body.voteItemNum <= dataset.getNumItems() &&
        request.body.passUpItemNum > 0 && request.body.passUpItemNum <= dataset.getNumItems())
    {
        db.vote(db.makeHash(request.ip), request.body)
    }

    response.send({ })
})

app.get("/votes/" + process.env.ADMIN_PASSWORD, (request, response) => {
    db.exportJSON((rows) => {
        response.attachment()
        response.type("json")
        response.send(JSON.stringify(rows))
    })
})

app.get("/dataset/" + process.env.ADMIN_PASSWORD, (request, response) => {
    response.download(__dirname + dataset.getFileName())
})

app.get("/blacklist/:ip_hash/" + process.env.ADMIN_PASSWORD, (request, response) => {
    db.blacklist(request.params["ip_hash"], (success) => {
        response.send("<p>Success: " + success + "</p>")
    })
})

app.listen(port, () => {
    console.log("Listening on port " + port)
})
