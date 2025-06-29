import { anyObject, anyValue } from "../interface/any";
import { CodeSnippetCallInstance } from "../interface/code-snippet";

type primitive =
  | string
  | number
  | boolean
  | symbol
  | null
  | Function
  | undefined;

export class CodeSnippetObjectProxyManager {
  keyPath: string;
  callInstance: CodeSnippetCallInstance;
  childObjects: { [key: string]: CodeSnippetObjectProxyManager } = {};
  childValues: anyObject = {};
  deletedChildren = new Set<string>();
  proxy: anyObject;
  source: anyObject;
  unasyncValue: (
    keyPath: string,
    value: anyValue,
    then: (value: anyValue) => void
  ) => anyValue;
  wasModified: () => void;

  commit() {
    let { source } = this;

    this.deletedChildren.forEach((key) => {
      delete source[key];
    });
    for (const key of Object.getOwnPropertyNames(this.childValues)) {
      const descriptor = Object.getOwnPropertyDescriptor(this.childValues, key);
      if (!descriptor) continue;
      if (key in this.childObjects) {
        const sourceChild = source[key];
        const childMgr = this.childObjects[key];

        if (!sourceChild) {
          Object.defineProperty(source, key, {
            ...descriptor,
            value: childMgr.source,
          });
        } else if (sourceChild !== childMgr.source) continue;

        childMgr.commit();
      } else Object.defineProperty(source, key, descriptor);
    }
  }

  get keys(): string[] {
    const keys = Object.getOwnPropertyNames(this.childValues).slice();
    for (const key of Object.getOwnPropertyNames(this.source)) {
      if (!(this.deletedChildren.has(key) || key in this.childValues))
        keys.push(key);
    }
    return keys;
  }

  _createChildObject(
    key: string,
    sourceChild: anyObject
  ): CodeSnippetObjectProxyManager {
    return (this.childObjects[key] = new CodeSnippetObjectProxyManager(
      `${this.keyPath}.${key}`,
      sourceChild,
      this.unasyncValue,
      this.wasModified,
      this.callInstance
    ));
  }

  setChild(key: string, value: anyValue): boolean {
    value = this.unasyncValue(`${this.keyPath}.${key}`, value, (v) =>
      this.setChild(key, v)
    );

    const descriptor = this._childDescriptor(key);
    if (descriptor && !descriptor.writable) return false;

    this.deletedChildren.delete(key);
    if (value && typeof value == "object") {
      value = this._createChildObject(key, <anyObject>value).proxy;
    } else {
      delete this.childObjects[key];
    }
    this.childValues[key] = value;

    this.wasModified();
    return true;
  }

  defineChildProperty(key: string, descriptor: PropertyDescriptor): boolean {
    const descriptorWas = this._childDescriptor(key);
    if (descriptorWas && !descriptorWas.configurable) return false;

    if ("value" in descriptor)
      descriptor.value = this.unasyncValue(
        `${this.keyPath}.${key}`,
        descriptor.value,
        (value) => {
          this.defineChildProperty(key, {
            ...descriptor,
            value,
          });
        }
      );
    const { value } = descriptor;

    this.deletedChildren.delete(key);
    if (value && typeof value == "object") {
      descriptor = {
        ...descriptor,
        value: this._createChildObject(key, value).proxy,
      };
    } else {
      delete this.childObjects[key];
    }

    Object.defineProperty(this.childValues, key, descriptor);

    this.wasModified();
    return true;
  }

  deleteChild(key: string): boolean {
    const descriptor = this._childDescriptor(key);
    if (!descriptor) return true;
    if (!descriptor.configurable) return false;

    delete this.childValues[key];
    delete this.childObjects[key];
    this.deletedChildren.add(key);

    this.wasModified();
    return true;
  }

  hasChild(key: string): boolean {
    return (
      !this.deletedChildren.has(key) &&
      (key in this.childValues || key in this.source)
    );
  }

  child(key: string): anyObject | primitive {
    const descriptor = this.childDescriptor(key);
    return descriptor && descriptor.value;
  }

  _childDescriptor(key: string): PropertyDescriptor | undefined {
    if (this.deletedChildren.has(key)) return;
    if (key in this.childValues)
      Object.getOwnPropertyDescriptor(this.childValues, key);
    return Object.getOwnPropertyDescriptor(this.source, key);
  }

  childDescriptor(key: string): PropertyDescriptor | undefined {
    if (this.deletedChildren.has(key)) return;
    if (key in this.childValues)
      Object.getOwnPropertyDescriptor(this.childValues, key);

    const sourceDescriptor = Object.getOwnPropertyDescriptor(this.source, key);
    if (!sourceDescriptor) return undefined;
    sourceDescriptor.value = this.unasyncValue(
      `${this.keyPath}.${key}`,
      sourceDescriptor.value,
      (value) => {
        this.defineChildProperty(key, {
          ...sourceDescriptor,
          value,
        });
      }
    );
    const { value: sourceChild } = sourceDescriptor;

    if (!sourceChild || typeof sourceChild != "object") return sourceDescriptor;

    return Object.defineProperty(this.childValues, key, {
      ...sourceDescriptor,
      value: this._createChildObject(key, sourceChild).proxy,
    });
  }

  constructor(
    keyPath: string,
    source: anyObject,
    unasyncValue: (
      keyPath: string,
      value: anyValue | Promise<anyValue>,
      then: (value: anyValue) => void
    ) => anyValue,
    wasModified: () => void,
    callInstance: CodeSnippetCallInstance
  ) {
    this.keyPath = keyPath;
    this.callInstance = callInstance;
    this.source = source;
    this.unasyncValue = unasyncValue;
    this.wasModified = wasModified;

    const mgr = this;
    this.proxy = <anyObject>new Proxy(
      {},
      {
        setPrototypeOf(_target: object, v: anyValue): boolean {
          return false;
        },
        isExtensible(_target: object): boolean {
          return false;
        },
        preventExtensions(_target: object): boolean {
          return false;
        },
        getOwnPropertyDescriptor(
          _target: object,
          p: string
        ): PropertyDescriptor | undefined {
          return mgr.childDescriptor(p);
        },
        has(_target: object, p: string): boolean {
          return mgr.hasChild(p);
        },
        get(_target: object, p: string, _receiver?: anyValue): anyValue {
          return mgr.child(p);
        },
        set(
          _target: object,
          p: string,
          value: anyValue,
          _receiver: anyValue
        ): boolean {
          return mgr.setChild(p, value);
        },
        deleteProperty(_target: object, p: string): boolean {
          return mgr.deleteChild(p);
        },
        ownKeys(_target: object): string[] {
          return mgr.keys;
        },
        defineProperty(
          _target: object,
          p: string,
          attributes: PropertyDescriptor
        ): boolean {
          return mgr.defineChildProperty(p, attributes);
        },
        apply(
          _target: object,
          _thisArg: anyValue,
          _argArray?: anyValue
        ): anyValue {
          return;
        },
      }
    );
  }
}
