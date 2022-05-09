// Store the following in database

// ip hash (for deleting bad actors),
// is blacklisted,
// votes (item numbers of things the user voted as better)
// pass ups (item numbers of things the user passed up on)
// flags (item numbers of things the user flagged)
// latest prompt (two item numbers that were sent to the user in their last comparison GET)
// latest vote (two item numbers that were voted upon by the user in their last comparison POST)

module.exports = {
    vote,
    storePrompt,
    makeHash,
    exportJSON,
    blacklist
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

    getUser(ipAddress, (user, isBlacklisted) => {
        if (user == null)
        {
            // The server could get to this point for two reasons
            // 1) The database was reset and a user already had a Compara2r tab open and then voted
            // 2) A bad actor POSTs a vote before ever GETing a comparison (this shouldn't cause any disruption, though)
            // In my opinion, this isn't cause for blacklisting
        }
        else
        {
            if (!isBlacklisted)
            {
                if (user.votes.length != user.passups.length)  // I don't even think this should be possible
                {
                    console.log("user " + ipAddress + " has a different number of votes and passups!")
                    blacklist(ipAddress)
                }
                else
                {
                    if ((user.latest_prompt[0] == data.voteItemNum && user.latest_prompt[1] == data.passUpItemNum ||
                         user.latest_prompt[1] == data.voteItemNum && user.latest_prompt[0] == data.passUpItemNum))  // <--- i.e. the vote the user is casting matches the latest prompt they were given
                    {
                        if (data.isFlag)  // Flagging doesn't require the user to have not voted on their current prompt (since 1. they can flag both items and 2. multiple flags for the same item are treated as one flag)
                        {
                            const newFlagIndex = user.flags.length + 1
                            pool.query("UPDATE compara2r_users SET flags["+ newFlagIndex +"]=$1, latest_vote=$2 WHERE ip_hash=$3;", [data.voteItemNum, user.latest_prompt, ipAddress], (error, response) => {
                                if (error) { console.error(error.stack) }
                            })
                        }
                        else if ((user.latest_vote.length == 0 ||
                                 user.latest_prompt[0] != user.latest_vote[0] && user.latest_prompt[0] != user.latest_vote[0]))  // <--- i.e. the user has not already voted for this prompt
                        {
                            // Actually cast the vote
                            const newElementIndex = user.votes.length + 1
                            pool.query("UPDATE compara2r_users SET votes["+ newElementIndex +"]=$1, passups["+ newElementIndex +"]=$2, latest_vote=$3 WHERE ip_hash=$4;", [data.voteItemNum, data.passUpItemNum, user.latest_prompt, ipAddress], (error, response) => {
                                if (error) { console.error(error.stack) }
                            })
                        }
                        else
                        {
                            // The user has already voted for this prompt and is trying to vote again
                            // In this case, do nothing
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

function exportJSON (callback)
{
    pool.query("SELECT * from compara2r_users;", (error, response) => {
        if (error)
        {
            console.error(error.stack)
        }
        callback(response.rows)
    })
}

////////////////////// Intermediary functions //////////////////////

function blacklist (ipAddress, callback)
{
    // Creates a dummy user entry with the same ip address that is blacklisted
    // If the user now tries to do anything, the dummy user entry will be detected and their action will be ignored
    console.log("user " + ipAddress + " blacklisted")
    createUser([ipAddress, true, [], [], [], [], []], (response, success) => {
        callback(success)
    })
}

function createUser (values, callback)
{
    userExists(values[0], (exists, isBlacklisted) => {
        let success = true
        if (exists && isBlacklisted)
        {
            console.warn("user " + values[0] + " already exists! they're even blacklisted! why are you trying to create them?")
            if (callback)
            {
                success = false
                callback(null, success)
            }
        }
        else if (exists && values[1] == false)  // If the user exists and the new user is not supposed to be blacklisted
        {
            console.warn("user " + values[0] + " already exists! why are you trying to create them?")
            if (callback)
            {
                success = false
                callback(null, success)
            }
        }
        else
        {
            pool.query("INSERT INTO compara2r_users VALUES ($1, $2, $3, $4, $5, $6, $7);", values, (error, response) => {
                if (error)
                {
                    console.error(error.stack)
                    success = false
                }
                if (callback)
                {
                    callback(response, success)
                }
            })
        }
    })
}

function getUser (ipAddress, callback)
{
    let isBlacklisted = false
    pool.query("SELECT * FROM compara2r_users WHERE ip_hash=$1;", [ipAddress], (error, response) => {
        if (error)
        {
            console.error(error.stack)
        }
        if (response.rows.length === 0)
        {
            callback(null, isBlacklisted)
        }
        else
        {
            if (response.rows.length > 1)
            {
                // See if one of the duplicate rows is blacklisted
                for (let row of response.rows)
                {
                    if (row.blacklisted)
                    {
                        isBlacklisted = true
                        break
                    }
                }

                if (!isBlacklisted)
                {
                    console.warn("user " + ipAddress + " appeared more than once in the database... all of their entries will be deleted")
                    pool.query("DELETE FROM compara2r_users WHERE ip_hash=$1", [ipAddress], (error, response) => {
                        if (error)
                        {
                            console.error(error.stack)
                            callback(null, isBlacklisted)
                            return
                        }
                    })
                }
            }
            callback(response.rows[0], isBlacklisted)
        } 
    })
}

function userExists (ipAddress, callback)
{
    getUser(ipAddress, (user, isBlacklisted) => {
        callback(user != null, isBlacklisted)
    })
}

function makeHash (string)
{
    // I do not believe it is necessary to hash users' ip addresses
    // There is no personally identifiable information stored in association with them
    return string
}
