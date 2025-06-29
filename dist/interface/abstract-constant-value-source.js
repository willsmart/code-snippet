"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractConstantValueSource = void 0;
const abstract_value_source_1 = require("./abstract-value-source");
class AbstractConstantValueSource extends abstract_value_source_1.AbstractValueSource {
    valueFromSubclass() {
        return Promise.resolve(this.cachedValue);
    }
    setValueInSubclass() {
        return undefined;
    }
    constructor({ interfacePassback, rawValue, valueTransform, }) {
        super({ interfacePassback, value: valueTransform(rawValue), valid: true });
    }
}
exports.AbstractConstantValueSource = AbstractConstantValueSource;
//# sourceMappingURL=abstract-constant-value-source.js.map