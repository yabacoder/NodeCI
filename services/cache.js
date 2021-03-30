const mongoose = require("mongoose");
const redis = require("redis");
const keys = require("../config/keys");
// const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(keys.redisUrl);

const util = require("util");
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
	this.useCache = true;
	this.hashKey = JSON.stringify(options.key || "");
	return this;
};

mongoose.Query.prototype.exec = async function () {
	if (!this.useCache) {
		return exec.apply(this, arguments);
	}
	// console.log("Im about to Runa query");
	// console.log(this.getQuery());
	// console.log(this.mongooseCollection.name);

	const key = JSON.stringify(
		Object.assign({}, this.getQuery(), {
			collection: this.mongooseCollection.name,
		})
	);

	// do we have any value for key in redis?
	const cacheValue = await client.hget(this.hashKey, key);

	// If we do, return
	if (cacheValue) {
		const doc = JSON.parse(cacheValue);

		return Array.isArray(doc)
			? doc.map(d => new this.model(d))
			: new this.model(doc);
	}

	// Otherwise go to mongo

	// console.log(key);
	const result = await exec.apply(this, arguments);

	client.hset(this.hashKey, key, JSON.stringify(result), "EX", 10);

	return result;
	//console.log(result);
};

module.exports = {
	clearHash(hashKey) {
		client.del(JSON.stringify(hashKey));
	},
};
