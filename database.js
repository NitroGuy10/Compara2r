// Store the following in database

// ip hash (for deleting bad actors),
// is blacklisted,
// votes (line numbers of things the user voted as better)
// pass ups (line numbers of things the user passed up on)
// flags (line numbers of things the user flagged)
// latest prompt (two line numbers that were sent to the user in their last comparison GET)
// latest vote (two line numbers that were voted upon by the user in their last comparison POST)

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
const { contentDisposition } = require("express/lib/utils")

function vote (ipAddress, data)
{
    // A user can vote for something more than once
    // A user CANNOT flag something more than once

    getUser(ipAddress, (user) => {
        if (user == null)
        {
            // The server could get to this point for two reasons
            // 1) The database was reset and a user already had a Compara2r tab open and then voted
            // 2) A bad actor POSTs a vote before ever GETing a comparison (this shouldn't cause any disruption, though)
            // In my opinion, this isn't cause for blacklisting
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
                    if ((user.latest_prompt[0] == data.voteLine && user.latest_prompt[1] == data.passUpLine ||
                        user.latest_prompt[1] == data.voteLine && user.latest_prompt[0] == data.passUpLine) &&  // <--- i.e. the vote the user is casting matches the latest prompt they were given
                        (user.latest_vote.length == 0 ||
                        user.latest_prompt[0] != user.latest_vote[0] && user.latest_prompt[0] != user.latest_vote[0]))    // <--- i.e. the user has not already voted for this prompt
                    {
                        // Actually cast the vote
                        const newElementIndex = user.votes.length + 1
                        const newFlagIndex = user.flags.length + 1
        
                        if (data.isFlag)
                        {
                            pool.query("UPDATE compara2r_users SET flags["+ newFlagIndex +"]=$1, latest_vote=$2 WHERE ip_hash=$3;", [data.voteLine, user.latest_prompt, ipAddress], (error, response) => {
                                if (error) { console.error(error.stack) }
                            })
                        }
                        else
                        {
                            pool.query("UPDATE compara2r_users SET votes["+ newElementIndex +"]=$1, passups["+ newElementIndex +"]=$2, latest_vote=$3 WHERE ip_hash=$4;", [data.voteLine, data.passUpLine, user.latest_prompt, ipAddress], (error, response) => {
                                if (error) { console.error(error.stack) }
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
                    console.error(error.stack)
                }
            })
        }
        else
        {
            createUser([ipAddress, false, [], [], [], prompt, []])
        }
    })
}

////////////////////// Intermediary functions //////////////////////

function blacklist (ipAddress, callback)
{
    // Creates a dummy user entry that is blacklisted
    // If the user doesn't exist yet (i.e. they happen to become blacklisted before their comparison GET), then everything's fine
    // If the user does exist, the dummy user entry will be detected when the user tries to do anything and the server will attempt to compact the user and any blacklist-dummies into one row (their data will be deleted as an added bonus (or side effect))
    // Of course, this creates the possibility that a user could become blacklisted, never make a request again, and the dummy user persists
    // TODO As such, I would need to account for this when exporting the database, most likely by checking each ip_hash in the table to ensure it only occurs once
    console.log("user " + ipAddress + " blacklisted")
    createUser([ipAddress, true, [], [], [], [], []])
}

function createUser (values, callback)
{
    userExists(values[0], (exists) => {
        if (exists)
        {
            console.warn("user " + values[0] + " already exists! why are you trying to create them?")
        }
        else
        {
            pool.query("INSERT INTO compara2r_users VALUES ($1, $2, $3, $4, $5, $6, $7);", values, (error, response) => {
                if (error)
                {
                    console.error(error.stack)
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
            console.error(error.stack)
        }
        if (response.rows.length === 0)
        {
            callback(null)
        }
        else
        {
            if (response.rows.length > 1)
            {
                // See if one of the duplicate rows is blacklisted
                let isBlacklisted = false
                for (let row of response.rows)
                {
                    if (row.blacklisted)
                    {
                        isBlacklisted = true
                        break
                    }
                }

                if (isBlacklisted)
                {
                    // Compact any blacklist-dummies into one blacklisted user
                    pool.query("DELETE FROM compara2r_users WHERE ip_hash=$1", [ipAddress], (error, response) => {
                        if (error)
                        {
                            console.error(error.stack)
                        }
                        blacklist(ipAddress)
                    })
                }
                else
                {
                    console.error("user " + ipAddress + " appears more than once in the database!")
                }
            }
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
    /*
    const hash = createHash("sha256")
    hash.update(string)
    return hash.digest("hex")
    */
   return string
}
