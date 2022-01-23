const axios = require('axios');
const config = require('../data.json')

class GDRequests {
    constructor(id, token)
    {
        this.id = id;
        this.token = token;
    }

    async get_request(endpoint, params, headers)
    {
        return await axios.get(endpoint, new URLSearchParams(params), headers)
    }

    async fetch_secret_info()
    {
        let response = await this.get_request(`https://robotop.xyz/api/zoo/${this.id}`, {}, {cookie: this.token})
        if(response.data.equippedRelic == "API Key")
            return response.data.secretInfo
        return "kERR_NOAPIKEY"
    }

    async check_info()
    {
        console.log(`[${Date.now()}] Checking Secret Info`)
        let message = ''
        let data = await this.fetch_secret_info() || "kERR_FAILEDREQUEST"


        if(typeof data === 'string' || data instanceof String) return data;

        let time = Date.now()
        if(data.rescueCooldown < time) message += "A new rescue is available\n"
        if(data.questEnd < time) message += "A quest has finished\n"

        if(message != ''){
            message += `<@!${config.zoo.id}>`
            await this.send_webhook(message)
        }
        return null
    }

    async send_webhook(content)
    {
        axios.post(config.discord.webhook_URL, {
            "content": content
        }, {
            "content-type": "application/json"
        });
    }
}


let req = new GDRequests(config.zoo.id, config.zoo.token)
console.log(`[${Date.now()}] Starting Loop`)
const interval = setInterval(async function() { 
    let err = await req.check_info() 
    switch(err)
    {
        case "kERR_NOAPIKEY":
            console.log("[ROBOTOP ERROR] API Key Relic not equipeped")
            break;
        case "kERR_FAILEDREQUEST":
            console.log("[ROBOTOP ERROR] Request Failed - make sure the contents of data.json are correct")
            break
    }

    if(err) clearInterval(interval);
}, 600000)






