require("dotenv").config()

const { Client } = require("pg")
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})


client.connect()

client.query("DROP TABLE compara2r_users;", (error, response) => {
    if (error)
    {
        console.log(error.stack)
    }
    else
    {
        console.log("Table deleted!")
    }
    client.end()
})

