// our backing array
export const observable = [];

export function observer(callback) {
  return new Proxy(observable, {
    apply(target, thisArg, argumentList) {
      return thisArg[target].apply(this, argumentList);
    },

    deleteProperty(target, property) {
      return true;
    },

    set(target, property, value, receiver) {
      target[property] = value;
      callback(value);
      return true;
    }
  });
}
