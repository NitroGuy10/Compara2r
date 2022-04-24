module.exports = {
    getLine,
    getNumLines,
    getFileName
}

const fs = require("fs")

const fileName = "/dataset/dataset.json"

let dataset


fs.readFile(__dirname + fileName, "utf-8" , (error, data) => {
    if (error)
    {
      console.error(error)
      return
    }
    dataset = JSON.parse(data)
  })

function getNumLines ()
{
    return dataset.length
}

function getFileName ()
{
    return fileName
}

function getLine (lineNumber)
{
    return dataset[lineNumber]["__compara2r_item"]
}
