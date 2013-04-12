var sha1 = require('sha1'),
	events = require('events'),
	emitter = new events.EventEmitter(),
	xml2js = require('xml2js');
	
// 微信类
var Weixin = function() {
	
}

// 验证
Weixin.prototype.checkSignature = function(req) {    		
	
	// 获取校验参数
	this.signatures = req.query.signature,
	this.timestamp = req.query.timestamp,
	this.nonce = req.query.nonce,
	this.echostr = req.query.echostr;
	
	// 按照字典排序
	var array = [this.token, this.timestamp, this.nonce];
	array.sort();
	
	// 连接
	var str = sha1(array.join(""));
	
	// 对比签名
	if(str == this.signature) {
		return true;
	} else {
		return false;
	}
}

// 消息类型
Weixin.prototype.getMsgType = function(data) {
	return data.MsgType[0] ? data.MsgType[0] : "";
}

// ------------------ 监听 ------------------------
// 监听文本消息
Weixin.prototype.textMsg = function(callback) {
	
	emitter.on("weixinTextMsg", callback);
	
	return this;
}

// ----------------- 消息处理 -----------------------
/*
 * ToUserName	开发者微信号
 * FromUserName	 发送方帐号（一个OpenID）
 * CreateTime	 消息创建时间 （整型）
 * MsgType	 text
 * Content	 文本消息内容
 * MsgId	 消息id，64位整型
 */
Weixin.prototype.parseTextMsg = function(data, res) {
	var msg = {
		"toUserName" : data.ToUserName[0],
		"fromUserName" : data.FromUserName[0],
		"createTime" : data.CreateTime[0],
		"msgType" : data.MsgType[0],
		"content" : data.Content[0],
		"msgId" : data.MsgId[0],
	}
	
	emitter.emit("weixinTextMsg", msg, res);
	
	return this;
}

// ------------------- 返回 -------------------------
// 返回文字信息
Weixin.prototype.sendTextMsg = function(data) {
	
	var output = "" + 
	"<xml>" + 
		 "<ToUserName><![CDATA[" + data.toUserName + "]]></ToUserName>" + 
		 "<FromUserName><![CDATA[" + data.fromUserName + "]]></FromUserName>" + 
		 "<CreateTime>" + data.createTime + "</CreateTime>" + 
		 "<MsgType><![CDATA[" + data.msgType + "]]></MsgType>" + 
		 "<Content><![CDATA[" + data.content + "]]></Content>" + 
		 "<FuncFlag>" + data.funcFlag + "</FuncFlag>" + 
	"</xml>";
	
	this.res.type('xml'); 
	this.res.send(output);
	
	//console.log(output);
	return this;
}

 
// ------------ 图文消息 ----------------

// ------------ 主逻辑 -----------------

// Loop
Weixin.prototype.loop = function(req, res) {	
	// 保存res
	this.res = res;
	
	var self = this;
	
    // 获取XML内容
    var buf = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { 
		buf += chunk;
	});
    req.on('end', function() {
		xml2js.parseString(buf, function(err, json) {
			if (err) {
                err.status = 400;
            } else {
                req.body = json;
            }
        });
		
		//console.log(req.body);
		var data = req.body.xml;
		if (self.getMsgType(data) == "text") {
			self.parseTextMsg(data, res);
		}
    });
}

// 发送信息
Weixin.prototype.sendMsg = function(data, msgType) {
	if (msgType == "text") {
		this.sendTextMsg(data);		
	}
}

module.exports = new Weixin();