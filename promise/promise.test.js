const Promise = require('./promise.js').Promise;

const testString = 'hello';
function resolveToString (resolve, reject) {
	setTimeout(resolve, 0, testString);
}

const testError = 'error!!';
function rejectToError (resolve, reject) {
	setTimeout(reject, 0, Error(testError));
}

test('Test static resolve method: resolve non-promise', () => {
	return expect(Promise.resolve(testString))
		   .resolves.toBe(testString);
});

test('Test static resolve: resolve promise', () => {
	const p = Promise.resolve(testString);
	return expect(Promise.resolve(p))
		   .resolves.toBe(testString);
});

test('Test static reject method', () => {
	return expect(Promise.reject(Error(testError)))
		   .rejects.toThrow(testError);
});

test('Test promise rejects if no executor provided', () => {
	expect(() => new Promise()).toThrow('Missing executor');
});

test('Test promise with executor that throws \
is rejected', () => {
	const executor = () => {throw Error(testError)};
	return expect(new Promise(executor)).rejects.toThrow(testError);
});

test('Test promise with executor that \
resolves to non-promise', () => {
	return expect(new Promise(resolveToString))
		   .resolves.toBe(testString);
});

test('Test promise with executor that \
resolves to a promise', () => {
	return expect(new Promise((resolve, reject) => {
		resolve(Promise.resolve(testString));
	})).resolves.toBe(testString);
});

test('Test promise with executor that \
rejects to error', () => {
	return expect(new Promise(rejectToError))
		   .rejects.toThrow(testError);
});

test('Test multiple resolve does not change val', () => {
	return expect(new Promise((resolve, reject) => {
		resolve(testString);
		resolve('Oh man, another resolve');
	})).resolves.toBe(testString);
});

test('Test multiple rejects does not change val', () => {
	return expect(new Promise((resolve, reject) => {
		reject(Error(testError));
		reject(Error('Oh man, another reject'));
	})).rejects.toThrow(testError);
});

test('Test reject follows by resolve does not\
 change state', () => {
 	return expect(new Promise((resolve, reject) => {
 		reject(Error(testError));
 		resolve('lalalal');
 	})).rejects.toThrow(testError);
 });

test('Test then: onFulfill handler returns non-promise',
 () => {
	return expect(Promise.resolve(10).then( (val) => {
		return testString;
	} )).resolves.toBe(testString);
});

test('Test then: onFulfill handler returns promise',
 () => {
	return expect(Promise.resolve(10).then( (val) => {
		return Promise.reject(testError);
	} )).rejects.toThrow(testError);
});

test('Test then: onFulfill handler is not function',
 () => {
	return expect(Promise.resolve(testString).then('random'))
	.resolves.toBe(testString);
});

test('Test then: onFulfill handler omitted',
 () => {
	return expect(Promise.resolve(testString).then())
	.resolves.toBe(testString);
});

test('Test then: onReject handler returns non-promise',
 () => {
	return expect(Promise.reject(10).then(undefined, (val) => {
		return testString;
	} )).resolves.toBe(testString);
});

test('Test then: onReject handler returns promise',
 () => {
 	const p = Promise.resolve(testString);
	return expect(Promise.reject(10).then(undefined, (val) => {
		return p;
	} )).resolves.toBe(testString);
});

test('Test catch: errHandler return non-promise', () => {
	return expect( Promise.reject(Error(testError))
	.catch( (err) => testString ) ).resolves.toBe(testString);
});

test('Test catch: errHandler return promise that rejects', () => {
	return expect( Promise.reject(Error('lalala'))
	.catch( (err) => Promise.reject(testError) ) )
	.rejects.toThrow(testError);
});

test('Test catch: errHandler return promise that resolves', () => {
	return expect( Promise.reject(Error('lalala'))
	.catch( (err) => Promise.resolve(testString) ) )
	.resolves.toBe(testString);
});

test('Test catch: errHandler is not function', () => {
	return expect(Promise.reject(Error(testError))
	.catch('random')).rejects.toThrow(testError);
});

test('Test catch: errHandler is omitted', () => {
	return expect(Promise.reject(Error(testError))
	.catch()).rejects.toThrow(testError);
});

test('Test then: if rejected, only onReject is called', () => {
	expect.assertions(1);
	return Promise.reject(Error(testError))
	.then(val => {
		expect(true).toBe(false); //shouldn't be here
	}, err => {
		expect(err).toEqual(Error(testError));
	});
});

