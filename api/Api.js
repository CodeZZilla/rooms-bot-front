const fetch = require("node-fetch");
const request = require('request');

module.exports = class Api {

    constructor(options = {}) {
        const self = this;
        self.authToken = "";
        self.endpoint = 'https://api.roomsua.me/';
    }

    request(params) {
        const self = this;
        const param = new URLSearchParams();
        param.append('username', 'admin')
        param.append('password', 'admin')
        param.append('grant_type', 'password')
        param.append('client_id', 'bot-client')
        param.append('client_secret', '041f5096-a129-4e4b-a3fd-d7da61fa36fc')
        param.append('scope', 'openid')
        return fetch('http://localhost:8484/auth/realms/bot/protocol/openid-connect/token', {
            method: 'POST',
            body: param,
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        }).then(res => {
            return res.json()
        }).then(json => {
            console.log(json)
        })
    }
}

