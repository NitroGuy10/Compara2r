// Store the following in database

// ip hash (for deleting bad actors), is blacklisted, votes (line numbers of things the user voted as better), pass ups (line numbers of things the user passed up on), flags (line numbers of things the user flagged)

module.exports = {
    vote
}

const { Pool } = require("pg")
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

const { createHash } = require("crypto")

function vote (ipAddress, data)
{
    // A user can vote for something more than once
    // A user CANNOT flag something more than once

    const hash = createHash("sha256")
    hash.update(ipAddress)
    ipAddress = hash.digest("hex")

    pool.query("SELECT * FROM compara2r_users WHERE ip_hash=$1;", [ipAddress], (error, response) => {
        if (error)
        {
            console.log(error.stack)
            return
        }
        else
        {
            if (response.rows.length == 0)
            {
                if (data.isFlag)
                {
                    pool.query("INSERT INTO compara2r_users VALUES ($1, FALSE, $2, $3, $4);", [ipAddress, [], [], [data.voteLine]], (error1, response1) => {
                        if (error1) { console.log(error1.stack) }
                    })
                }
                else
                {
                    pool.query("INSERT INTO compara2r_users VALUES ($1, FALSE, $2, $3, $4);", [ipAddress, [data.voteLine], [data.passUpLine], []], (error1, response1) => {
                        if (error1) { console.log(error1.stack) }
                    })
                }
            }
            else
            {
                if (!response.rows[0].blacklisted)
                {
                    if (response.rows[0].votes.length != response.rows[0].passups.length)
                    {
                        console.log("user " + ipAddress + " has a different number of votes and passups!")

                        console.log("user " + ipAddress + " blacklisted")
                        pool.query("UPDATE compara2r_users SET blacklisted=TRUE WHERE ip_hash=$1;", [ipAddress], (error1, response1) => {
                            if (error1) { console.log(error1.stack) }
                        })
                        return
                    }

                    const newElementIndex = response.rows[0].votes.length + 1
                    const newFlagIndex = response.rows[0].flags.length + 1

                    if (data.isFlag)
                    {
                        pool.query("UPDATE compara2r_users SET flags["+ newFlagIndex +"]=$1 WHERE ip_hash=$2;", [data.voteLine, ipAddress], (error1, response1) => {
                            if (error1) { console.log(error1.stack) }
                        })
                    }
                    else
                    {
                        pool.query("UPDATE compara2r_users SET votes["+ newElementIndex +"]=$1, passups["+ newElementIndex +"]=$2 WHERE ip_hash=$3;", [data.voteLine, data.passUpLine, ipAddress], (error1, response1) => {
                            if (error1) { console.log(error1.stack) }
                        })
                    }
                }
            }
        }
    })
    

}
