const fetch = require("node-fetch");
const request = require('request');

module.exports = class Api {

    constructor(options = {}) {
        const self = this;
        self.authToken = "";
        self.endpoint = 'http://localhost:8080/api/';
    }

    request(params) {

        const self = this;
        const param = new URLSearchParams();
        param.append('username', 'admin')
        param.append('password', 'admin')
        param.append('grant_type', 'password')
        param.append('client_id', 'bot-client')
        param.append('client_secret', 'f0e803fc-d56f-41d5-a6a4-02d317c81043')
        param.append('scope', 'openid')
        return fetch('http://localhost:8484/auth/realms/bot/protocol/openid-connect/token', {
            method: 'POST',
            body: param,
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        }).then(res => {
            return res.json()
        }).then(json => {
            self.authToken = json.access_token;
            let args;
            let headers = {
                "Authorization": `Bearer ${self.authToken}`,
                'Content-Type': 'application/json'
            };
            if (params.method === "POST" || params.method === "PUT") {
                if (params.multipart) {
                    args = {
                        method: params.method,
                        headers: {
                            "Authorization": `Bearer ${self.authToken}`,
                            'Content-Type': `multipart/form-data; `,
                        },
                        body: params.body,
                    };
                } else {
                    args = {
                        method: params.method,
                        headers: headers,
                        body: JSON.stringify(params.body),
                    };
                }
            } else {
                args = {
                    method: params.method,
                    headers: headers,
                };
            }
            /*
            args = {
                method:'GET',
                headers: headers,
            }*/
            // let resultUrl = 'http://localhost:8080/api/apartments/allByParams?city=Киев&type=аренда'
            let resultUrl = self.endpoint + params.url + (params.id ? "/" + params.id : '' + ((params.filters) ? "?" + new URLSearchParams(params.filters).toString() : ''));
            console.log(resultUrl)
            return fetch(resultUrl, args).then(resp => {
                // console.log('*************************************************')
                // console.log(resp)
                if (resp.status === 404) {
                    return false
                } else {
                    return resp.json()
                }
            })
        })
    }
}

