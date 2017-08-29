const {exec} = require('child_process');
const request = require('request');

const PROXY_URL = 'http://localhost:8080/';
const GET_IP_URL = 'http://api.ipify.org/?format=json';
const GET_IP_HTTPS_URL = 'https://api.ipify.org/?format=json';
const IP_REGEXP = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

describe('proxy', function() {
    before(function(done) {
        exec('npm start');

        setTimeout(() => {
            done();
        }, 60 * 1000);
    });

    it('it should make request over parameter', function(done) {
        request({
            url: `${PROXY_URL}?url=${encodeURIComponent(GET_IP_URL)}`,
            method: 'GET',
            followAllRedirects: true
        }, (err, response, body) => {
            if (err) {
                return done(err);
            }

            const firstRequestIpData = JSON.parse(body);

            IP_REGEXP.test(firstRequestIpData.ip).should.equal(true, `invalid ip on first request, ip was ${firstRequestIpData.ip}`);

            request({
                url: `${PROXY_URL}?url=${encodeURIComponent(GET_IP_URL)}`,
                method: 'GET',
                followAllRedirects: true
            }, (err, response, body) => {
                if (err) {
                    return done(err);
                }

                const secondRequestIpData = JSON.parse(body);

                IP_REGEXP.test(secondRequestIpData.ip).should.equal(true, `invalid ip on second request, ip was ${secondRequestIpData.ip}`);

                secondRequestIpData.ip.should.not.equal(firstRequestIpData.ip, 'ip`s are same during requests');

                done();
            });
        })
    });

    it('it should make request over proxy', function(done) {
        request({
            url: GET_IP_URL,
            method: 'GET',
            proxy: PROXY_URL,
            followAllRedirects: true
        }, (err, response, body) => {
            if (err) {
                return done(err);
            }

            const firstRequestIpData = JSON.parse(body);

            IP_REGEXP.test(firstRequestIpData.ip).should.equal(true, `invalid ip on first request, ip was ${firstRequestIpData.ip}`);

            request({
                url: GET_IP_URL,
                method: 'GET',
                proxy: PROXY_URL,
                followAllRedirects: true
            }, (err, response, body) => {
                if (err) {
                    return done(err);
                }

                const secondRequestIpData = JSON.parse(body);

                IP_REGEXP.test(secondRequestIpData.ip).should.equal(true, `invalid ip on second request, ip was ${secondRequestIpData.ip}`);

                secondRequestIpData.ip.should.not.equal(firstRequestIpData.ip, 'ip`s are same during requests');

                done();
            });
        })
    });

    it('it should make request over parameter to https', function(done) {
        request({
            url: `${PROXY_URL}?url=${encodeURIComponent(GET_IP_HTTPS_URL)}`,
            method: 'GET',
            followAllRedirects: true
        }, (err, response, body) => {
            if (err) {
                return done(err);
            }

            const ipData = JSON.parse(body);

            IP_REGEXP.test(ipData.ip).should.equal(true, `invalid ip on first request, ip was ${ipData.ip}`);

            done();
        })
    });
});