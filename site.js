console.log("Hello, site.js!")

const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app);
const port = process.env.PORT || 3000

const { Server } = require("socket.io")
const io = new Server(server)

app.use("/static", express.static("static"))

app.get("/", (request, response) => {
    response.sendFile(__dirname + "/pages/index.html")
})

io.on("connection", (socket) => {
    console.log("new connection!")

    socket.on("login", (credentials) => {
        console.log("login: " + credentials.username + " " + credentials.password)
    })
})

server.listen(port, () => {
    console.log("Listening on port " + port)
})
