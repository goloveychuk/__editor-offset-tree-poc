


export class OrderedMap<K, V> {
    private _list: V[]
    private _map: Map<K, V>
    constructor() {
        this._list = []
        this._map = new Map<K, V>()
    }
    add(key: K, val: V) {
        this._list.push(val)
        this._map.set(key, val)
    }
    push(val: V) {
        this._list.push(val)
    }
    get(key: K): V | undefined {
        return this._map.get(key)
    }
    has(key: K): boolean {
        return this._map.has(key)
    }
    getByIndex(ind: number) {
        return this._list[ind]
    }
    [Symbol.iterator]() {
        return this._list[Symbol.iterator]()
    }
    get length() {
        return this._list.length
    }
    map<T>(cb: (v: V, ind: number) => T) {
        return this._list.map(cb)
    }

}
