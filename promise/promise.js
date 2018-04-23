const { PROMISE_STATES: {
    PENDING, REJECTED, RESOLVED
} } = require('./constants.js');

function getThen (value) {
    const t = typeof value;
    if (value && (t === 'function') || (t === 'object')) {
        const then = value.then;
        if (typeof then === 'function') {
            return then.bind(value);
        }
    }
    return null;
}

class Promise {
    /**
    * Executes executor immediately
    * Return value of executor is ignored
    * If executor throws exception, reject
    */
    constructor (executor) {
        if (typeof executor !== 'function') {
            throw Error('Missing executor');
        }
        this._pending();
        this._runExecutor(executor);
    }

    _pending () {
        this._value = undefined;
        this._handlers = [];
        this._state = PENDING;
    }

    _runExecutor (executor) {
        let done = false;
        let self = this;
        try {
            executor(controlledResolve, controlledReject);
        } catch (err) {
            if (done) return;
            this._reject(err);
            done = true;
        }
        function controlledResolve (val) {
            if (done) return;
            self._resolveHandleTypes(val);
            done = true;
        }
        function controlledReject (err) {
            if (done) return;
            self._reject(err);
            done = true;
        }
    }

    _resolveHandleTypes (val) {
        try {
            const then = getThen(val);
            if (then) {
                //then has same signature as executor
                this._runExecutor(then);
            }
            else {
                this._resolve(val);
            }
        } catch (e) {
            this._reject(e);
        }

    }

    _resolve (val) {
        this._value = val;
        this._state = RESOLVED;
        this._handlers.forEach(({onFulfill}) => {
            onFulfill && onFulfill(val);
        });
        this._handlers  = null;
    }

    _reject (err) {
        this._value = err;
        this._state = REJECTED;
        this._handlers.forEach(({onReject}) => {
            onReject && onReject(err);
        });
        this._handlers = null;
    }

    //Add observers
    done (onFulfill, onReject) {
        setTimeout( () => {
            if (this._state === PENDING) {
                this._handlers.push({onFulfill, onReject});
            }
            else if (this._state === RESOLVED) {
                onFulfill && onFulfill(this._value);
            }
            else if (this._state === REJECTED) {
                onReject && onReject(this._value);
            }
        }, 0);
    }

    //Add observers and turn a new promise
    then (onFulfill, onReject) {
        //done -> onFullfill/onReject -> resolve/reject
        return new Promise((resolve, reject) => {
            this.done((val) => {
                    if (typeof onFulfill === 'function') {
                        try {
                            resolve(onFulfill(val));
                        } catch (e) {
                            reject(e);
                        }
                    }
                    else resolve(val);
                }, (err) => {
                    if (typeof onReject === 'function') {
                        try {
                            resolve(onReject(err));
                        } catch (e) {
                            reject(e);
                        }
                    }
                    else reject(err);
                });
        });
    }

    catch (errHandler) {
        return this.then(undefined, errHandler);
    }

//    finally () {}

    static resolve (val) {
        return new Promise((resolve, reject) => {
            resolve(val);
        });
    }
    static reject (err) {
        return new Promise((resolve, reject) => {
            reject(err);
        });
    }
    static all (inputArr) {
        return new Promise((resolve, reject) => {
            const len = inputArr.length;
            if (len === 0) {
                resolve([]);
                return;
            }
            let results = new Array(len);
            let unprocessed = len;
            let input, then, rejected;
            for (let i = 0; i < len; ++i) {
                if (rejected) return;
                input = inputArr[i];
                then = getThen(input);
                if (then) {
                    then(val => {
                        results[i] = val;
                        if (--unprocessed === 0) resolve(results);
                    }, err => {
                        reject(err);
                        rejected = true;
                    });
                }
                else {
                    results[i] = input;
                    if (--unprocessed === 0) resolve(results);
                }
            }
        });
    }
    /*
    * returns a promise: first one that resolves/rejects
    * If input is empty array, forever pending promise
    */ 
    static race (inputArr) {
        return new Promise( (resolve, reject) => {
            if (inputArr.length === 0) return;
            let then, isFulfilled;
            for (let input of inputArr) {
                if (isFulfilled) return;
                then = getThen(input);
                if (then) {
                    then(val => {
                        resolve(val);
                        isFulfilled = true;
                    }, err => {
                        reject(err);
                        isFulfilled = true;
                    });
                }
                else {
                    resolve(input);
                    isFulfilled = true;
                }
            }
        });
    }

}

exports.Promise = Promise;
