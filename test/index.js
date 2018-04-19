'use strict';

let expect = require('chai').expect;
let ltpa = require('../index');
ltpa.init({
    secret: 'mNtaFW29Ib29F/Gy2Q1e3sNKs4Q='
})

let userName = "xiaowo";

describe('#ltpa', function() {
    it('生成一个token', function() {
        let result = ltpa.generate(userName);
        expect(result).to.be.a('string');
    });

    it('生成一个token，并校验', function() {
        let token = ltpa.generate(userName);
        let result = ltpa.validate(token);
        expect(result).to.be.a('object');
        expect(result).to.have.property('code');
        expect(result).to.have.property('data');
        expect(result.code).to.be.a('number');
        expect(result.data).to.be.a('string');
    });
    it('从token获取用户名', function() {
        let token = ltpa.generate(userName);
        let result = ltpa.validate(token);
        expect(result.code).to.equal(0);
        expect(result.data).to.equal(userName);
    });
    it('刷新token', function() {
        let token = ltpa.generate(userName);
        let result = ltpa.refresh(token);
        expect(result).to.be.a('string');
    });
    it('没有token不能刷新token', function() {
        let result = ltpa.refresh();
        expect(result).to.equal(undefined)
    });
    it('token太短，不能通过校验，返回-1', function() {
        var result = ltpa.validate('xxxxx');
        expect(result.code).to.equal(-1)
    });
    it('过期的token不能通过校验，返回-5', function() {
        var now = +new Date()
        let token = ltpa.generate(userName, '', now + 45000);
        var result = ltpa.validate(token);
        expect(result.code).to.equal(-5)
    });
    it('缺少用户名不能生成token', function() {
        let token = ltpa.generate();
        expect(token).to.equal(undefined)
    });
});