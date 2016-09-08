# This is an experiment that is not production ready

node-statsd-client-proxy
==================

Node.js proxy client for [statsd](https://github.com/etsy/statsd).

This module is a wrapper around [statsd-client](https://github.com/msiebuhr/node-statsd-client)

Quick tour
----------

```javascript
var StatsdProxy = require('statsd-proxy');
var statsd = new StatsdProxy({
        nodes: [
            { host: '127.0.0.1', port: 8125, }, 
            { host: '127.0.0.1', port: 8127, }, 
        ],
    });

var timer = new Date();
statsd.increment('some.counter'); // Increment by one.
statsd.gauge('some.gauge', 10); // Set gauge to 10
statsd.timing('some.timer', timer); // Calculates time diff
```

Why another module ?
--------------------

As our traffic was growing, we were looking at a way to scale statsd easely. Easier said than done!

Proxy approach:
- [Official stats proxy](https://github.com/etsy/statsd) only supports UDP and is [buggy](https://github.com/etsy/statsd/issues/540)
- [hit9 implementation in C](https://github.com/hit9/statsd-proxy) only supports UDP
- 3 tiers implementation: your APP <> UDP proxy <> statsd

Client approach:
- What if your APP can do the proxy itself?
- Simpler is better. Hey, it's on the internet so it must be true
- 2 tiers implementation: your APP <> statsd

And we support TCP !

What is this magic ?!
---------------------

We are using a [consistent hashring](http://www.martinbroadhurst.com/Consistent-Hash-Ring.html) in internal. Which means that a given key will always go on the same statsd instance. You don't even need to know how it works, it just does.
Free of headaches, all you will hear is your co-workers telling you how awesome you are to have found this module

API
---

### Initialization

```javascript
var StatsdProxy = require('statsd-proxy');
var statsd = new StatsdProxy({
        nodes: [
            { host: '127.0.0.1', port: 8125, }, 
            { host: '127.0.0.1', port: 8127, }, 
        ],
        port: 8124,
        debug: true,
    });
```

Global options:
 * `prefix`: Prefix all stats with this value (default `""`).
 * `debug`: Print what is being sent to stderr (default `false`).
 * `tcp`: User specifically wants to use tcp (default `false`).
 * `socketTimeout`: Dual-use timer. Will flush metrics every interval. For UDP,
   it auto-closes the socket after this long without activity (default 1000 ms;
   0 disables this). For TCP, it auto-closes the socket after `socketTimeoutsToClose` number of timeouts have elapsed without activity.

UDP options:
 * `nodes`: An array of objects, each contain a field `host` and `port`

TCP options:
 * `nodes`: An array of objects, each contain a field `host` and `port`
 * `socketTimeoutsToClose`: Number of timeouts in which the socket auto-closes if it has been inactive. (default `10`; `1` to auto-close after a single timeout).

HTTP options:
 * `nodes`: An array of objects, each contain a field `host` and `port`
 * `headers`: Additional headers to send (default `{}`)
 * `method`: What HTTP method to use (default `PUT`)

### Counting stuff

Counters are supported, both as raw `.counter(metric, delta)` and with the
shortcuts `.increment(metric, [delta=1])` and `.decrement(metric, [delta=-1])`:

```javascript
sdc.increment('systemname.subsystem.value'); // Increment by one
sdc.decrement('systemname.subsystem.value', -10); // Decrement by 10
sdc.counter('systemname.subsystem.value', 100); // Increment by 100
```

### Gauges

Sends an arbitrary number to the back-end:

```javascript
sdc.gauge('what.you.gauge', 100);
sdc.gaugeDelta('what.you.gauge', 20);  // Will now count 120
sdc.gaugeDelta('what.you.gauge', -70); // Will now count 50
sdc.gauge('what.you.gauge', 10);       // Will now count 10
```

### Sets

Send unique occurences of events between flushes to the back-end:

```javascript
sdc.set('your.set', 200);
```

### Delays

Keep track of how fast (or slow) your stuff is:

```javascript
var start = new Date();
setTimeout(function () {
    sdc.timing('random.timeout', start);
}, 100 * Math.random());
```

If it is given a `Date`, it will calculate the difference, and anything else
will be passed straight through.

And don't let the name (or nifty interface) fool you - it can measure any kind
of number, where you want to see the distribution (content lengths, list items,
query sizes, ...)

What's broken
-------------

Check the [GitHub issues](https://github.com/msiebuhr/node-statsd-client/issues).

