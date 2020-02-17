import { anyValue } from '../../interface/general/any';

export default function<T extends { [k: string]: I; [Symbol.iterator]: Iterator<anyValue, any, undefined> }, I, O>(
  object: T,
  fn: (i: I) => O
): { [k: string]: O } {
  const ret: { [k: string]: O } = {};
  for (const [k, v] of Object.entries(object)) {
    ret[k] = fn(v);
  }
  return ret;
}
