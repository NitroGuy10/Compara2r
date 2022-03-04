// Store the following in database

// ip hash (for deleting bad actors), votes (comma separated line numbers (in base64) of things the user voted as better) and how many times for that thing (if more than once) example: "<line 120>x4, <line 12>, <line 168>", flags (comma separated line numbers (in base64) of things the user flagged)

module.exports = {
    vote,
    flag
}

const { Pool } = require("pg")
const pool = new Pool()

function vote (ipAddress, callback)
{
    // A user can vote for something more than once
    callback()
}

function flag (ipAddress, callback)
{
    // A user CANNOT flag something more than once
    callback()
}

// TODO table of blacklisted ip_hashes
