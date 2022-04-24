module.exports = {
    getItem,
    getNumItems,
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

function getNumItems ()
{
    return dataset.length
}

function getFileName ()
{
    return fileName
}

function getItem (itemNum)
{
    return dataset[itemNum]["__compara2r_item"]
}
