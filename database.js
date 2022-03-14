// Store the following in database

// ip hash (for deleting bad actors),
// is blacklisted,
// votes (line numbers of things the user voted as better)
// pass ups (line numbers of things the user passed up on)
// flags (line numbers of things the user flagged)
// latest prompt (two line numbers that were sent to the user in their last comparison GET)

module.exports = {
    vote,
    storePrompt,
    makeHash
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

    getUser(ipAddress, (user) => {
        if (user == null)
        {
            console.log("user " + ipAddress + " voted without ever being prompted!")
            blacklist(ipAddress)
        }
        else
        {
            if (!user.blacklisted)
            {
                if (user.votes.length != user.passups.length)  // I don't even think this should be possible
                {
                    console.log("user " + ipAddress + " has a different number of votes and passups!")
                    blacklist(ipAddress)
                }
                else
                {
                    if (user.latest_prompt[0] == data.voteLine && user.latest_prompt[1] == data.passUpLine ||
                        user.latest_prompt[1] == data.voteLine && user.latest_prompt[0] == data.passUpLine)  // i.e. the vote the user is casting matches the latest prompt they were given
                    {
                        // Actually cast the vote
                        const newElementIndex = user.votes.length + 1
                        const newFlagIndex = user.flags.length + 1
        
                        if (data.isFlag)
                        {
                            pool.query("UPDATE compara2r_users SET flags["+ newFlagIndex +"]=$1 WHERE ip_hash=$2;", [data.voteLine, ipAddress], (error, response) => {
                                if (error) { console.log(error.stack) }
                            })
                        }
                        else
                        {
                            pool.query("UPDATE compara2r_users SET votes["+ newElementIndex +"]=$1, passups["+ newElementIndex +"]=$2 WHERE ip_hash=$3;", [data.voteLine, data.passUpLine, ipAddress], (error, response) => {
                                if (error) { console.log(error.stack) }
                            })
                        }
                    }
                    else
                    {
                        // If the vote cast does not match lastest prompt, it is not cause for blacklisting
                        // For example, the user may have opened a second Compara2r tab (thus updating latest_prompt) and then returned to the first Compara2r tab to cast their vote
                        // In this case, the vote will simply not be cast
                    }
                }
            }
        }
    })
}

function storePrompt (ipAddress, prompt)
{
    userExists(ipAddress, (exists) => {
        if (exists)
        {
            pool.query("UPDATE compara2r_users SET latest_prompt=$2 WHERE ip_hash=$1;", [ipAddress, prompt], (error, response) => {
                if (error)
                {
                    console.log(error.stack)
                }
            })
        }
        else
        {
            createUser([ipAddress, false, [], [], [], prompt])
        }
    })
}

////////////////////// Intermediary functions //////////////////////

function blacklist (ipAddress, callback)
{
    userExists(ipAddress, (exists) => {
        if (exists)
        {
            pool.query("UPDATE compara2r_users SET blacklisted=TRUE WHERE ip_hash=$1;", [ipAddress], (error, response) => {
                if (error1)
                {
                    console.log(error1.stack)
                }
                else
                {
                    console.log("user " + ipAddress + " blacklisted")
                    if (callback)
                    {
                        callback()
                    }
                }
            })
        }
        else
        {
            createUser([ipAddress, true, [], [], [], []])
        }
    })
}

function createUser (values, callback)
{
    userExists(values[0], (exists) => {
        if (exists)
        {
            console.log("user " + values[0] + " already exists! why are you trying to create them?")
        }
        else
        {
            pool.query("INSERT INTO compara2r_users VALUES ($1, $2, $3, $4, $5, $6);", values, (error, response) => {
                if (error)
                {
                    console.log(error.stack)
                }
                if (callback)
                {
                    callback(response)
                }
            })
        }
    })
}

function getUser (ipAddress, callback)
{
    pool.query("SELECT * FROM compara2r_users WHERE ip_hash=$1;", [ipAddress], (error, response) => {
        if (error)
        {
            console.log(error.stack)
        }
        if (response.rows.length === 0)
        {
            callback(null)
        }
        else
        {
            callback(response.rows[0])
        } 
    })
}

function userExists (ipAddress, callback)
{
    getUser(ipAddress, (user) => {
        callback(user != null)
    })
}

function makeHash (string)
{
    const hash = createHash("sha256")
    hash.update(string)
    return hash.digest("hex")
}
