"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CodeSnippetObjectProxyManager {
    constructor(keyPath, source, unasyncValue, wasModified, callInstance) {
        this.childObjects = {};
        this.childValues = {};
        this.deletedChildren = new Set();
        this.keyPath = keyPath;
        this.callInstance = callInstance;
        this.source = source;
        this.unasyncValue = unasyncValue;
        this.wasModified = wasModified;
        const mgr = this;
        this.proxy = new Proxy({}, {
            setPrototypeOf(_target, v) {
                return false;
            },
            isExtensible(_target) {
                return false;
            },
            preventExtensions(_target) {
                return false;
            },
            getOwnPropertyDescriptor(_target, p) {
                return mgr.childDescriptor(p);
            },
            has(_target, p) {
                return mgr.hasChild(p);
            },
            get(_target, p, _receiver) {
                return mgr.child(p);
            },
            set(_target, p, value, _receiver) {
                return mgr.setChild(p, value);
            },
            deleteProperty(_target, p) {
                return mgr.deleteChild(p);
            },
            ownKeys(_target) {
                return mgr.keys;
            },
            defineProperty(_target, p, attributes) {
                return mgr.defineChildProperty(p, attributes);
            },
            apply(_target, _thisArg, _argArray) {
                return;
            },
        });
    }
    commit() {
        let { source } = this;
        this.deletedChildren.forEach(key => {
            delete source[key];
        });
        for (const key of Object.getOwnPropertyNames(this.childValues)) {
            const descriptor = Object.getOwnPropertyDescriptor(this.childValues, key);
            if (!descriptor)
                continue;
            if (key in this.childObjects) {
                const sourceChild = source[key];
                const childMgr = this.childObjects[key];
                if (!sourceChild) {
                    Object.defineProperty(source, key, { ...descriptor, value: childMgr.source });
                }
                else if (sourceChild !== childMgr.source)
                    continue;
                childMgr.commit();
            }
            else
                Object.defineProperty(source, key, descriptor);
        }
    }
    get keys() {
        const keys = Object.getOwnPropertyNames(this.childValues).slice();
        for (const key of Object.getOwnPropertyNames(this.source)) {
            if (!(this.deletedChildren.has(key) || key in this.childValues))
                keys.push(key);
        }
        return keys;
    }
    _createChildObject(key, sourceChild) {
        return (this.childObjects[key] = new CodeSnippetObjectProxyManager(`${this.keyPath}.${key}`, sourceChild, this.unasyncValue, this.wasModified, this.callInstance));
    }
    setChild(key, value) {
        value = this.unasyncValue(`${this.keyPath}.${key}`, value, v => this.setChild(key, v));
        const descriptor = this._childDescriptor(key);
        if (descriptor && !descriptor.writable)
            return false;
        this.deletedChildren.delete(key);
        if (value && typeof value == "object") {
            value = this._createChildObject(key, value).proxy;
        }
        else {
            delete this.childObjects[key];
        }
        this.childValues[key] = value;
        this.wasModified();
        return true;
    }
    defineChildProperty(key, descriptor) {
        const descriptorWas = this._childDescriptor(key);
        if (descriptorWas && !descriptorWas.configurable)
            return false;
        if ("value" in descriptor)
            descriptor.value = this.unasyncValue(`${this.keyPath}.${key}`, descriptor.value, value => {
                this.defineChildProperty(key, {
                    ...descriptor,
                    value,
                });
            });
        const { value } = descriptor;
        this.deletedChildren.delete(key);
        if (value && typeof value == "object") {
            descriptor = {
                ...descriptor,
                value: this._createChildObject(key, value).proxy,
            };
        }
        else {
            delete this.childObjects[key];
        }
        Object.defineProperty(this.childValues, key, descriptor);
        this.wasModified();
        return true;
    }
    deleteChild(key) {
        const descriptor = this._childDescriptor(key);
        if (!descriptor)
            return true;
        if (!descriptor.configurable)
            return false;
        delete this.childValues[key];
        delete this.childObjects[key];
        this.deletedChildren.add(key);
        this.wasModified();
        return true;
    }
    hasChild(key) {
        return !this.deletedChildren.has(key) && (key in this.childValues || key in this.source);
    }
    child(key) {
        const descriptor = this.childDescriptor(key);
        return descriptor && descriptor.value;
    }
    _childDescriptor(key) {
        if (this.deletedChildren.has(key))
            return;
        if (key in this.childValues)
            Object.getOwnPropertyDescriptor(this.childValues, key);
        return Object.getOwnPropertyDescriptor(this.source, key);
    }
    childDescriptor(key) {
        if (this.deletedChildren.has(key))
            return;
        if (key in this.childValues)
            Object.getOwnPropertyDescriptor(this.childValues, key);
        const sourceDescriptor = Object.getOwnPropertyDescriptor(this.source, key);
        if (!sourceDescriptor)
            return undefined;
        sourceDescriptor.value = this.unasyncValue(`${this.keyPath}.${key}`, sourceDescriptor.value, value => {
            this.defineChildProperty(key, {
                ...sourceDescriptor,
                value,
            });
        });
        const { value: sourceChild } = sourceDescriptor;
        if (!sourceChild || typeof sourceChild != "object")
            return sourceDescriptor;
        return Object.defineProperty(this.childValues, key, {
            ...sourceDescriptor,
            value: this._createChildObject(key, sourceChild).proxy,
        });
    }
}
exports.CodeSnippetObjectProxyManager = CodeSnippetObjectProxyManager;
//# sourceMappingURL=code-snippet-object-proxy-manager.js.map