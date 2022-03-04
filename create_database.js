require("dotenv").config()

const { Client } = require("pg")
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})


client.connect()

client.query("CREATE TABLE compara2r_users (username TEXT, password_hash TEXT, last_ip TEXT, votes TEXT, flags TEXT);", (error, response) => {
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

