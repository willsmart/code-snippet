"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinks_and_sources_1 = require("./sinks-and-sources");
class AbstractValueSource {
    constructor({ interfacePassback, value, valid, }) {
        this.privateData = {
            cachedValue: value,
            valid,
            sinks: new Set(),
        };
        interfacePassback.owner = {
            addSink: this.addSink.bind(this),
            removeSink: this.removeSink.bind(this),
            cleanup: this.cleanup.bind(this),
            sinkInterface: () => this,
        };
        const _verifyThatThisImplementsTheSubclassInterface = {
            valueFromSubclass: this.valueFromSubclass,
            subclassValueWasInvalidated: this.subclassValueWasInvalidated,
            subclassHasNewValue: this.subclassHasNewValue,
            setValueInSubclass: this.setValueInSubclass,
        };
    }
    // ValueSource_sinkInterface
    // The interface presented to attached sinks or anyone who has a reference to the source
    setValue(v) {
        throw new Error('Method not implemented.');
    }
    get valid() {
        return this.privateData.valid;
    }
    get cachedValue() {
        return this.privateData.cachedValue;
    }
    get value() {
        if (this.privateData.valid)
            return Promise.resolve(this.privateData.cachedValue);
        return this.valueFromSource;
    }
    // ValueSource_ownerInterface
    // The interface presented to the source registry or whatever object created the source
    addSink(sink) {
        const { privateData: { valid, sinks }, } = this;
        sinks.add(sink);
        if (!valid && sink.sourceWasInvalidated)
            sink.sourceWasInvalidated();
        else
            sink.sourceHasNewValue(this.privateData.cachedValue);
        return sink;
    }
    removeSink(sink) {
        const { privateData: { valid, sinks }, } = this;
        if (valid && sink.sourceWasInvalidated)
            sink.sourceWasInvalidated();
        sinks.delete(sink);
        return sinks.size ? sinks_and_sources_1.ValueSource_stateForOwner.hasSinks : sinks_and_sources_1.ValueSource_stateForOwner.hasNoSinks;
    }
    async cleanup() {
        const { privateData } = this;
        privateData.valid = false;
        await this.notifySinks();
        privateData.sinks.clear();
    }
    subclassValueWasInvalidated() {
        this.privateData.valid = false;
        return this.notifySinks();
    }
    subclassHasNewValue(v) {
        const { privateData } = this;
        privateData.cachedValue = v;
        privateData.valid = true;
        return this.notifySinks().then(() => privateData.cachedValue);
    }
    // Get the value from the source
    get valueFromSource() {
        const { privateData } = this;
        return (privateData.valueGetterPromise ||
            (privateData.valueGetterPromise = this.valueFromSubclass().then(async (v) => {
                this.subclassHasNewValue(v);
                privateData.valueGetterPromise = undefined;
                return v;
            })));
    }
    // Notify the sinks that the value has changed
    async notifySinks() {
        const { privateData: { valid, sinks }, } = this;
        const promises = Array();
        if (valid) {
            const newValue = this.cachedValue;
            sinks.forEach(sink => {
                promises.push(sink.sourceHasNewValue(newValue));
            });
        }
        else {
            sinks.forEach(sink => {
                if (sink.sourceWasInvalidated)
                    promises.push(sink.sourceWasInvalidated());
            });
        }
        await Promise.all(promises);
    }
}
exports.AbstractValueSource = AbstractValueSource;
//# sourceMappingURL=abstract-value-source.js.map