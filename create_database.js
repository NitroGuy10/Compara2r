require("dotenv").config()

const { Client } = require("pg")
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})


client.connect()

client.query("CREATE TABLE compara2r_users (ip_hash TEXT, blacklisted BOOLEAN, votes TEXT, flags TEXT);", (error, response) => {
    if (error)
    {
        console.log(error.stack)
    }
    else
    {
        console.log("Table created!")
    }
    client.end()
})

