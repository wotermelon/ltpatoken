"use strict";

/**
 * LtpaToken generator and verifier
 */

let crypto = require("crypto");
let iconv = require('iconv-lite');

let ltpaSecrets;
// 默认过期时间为43200秒(12小时)
let validity = 43200;
// 过期后的这个时间内仍然有效，默认300秒(5分钟)
let gracePeriod = 300;

/***
 * 设置过期时间，秒
 * 默认为43200秒(12小时)
 * @param {number} seconds 秒
 */
function setValidity(seconds) {
    validity = seconds;
}

/***
 * 设置一个时间，当有效期过了的这段时间内仍然有效
 * 校验token的时候也会把这个时间计算进去
 * 默认为300秒()
 * @param {number} seconds 秒
 */
function setGracePeriod(seconds) {
    gracePeriod = seconds;
}

/***
 * 设置秘钥
 * @param {string} secrets 秘钥
 */
function setSecrets(secrets) {
    ltpaSecrets = secrets;
}

/***
 * Generate a userName Buffer. Currently hardcoded to CP-850, but the
 * true char encoding is LMBCS
 * @param {string} userName The username to be converted to a CP-850 buffer
 * @returns {buffer} Username encoded in CP-850 and stuffed into a Buffer
 */
function generateUserNameBuf(userName) {
    return iconv.encode(userName, "ibm850");
};

/***
 * Generate an LtpaToken suitable for writing to a cookie
 * @param {buffer} userName The username for whom the cookie is signed
 * @param {number} timeStart Timestamp (seconds) for when the token validity should start. Default: now
 * @returns {string} The LtpaToken encoded as Base64
 */
function generate(userNameBuf, secret, timeStart) {
    let start = timeStart ? timeStart : Math.floor(Date.now() / 1000);

    let timeCreation = (start - gracePeriod).toString(16);
    let timeExpiration = (start + validity + gracePeriod).toString(16);

    let size = userNameBuf.length + 40;
    let ltpaToken = new Buffer(size);

    ltpaToken.write("00010203", "hex");
    ltpaToken.write(timeCreation, 4);
    ltpaToken.write(timeExpiration, 12);
    userNameBuf.copy(ltpaToken, 20);
    let serverSecret = secret || ltpaSecrets;
    ltpaToken.write(serverSecret, size - 20, "base64");

    let hash = crypto.createHash("sha1");
    hash.update(ltpaToken);

    // Paranoid overwrite of the server secret
    ltpaToken.write("0123456789abcdefghij", size - 20, "utf-8");

    // Append the token hash
    ltpaToken.write(hash.digest("hex"), size - 20, "hex");
    return ltpaToken.toString("base64");
};

/***
 * 校验token过期时间、用户身份
 * @param {string} token
 * @param {string} secret 可选，秘钥
 * @return {object}
 */
function validate(token, secret) {
    let ltpaToken;
    ltpaToken = new Buffer(token, "base64");

    if (ltpaToken.length < 41) {
        // userName must be at least one character long
        return {
            code: -1,
            data: 'token too short'
        }
    }

    let signature = ltpaToken.toString("hex", ltpaToken.length - 20);
    let serverSecret = secret || ltpaSecrets;
    ltpaToken.write(serverSecret, ltpaToken.length - 20, "base64");

    let hash = crypto.createHash("sha1");
    hash.update(ltpaToken);

    let hexDigest = hash.digest("hex");
    if (hexDigest !== signature) {
        return {
            code: -2,
            data: 'token 签名错误'
        }
    }
    let version = ltpaToken.toString("hex", 0, 4);
    if (version !== "00010203") {
        console.log(version);
        return {
            code: -3,
            data: `${version}不正确`
        }
    }

    let timeCreation = parseInt(ltpaToken.toString("utf8", 4, 12), 16);
    let timeExpiration = parseInt(ltpaToken.toString("utf8", 12, 20), 16);
    let now = Math.floor(Date.now() / 1000);

    if (timeCreation > (now + gracePeriod)) {
        return {
            code: -4,
            data: 'token创建时间不正确'
        }
    }

    if ((timeCreation + validity) < (now - gracePeriod)) {
        return {
            code: -5,
            data: 'token时间过期'
        }
    }
    return {
        code: 0,
        data: getUserName(token)
    }
};

/***
 * Retrieve the username from the token. No validation of the token takes place
 * @param {string} token The LtpaToken string in Base64 encoded format
 * @returns {buffer} Buffer containing the encoded username
 */
function getUserNameBuf(token) {
    let ltpaToken = new Buffer(token, "base64");
    return (ltpaToken.slice(20, ltpaToken.length - 20));
};

/***
 * Retrieve the username from the token as a string. No validation of the token takes place
 * @returns {string} Username as a UTF-8 string
 */
function getUserName(token) {
    return iconv.decode(getUserNameBuf(token), "ibm850");
};

/**
 * 刷新token
 * @param {string} token
 * @param {string} secret 可选，秘钥
 * @return {string} base64的token
 */
function refresh(token, secret) {
    if (!token) {
        return
    }
    return generateToken(getUserNameBuf(token), secret);
}
/**
 * 生成一个token
 * @param {string} user 用户标识
 * @param {string} secret 可选，秘钥
 * @param {number} timeStart token的开始时间，默认为now
 * @return {string} base64的token
 */
function generateToken(user, secret, timeStart) {
    if (!user) {
        return;
    }
    return generate(generateUserNameBuf(user), secret, timeStart);
}


let ltpa = module.exports;

ltpa.refresh = refresh;
ltpa.generate = generateToken;
ltpa.validate = validate;
ltpa.init = function (options) {
    setValidity(options.validity || validity);
    setGracePeriod(options.gracePeriod || gracePeriod);
    setSecrets(options.secret);
}
