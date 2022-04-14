const express = require('express')
const axios = require('axios')
const redis = require('redis')
const responseTime = require('response-time')
const app = express();
const { promisify } = require('util')

app.use(responseTime());

const client = redis.createClient({
    legacyMode: true
})

const GET_ASYNC = promisify(client.get).bind(client)
const SET_ASYNC = promisify(client.set).bind(client)

client.connect()

app.get('/rockets', async (req, res) => {
    try {
        const reply = await GET_ASYNC('rockets')
        if (reply) {
            console.log('using cached data');
            res.send(JSON.parse(reply));
            return
        }
        const resp = await axios.get('https://api.spacexdata.com/v3/rockets')
        const saveResult = await SET_ASYNC('rockets', JSON.stringify(resp.data), 'EX', 5)
        console.log('New data cached', saveResult)
        res.send(resp.data).status(200);
    } catch (error) {
        console.log(error.message)
        res.send(error.message).status(500)
    }
})

app.get('/rockets/:rocket_id', async (req, res) => {
    const rocketId = req.params.rocket_id
    try {
        const reply = await GET_ASYNC(rocketId)
        if (reply) {
            console.log('using cached data');
            res.send(JSON.parse(reply));
            return
        }
        const resp = await axios.get(`https://api.spacexdata.com/v3/rockets/${rocketId}`)
        const saveResult = await SET_ASYNC(rocketId, JSON.stringify(resp.data), 'EX', 5)
        console.log('New data cached', saveResult)
        res.send(resp.data).status(200);
    } catch (error) {
        console.log(error.message)
        res.send(error.message).status(500)
    }
})


app.listen(3000, () => console.log("🚀 on port 3000"))