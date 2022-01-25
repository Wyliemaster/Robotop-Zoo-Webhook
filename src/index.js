const axios = require('axios');
const config = require('../data.json')

class GDRequests {
    constructor(id, token)
    {
        this.id = id;
        this.token = token;
        this.last_ping = { timestamp: 0, cooldown_ended: true };
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
        return "kENoAPIKey"
    }

    async check_info()
    {
        console.log(`[${Date.now()}] Checking Secret Info`)
        let message = ''
        let err = null
        let data = await this.fetch_secret_info() || "kESecretInfoFailed"


        if(typeof data === 'string' || data instanceof String) return data;

        let time = Date.now()
        if(data.rescueCooldown < time) message += "A new rescue is available\n"
        if(data.questEnd < time) message += "A quest has finished\n"

        if(message != '' && this.last_ping.cooldown_ended){
            message += `<@!${config.zoo.id}>`
            err = await this.send_webhook(message) || null
        }
        return err
    }

    async send_webhook(content)
    {
        let req = await axios.post(config.discord.webhook_URL, {
            "content": content
        }, {
            "content-type": "application/json"
        });
        this.last_ping.timestamp = Date.now();
        this.last_ping.cooldown_ended = false;
        return req.status == 204 ? null : "kEWebhookFailed"
    }
}

let req = new GDRequests(config.zoo.id, config.zoo.token)

console.log(`[${Date.now()}] Starting Loop`)

const interval = setInterval(async function() { 
    // Makes sure you don't get spam pinged every 10 minutes
    if(Date.now() - req.last_ping.timestamp > 3600000) req.last_ping.cooldown_ended = true

    let err = await req.check_info() 
    switch(err)
    {
        case "kENoAPIKey":
            console.log("[ROBOTOP ERROR] API Key Relic not equipped");
            break;
        case "kESecretInfoFailed":
            console.log("[ROBOTOP ERROR] Request Failed - make sure the contents of data.json are correct");
            break;
        case "kEWebhookFailed":
            console.log("[DISCORD ERROR] Unable to send webhook");
            break;
    }

    if(err) clearInterval(interval);
}, 300000);
