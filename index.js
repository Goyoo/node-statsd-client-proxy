'use strict';

var HashRing        = require('hashring');
var _               = require('underscore');
var SDC             = require('statsd-client');

function ProxyWrapper(options, callback)
{
    if (!options || !options.nodes || !options.nodes.length)
        return callback && callback(new Error('Invalid options object'))

    this.ring = new HashRing();
    this.nodeMap = {};
    var nodeOptions, node, nodeAddr;
    for (var i = 0; i < options.nodes.length; i++)
    {
        nodeOptions = _.clone(options);
            delete nodeOptions.nodes;
            nodeOptions.host = options.nodes[i].host;
            nodeOptions.port = options.nodes[i].port;

        node = new SDC(nodeOptions)
        nodeAddr = nodeOptions.host + ':' + nodeOptions.port;

        // ring.add('127.0.0.7').remove('127.0.0.1');
        this.ring.add(nodeAddr);
        this.nodeMap[nodeAddr] = node;
    }

    callback && callback();
}

ProxyWrapper.prototype.getNodeFromKey = function getNodeFromKey(key)
{
    return this.nodeMap[this.ring.get(key)];
};

var methods = [
    'increment',
    'decrement',
    'counter',
    'gaugeDelta',
    'gauge',
    'set',
    'raw',
];

for (var i = 0; i < methods.length; i++)
{
    ProxyWrapper.prototype[methods[i]] = (function (method)
    {
        return function (key)
        {
            var node = this.getNodeFromKey(key);
            return node[method].apply(node, arguments);
        };
    })(methods[i]);
}

module.exports = ProxyWrapper;