test('Test then: if resolved, only onFulfill is called', () => {
	expect.assertions(1);
	return Promise.resolve(testString)
	.then(val => {
		expect(val).toBe(testString); 
	}, err => {
		expect(true).toBe(false); //shouldn't be here
	});
});

test('Test catch followed by then', () => {
	expect.assertions(1);
	return new Promise((resolve, reject) => {
		throw Error(testError);
	})
	.catch(err => {
		return testString;
	})
	.then(val => expect(val).toBe(testString));
});

test('Test then followed by catch: catch error in promise', () => {
	expect.assertions(1);
	return new Promise((resolve, reject) => {
		reject(testError);
	})
	.then(val => {
		expect(true).toBe(false); //shouldn't be here
	})
	.catch(err => {
		expect(err).toBe(testError)
	});
});

test('Test then followed by catch: catch error in then', () => {
	expect.assertions(1);
	return new Promise((resolve, reject) => {
		resolve();
	})
	.then(() => {
		throw(Error(testError));
	})
	.catch(err => {
		expect(err).toEqual(Error(testError))
	});
});

test('Test static all with []: return resolved results', () => {
	return expect(Promise.all([])).resolves.toEqual([]);
});

test('Test static all with [<promises>]:\
 return resolved results', () => {
	return expect(Promise.all([
		new Promise(resolveToString), 
		new Promise(resolveToString)
	])).resolves.toEqual([
		testString, 
		testString]
	);
});

test('Test static all with [<mix promises and non-promises>]:\
 return resolved results', () => {
	return expect(Promise.all([
		1,
		new Promise(resolveToString), 
		true,
		new Promise(resolveToString)
	])).resolves.toEqual([
		1,
		testString,
		true, 
		testString]
	);
});

test('Test static all with [<mix promises and non-promises>]:\
 return resolved results', () => {
	return expect(Promise.all([
		new Promise(resolveToString), 
		1,
		new Promise(resolveToString),
		true
	])).resolves.toEqual([
		testString,
		1,
		testString,
		true]
	);
});

test('Test static all: return first reject', () => {
	return expect(Promise.all([
		new Promise(resolveToString), 
		new Promise(rejectToError),
	])).rejects.toThrow(testError);
});

test('Test static race with [<mix of promises and non-promises>] (1):\
 return first non-promise', () => {
	return expect(Promise.race([
		1,
		new Promise(resolveToString),
		true,
		new Promise(rejectToError),
	])).resolves.toBe(1);
});

test('Test static race with [<mix of promises and non-promises>] (2):\
 return first non-promise', () => {
	return expect(Promise.race([
		new Promise(resolveToString),
		1,
		true,
		new Promise(rejectToError),
	])).resolves.toBe(1);
});

test('Test static race with [<promises that resolves>]:\
 return first promise that resolves', () => {
 	const quickPromise = new Promise ( (resolve, reject) => {
 		setTimeout(()=>resolve('quick'), 0);
 	});
 	const slowPromise = new Promise ( (resolve, reject) => {
 		setTimeout(()=>resolve('slow'), 50);
 	});
	return expect(Promise.race([slowPromise, quickPromise]))
	.resolves.toBe('quick');
});

test('Test static race with [<promises with first one rejects>]:\
 return rejected one', () => {
 	const quickPromise = new Promise ( (resolve, reject) => {
 		setTimeout(()=>reject('reject'), 0);
 	});
 	const slowPromise = new Promise ( (resolve, reject) => {
 		setTimeout(()=>resolve('resolve'), 50);
 	}); 	
	return expect(Promise.race([slowPromise, quickPromise]))
	.rejects.toThrow('reject');
});

test('Test static promisify: callback return error', () => {
	function fnToWrap (input, cb) {
		cb(testError);
	}
	const wrapped = Promise.promisify(fnToWrap);
	return expect(wrapped()).rejects.toBe(testError);
});

test('Test static promisify: callback return value', () => {
	function fnToWrap (input, cb) {
		cb(null, input);
	}
	const wrapped = Promise.promisify(fnToWrap);
	return expect(wrapped(testString)).resolves.toBe(testString);
});

test('Test static promisify: callback that throws', () => {
	function fnToWrap (input, cb) {
		throw Error(testError);
	}
	const wrapped = Promise.promisify(fnToWrap);
	return expect(wrapped()).rejects.toThrow(testError);
});

test('Test static promisify: callback multiple args', () => {
	function fnToWrap (in1, in2, cb) {
		cb(null, in1+in2);
	}
	const wrapped = Promise.promisify(fnToWrap);
	return expect(wrapped(testString, testError))
	.resolves.toBe(testString+testError);
});


