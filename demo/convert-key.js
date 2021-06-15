const TFdata = require('../tfdata')
const util = require('../util')


const querterKeys = util.keysInRange('1970Q1', '4000Q4')
console.log(querterKeys)


console.time('convertKey-quarter')
console.log('converted', querterKeys.map(key => util.convertKey(key, 'quarterly', 'quarterly')))
console.timeEnd('convertKey-quarter')

console.time('convertKey-annual')
console.log('converted', querterKeys.map(key => util.convertKey(key, 'annually', 'quarterly')))
console.timeEnd('convertKey-annual')

// const data = {
//   _type: 'monthly',
//   _values: [
//     { v: 1, seen: new Date('2015-01-30') },
//     { v: 2, seen: new Date('2015-02-30') },
//     { v: 3, seen: new Date('2015-03-30') },
//     { v: 1, seen: new Date('2015-04-30') },
//     { v: 2, seen: new Date('2015-05-30') },
//     { v: 3, seen: new Date('2015-06-30') },
//     { v: 1, seen: new Date('2015-07-30') },
//     { v: 2, seen: new Date('2015-08-30') },
//     { v: 3, seen: new Date('2015-09-30') },
//     { v: 1, seen: new Date('2015-10-30') },
//     { v: 2, seen: new Date('2015-11-30') },
//     { v: 3, seen: new Date('2015-12-30') },
//     { v: 1, seen: new Date('2016-01-30') },
//     { v: 2, seen: new Date('2016-02-29') },
//     { v: 3, seen: new Date('2016-03-30') },
//     { v: 1, seen: new Date('2016-04-30') },
//     { v: 2, seen: new Date('2016-05-30') },
//     { v: 3, seen: new Date('2016-06-30') },
//     { v: 1, seen: new Date('2016-07-30') },
//     { v: 2, seen: new Date('2016-08-30') },
//     { v: 3, seen: new Date('2016-09-30') },
//     { v: 3, seen: new Date('2016-10-30') },
//     { v: 3, seen: new Date('2016-11-30') },
//     { v: 3, seen: new Date('2016-12-30') }
//   ]
// }
// const tfdata = new TFdata(data._type, data._values)
// const obj = tfdata.toKeyValue()

// console.log(obj)

// console.log('do it secondtime')
// tfdata.toKeyValue()

// console.log(util.keysInRange('2012', '2016'))
// console.log(util.keysInRange('2010', '2020'))