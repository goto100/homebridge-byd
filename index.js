var Service, Characteristic;
var request = require('request');

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory('homebridge-byd', 'BYDAC', ACAccessory);
}

function ACAccessory(log, config) {
	this.log = log;
	this.name = config['name'];
	this.data = config['data'].replace(/\//ig, '\\/');
	this.lastOnTime = null;
}

ACAccessory.prototype = {
	request: function(data, callback) {
		request({
			url: 'https://webappservice.bydauto.com.cn:5011/mobileserve/Rc/remoteControl',
			headers: {
				'Cookie': 'JSESSIONID=D7375ED5029BF4DF598B0009F1F924B4',
				'Accept':	'*/*',
				'User-Agent':	'BYDi/3.1.0 (iPhone; iOS 10.2.1; Scale/2.00)',
				'Accept-Language':	'zh-Hans-CN;q=1',
			},
			json: {
				Data: data,
			},
			method: 'POST',
		}, callback);
	},

	setPowerState: function(powerOn, callback) {
		if (powerOn) {
			this.log('Setting power state to on');
			this.request(this.data, function(error, response, responseBody) {
				if (error) {
					this.log('HTTP set power function failed: %s', error.message);
					callback(error);
				} else {
					this.lastOnTime = new Date();
					this.log('HTTP set power function succeeded!');
					callback();
				}
			}.bind(this));
		} else {
			// do nothing
			this.log('Setting power state to off');
			this.log('HTTP set power function succeeded!');
			this.lastOnTime = null;
			callback();
		}
	},

	getPowerState: function(callback) {
		// 小于 10 分钟，开着，否则关着
		callback(null, this.lastOnTime && (new Date() - this.lastOnTime < 10 * 60 * 1000));
	},

	identify: function(callback) {
		this.log("Identify requested!");
		callback(); // success
	},

	getServices: function() {
		var informationService = new Service.AccessoryInformation();
		informationService
		.setCharacteristic(Characteristic.Manufacturer, "BYD")
		.setCharacteristic(Characteristic.Model, "秦EV")
		.setCharacteristic(Characteristic.SerialNumber, "300");

		this.switchService = new Service.Switch(this.name);
		this.switchService
		.getCharacteristic(Characteristic.On)
		.on('get', this.getPowerState.bind(this))
		.on('set', this.setPowerState.bind(this));

		return [this.switchService];
	}
};
