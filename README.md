# ltpa

> A small library for generating and validating ltpa tokens. Based on the 
[IBM specification](http://www-12.lotus.com/ldd/doc/tools/c/7.0/api70ug.nsf/85255d56004d2bfd85255b1800631684/ceda2cb8df47607f85256c3d005f816d).

> refer to [markusberg/ltpa](https://github.com/markusberg/ltpa/)


## 安装
`npm install ltpa-token --save`

## 初始化
```javascript
var ltpa = require('ltpa-token')

ltpa.init({
  secret: ,
  validity: ,
  gracePeriod: 
})
```

### options
- `secret`：秘钥。string
- `validity`：过期时间，单位秒。默认为43200秒(12小时)。number
- `gracePeriod`：设置一个时间，当有效期过了的这段时间内仍然有效，单位秒。默认为300秒(5分钟)。number


## api

### generate
```javascript
/**
 * 生成token
 */
var result = ltpa.generate(userName[, secret, timeStart])
```

- `userName`：存储到token的用户信息。string
- `secret`：可选，不加将使用初始化设置的secret.使用secret作为密钥生成token。string
- `timeStart`：可选，token的开始时间，默认为now。number

### validate
```javascript
/**
 * 校验token
 * {
 *   code: 0,   // 0正常
 *   data: user   // user信息
 * }
 */
var result = ltpa.validate(token[, secret])
```

- `token`：token字符串。string
- `secret`：可选，不加将使用初始化设置的secret.使用secret作为密钥校验。string

### refresh
```javascript

/**
 * 刷新token
 * 返回base64 token
 */
var token = ltpa.refresh(user[, secret])
```

- `user`：user信息
- `secret`：可选，不加将使用初始化设置的secret.使用secret作为密钥生成token。string
