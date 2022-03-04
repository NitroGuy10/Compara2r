console.log("Hello, site.js!")

const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app);
const port = process.env.PORT || 3000

const { Server } = require("socket.io")
const io = new Server(server)

const db = require("./database.js")



app.use("/static", express.static("static"))

app.get("/", (request, response) => {
    response.sendFile(__dirname + "/pages/index.html")
})

app.get("/results", (request, response) => {
    // TODO send csv file of results
    // each item in dataset with how many votes, how many flags, who voted for it (and how many times), who flagged it
    // sorted by how many votes
})

app.get("/users", (request, response) => {
    // TODO send csv file of users
    // each user that ever submitted anything with how many things they voted for, how many things they flagged, what they voted for (and how many times), what they flagged
    // sorted by number of votes
})

app.get("/dataset", (request, response) => {
    // TODO send csv file of dataset
    // the decimal line number, the base 64 line number, the item itself
})

io.on("connection", (socket) => {
    console.log("new connection! " + socket.handshake.address)

    socket.on("comparison result", (result) => {
        // TODO
    })
})

server.listen(port, () => {
    console.log("Listening on port " + port)
})
