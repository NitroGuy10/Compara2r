module.exports = {
    getLine,
    getNumLines
}

const fs = require("fs")
const readline = require("readline")

const fileName = "/dataset/data.txt"

let numLines
findNumLines()

function findNumLines ()
{
    let interface = readline.createInterface({
        input: fs.createReadStream(__dirname + fileName)
    })

    numLines = 0

    interface.on("line", (line) => {
        if (line !== "")
        {
            numLines++
        }
    })    
}

function getNumLines ()
{
    return numLines
}

function getLine (lineNumber, callback)
{
    // Lines should be JSON strings (surrounded by quotation marks with necessary characters escaped)
    let interface = readline.createInterface({
        input: fs.createReadStream(__dirname + fileName)
    })

    let linesElapsed = 0

    interface.on("line", (line) => {
        linesElapsed++
        if (linesElapsed == lineNumber)
        {
            callback(JSON.parse(line))
            interface.close()
        }
    })
}
