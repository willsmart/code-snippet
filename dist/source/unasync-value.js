"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nobo_singleton_1 = require("../interface/nobo-singleton");
function default_1(callInstance, defaultValueForKeyPath, keyPath, value, then) {
    if (!nobo_singleton_1.noboSingleton.isPromise(value))
        return value;
    const promise = value;
    callInstance.retryAfterPromise(promise.then(then), keyPath);
    return defaultValueForKeyPath(keyPath);
}
exports.default = default_1;
//# sourceMappingURL=unasync-value.js.map