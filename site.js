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

io.on("connection", (socket) => {
    console.log("new connection! " + socket.handshake.address)

    socket.on("login", (credentials) => {
        if (credentials.username && credentials.password)
        {
            console.log("login: " + credentials.username + " " + credentials.password)

            db.login(credentials, socket.handshake.address, (loginStatus, message) => {
                console.log(loginStatus + ": " + message)
                socket.emit(loginStatus, message)
            })
        }
        else
        {
            socket.emit("login failure", "Invalid login payload")
        }
    })
})

server.listen(port, () => {
    console.log("Listening on port " + port)
})
