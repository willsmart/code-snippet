// import { anyObject, anyObject_T, anyPrimitive, anyValue } from '../interface/general/any';

// interface ValueSink_interface<T> {
//   handleValue(value: Value<T>);
// }
// interface ValueSource_interface<T> {
//   getValue(sink: ValueSink_interface<T>);
// }

// type Value<T> =
//   | {
//       value?: T;
//     }
//   | {
//       promise: Promise<T>;
//     };

// type anySourcedValue = anyPrimitive | { [key: string]: ValueSource_interface<anySourcedValue> };

// interface ObjectCloningProxyManager_forTheWorld extends ValueSink_interface<anySourcedValue> {
//   value: anyPrimitive | anyObject;
//   proxy: anyObject;

//   commit(): Promise<void>;
//   readonly keys: string[];
// }

// class ObjectCloningProxyManager implements ObjectCloningProxyManager_forTheWorld {
//   keyPath: string;
//   source: { [key: string]: ValueSource_interface<anySourcedValue> };
//   proxy: anyObject;
//   wasModified: () => void;

//   commit(): Promise<void> {
//     throw new Error('Method not implemented.');
//   }
//   get keys(): string[] {
//     throw new Error('Method not implemented.');
//   }
//   handleValue(sourcedValue: Value<anySourcedValue>) {
//     if ('value' in sourcedValue) {
//       const { value } = sourcedValue;
//       if (this.value === value) return;
//       this.value = value;
//       this.proxy = typeof value !== 'object' ? undefined : this._proxy;
//     }
//   }

//   get _proxy(): anyObject {
//     const mgr = this;
//     return (this.proxy = <anyObject>new Proxy(
//       {},
//       {
//         setPrototypeOf(_target: object, v: anyValue): boolean {
//           return false;
//         },
//         isExtensible(_target: object): boolean {
//           return false;
//         },
//         preventExtensions(_target: object): boolean {
//           return false;
//         },
//         getOwnPropertyDescriptor(_target: object, p: string): PropertyDescriptor | undefined {
//           return mgr.childDescriptor(p);
//         },
//         has(_target: object, p: string): boolean {
//           return mgr.hasChild(p);
//         },
//         get(_target: object, p: string, _receiver?: anyValue): anyValue {
//           return mgr.child(p);
//         },
//         set(_target: object, p: string, value: anyValue, _receiver: anyValue): boolean {
//           return mgr.setChild(p, value);
//         },
//         deleteProperty(_target: object, p: string): boolean {
//           return mgr.deleteChild(p);
//         },
//         ownKeys(_target: object): string[] {
//           return mgr.keys;
//         },
//         defineProperty(_target: object, p: string, attributes: PropertyDescriptor): boolean {
//           return mgr.defineChildProperty(p, attributes);
//         },
//         apply(_target: object, _thisArg: anyValue, _argArray?: anyValue): anyValue {
//           return;
//         },
//       }
//     ));
//   }

//   childProxyMgrs: { [key: string]: ObjectCloningProxyManager };
//   childValueSinks: { [key: string]: ValueSink_interface<anySourcedValue> };
//   childValues: { [key: string]: anySourcedValue };
//   childPropertyDescriptors: { [key: string]: PropertyDescriptor };
//   deletedChildren: Set<string>;

//   attachChildValueSink(key: string, sourceChild: ValueSource_interface<anySourcedValue>) {
//     sourceChild.getValue(
//       (this.childValueSinks[key] = {
//         handleValue(sourcedValue: Value<anySourcedValue>) {
//           if ('value' in sourcedValue) {
//             const { value } = sourcedValue;
//             if (typeof value !== 'object') {
//               if (key in this.childValues && this.childValues[key] === value) return;
//               this.deletedChildren.delete(key);
//               this.wasModified();
//               this.childValues[key] = value;
//               this.childProxyMgrs[key] = undefined;
//               return;
//             }
//             if (key in this.childProxyMgrs && this.childProxyMgrs[key].source === value) return;

//             this.childProxyMgrs[key] = new ObjectCloningProxyManager(`${this.keyPath}.${key}`, value, this.wasModified);
//             this.childValues[key] = this.childProxyMgrs[key].proxy;
//           }
//         },
//       })
//     );
//   }

//   setChild(key: string, sourceChild: ValueSource_interface<anySourcedValue>): boolean {
//     const descriptor = this._childDescriptor(key);
//     if (descriptor && !descriptor.writable) return false;

//     this.attachChildValueSink(key, sourceChild);
//     return true;
//   }

//   defineChildProperty(key: string, descriptor: PropertyDescriptor): boolean {
//     const descriptorWas = this._childDescriptor(key);
//     if (descriptorWas && !descriptorWas.configurable) return false;

//     if ('value' in descriptor)
//       descriptor.value = this.unasyncValue(`${this.keyPath}.${key}`, descriptor.value, value => {
//         this.defineChildProperty(key, {
//           ...descriptor,
//           value,
//         });
//       });
//     const { value } = descriptor;

//     this.deletedChildren.delete(key);
//     if (value && typeof value == 'object') {
//       descriptor = {
//         ...descriptor,
//         value: this._createChildObject(key, value).proxy,
//       };
//     } else {
//       delete this.childObjects[key];
//     }

//     Object.defineProperty(this.childValues, key, descriptor);

//     this.wasModified();
//     return true;
//   }

//   deleteChild(key: string): boolean {
//     const descriptor = this._childDescriptor(key);
//     if (!descriptor) return true;
//     if (!descriptor.configurable) return false;

//     delete this.childValues[key];
//     delete this.childValues[key];
//     delete this.childProxyMgrs[key];
//     delete this.childValueSinks[key];
//     this.deletedChildren.add(key);

//     this.wasModified();
//     return true;
//   }

//   hasChild(key: string): boolean {
//     return !this.deletedChildren.has(key) && (key in this.childValues || key in this.source);
//   }

//   child(key: string): anyObject | anyPrimitive {
//     if (this.deletedChildren.has(key)) return;
//     if (key in this.childValues) return this.childValues[key];

//     if (!(key in this.source)) return;

//     this.attachChildValueSink(key, this.source[key]);
//     return this.childValues[key];
//   }

//   _childDescriptor(key: string): PropertyDescriptor | undefined {
//     if (this.deletedChildren.has(key)) return;
//     return this.childPropertyDescriptors[key] || Object.getOwnPropertyDescriptor(this.source, key);
//   }

//   childDescriptor(key: string): PropertyDescriptor | undefined {
//     if (this.deletedChildren.has(key)) return;
//     const hasChild = key in this.childValues,
//       childPropertyDescriptor = this.childPropertyDescriptors[key];

//     if (hasChild && childPropertyDescriptor) return childPropertyDescriptor;

//     const sourceDescriptor = Object.getOwnPropertyDescriptor(this.source, key);

//     if (!hasChild) {
//       if (!sourceDescriptor) return undefined;

//       this.attachChildValueSink(key, <ValueSource_interface<anySourcedValue>>sourceDescriptor.value);
//     }

//     sourceDescriptor.value = this.childValues[key];
//     return sourceDescriptor;
//   }

//   constructor(keyPath: string, source: ValueSource_interface<anySourcedValue>, wasModified: () => void) {
//     this.keyPath = keyPath;
//     this.wasModified = wasModified;
//     source.getValue(this);
//   }
// }
