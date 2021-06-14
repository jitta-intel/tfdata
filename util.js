/* eslint-disable */
const indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

const _last = require('lodash.last')
const _get = require('lodash.get')
const moment = require('moment')
const debug = require('debug')('tfdata:util')


const MONTH_RE = /^(\d{4})-(1[012]|0?[1-9])$/g;
const QUARTER_RE = /^(\d{4})[Q]([1-4]{1})$/g;
const FISCAL_RE = /^(\d{4})$/g;
const DAY_RE = /^(\d{4})-(\d{1}\d{0,1})-(\d{1}\d{0,1})$/g;
const SCOPE_TO_SUFFIX = {
  annually: 'year',
  quarterly: 'quarter',
  monthly: 'month',
  daily: 'day'
}
const SCOPE_TO_STRING_FORMAT = {
  annually: 'YYYY',
  quarterly: 'YYYY[Q]Q',
  monthly: 'YYYY-M',
  daily: 'YYYY-M-D'
}

const SCOPE_TO_KEY_FORMAT = {
  annually: 'YYYY',
  quarterly: 'YYYY[Q]Q',
  monthly: 'YYYY-MM',
  daily: 'YYYY-MM-DD'
}

const AVAILABLE_SCOPES = [
  'annually',
  'quarterly',
  'monthly',
  'daily',
  'timeless'
]

const START_YEAR = '2000'


const util = {
  keysByScope: {
    annually: [],
    quarterly: [],
    monthly: [],
    daily: []
  },
  /**
   * Set value
   * @param {Object} obj      Object to set value of
   * @param {String} scopeKey Key to set
   * @param {Any} val      Value of the Key
   * @param {Object} options  =             {} [description]
   */
  DATEKEY_FORMAT: 'YYYY-M-D',
  setValue(obj, scope, fiscalKey, calendarKey, seen, val, meta) {
    var target;
    if (meta == null) {
      meta = {};
    }
    scope = util.scopeKeyType(calendarKey);
    if (scope === 'timeless') {
      obj.value = val;
      obj._type = 'timeless';
    } else {
      if (obj._values == null) {
        obj._values = [];
      }
      obj._type = scope;
      target = obj._values.find(function(val) {
        return val.ck === calendarKey;
      });
      if (target == null) {
        target = {};
        obj._values.push(target);
      }
      target.v = val;
      target.ck = calendarKey;
      target.fk = fiscalKey;
      target.seen = seen;
      if ((meta != null ? meta.ed : void 0) != null) {
        target.ed = meta.ed;
        delete meta.ed;
      }
      target.meta = meta;
    }
    return obj;
  },
  _getValue(obj, path, scopeKey, condition) {
    let cache, keyType, target
    keyType = util.scopeKeyType(scopeKey)
    if (path != null) {
      cache = _get(obj, path) || null
    } else {
      cache = obj;
    }
    if (cache == null) {
      return null;
    }
    if (cache._type != null) {
      if (cache._type === 'timeless') {
        return cache.value;
      } else {
        target = cache != null ? cache._values.find(condition) : void 0;
        if (target != null) {
          return target.v;
        }
        return null;
      }
    } else {
      return cache;
    }
  },
  getFiscalValue(obj, path, fiscalKey) {
    return util._getValue(obj, path, fiscalKey, function(val) {
      return val.fk === fiscalKey;
    });
  },
  getCalendarValue(obj, path, calendarKey) {
    let cache, date, ref, values
    date = util.scopeKeyToDate(calendarKey)
    if (path != null) {
      cache = _get(obj, path) || null
    } else {
      cache = obj;
    }
    if (cache == null) {
      return null;
    }
    if (cache._type != null) {
      if (cache._type === 'timeless') {
        return cache.value;
      } else {
        values = cache._values.filter(function(v) {
          return v.seen <= date;
        });
        return (ref = _last(values)) != null ? ref.v : void 0;
      }
    } else {
      return cache;
    }
  },
  addDay(date, i) {
    const result = new Date(date);
    result.setDate(date.getDate() + i);
    return result;
  },
  addMonth(date, i) {
    return moment(date).add(i, 'month').toDate()
  },
  addQuarter(date, i) {
    return moment(date).add(i, 'quarter').toDate()
  },
  addYear(date, i) {
    const result = new Date(date)
    result.setYear(date.getFullYear() + i)
    return result
  },
  subtractDay(date, i) {
    return util.addDay(date, -i);
  },
  subtractMonth(date, i) {
    return util.addMonth(date, -i);
  },
  subtractQuarter(date, i) {
    return util.addQuarter(date, -i);
  },
  subtractYear(date, i) {
    return util.addYear(date, -i);
  },
  addDuration(date, i, scope) {
    switch (scope) {
      case 'annually':
        return util.addYear(date, i);
      case 'quarterly':
        return util.addQuarter(date, i);
      case 'monthly':
        return util.addMonth(date, i);
      case 'daily':
        return util.addDay(date, i);
      default:
        throw new TypeError('Unsupported Scope.');
    }
  },
  getQuarter(date) {
    return Math.ceil((date.getMonth() + 1) / 3);
  },
  subtractDuration(date, i, scope) {
    return util.addDuration(date, -i, scope)
  },
  convertKey(key, toScope) {
    const date = this.scopeKeyToDate(key)
    return this.dateToScopeKey(date, toScope)
  },
  scopeToMomentTimeKey(scope) {
    if (indexOf.call(AVAILABLE_SCOPES, scope) < 0) {
      throw new TypeError("[Util] Illegal formula scope(" + (JSON.stringify(scope)) + ")");
    }
    if (scope === 'timeless') {
      throw new TypeError("[Util] Illegal formula scope(" + scope + ")");
    }
    return SCOPE_TO_SUFFIX[scope]
  },

  stringFormatForScope(scope) {
    if (indexOf.call(AVAILABLE_SCOPES, scope) < 0) {
      throw new TypeError("[Util] Illegal formula scope(" + scope + ")");
    }
    if (scope === 'timeless') {
      throw new TypeError("[Util] Illegal formula scope(" + scope + ")");
    }
    return SCOPE_TO_STRING_FORMAT[scope]
  },

  /**
  * Convert a date to a key period that this date will be first
  * seen. e.g. 2016-07-20 => '2016Q3'
    * @param  {Date} date
    * @param  {String} scopeType Type of key to output
    * @return {String}           key
    */
  dateToScopeKey(date, scopeType) {
    if (date == null) return null
    if (scopeType === 'timeless') {
      return null;
    }
    const timeKey = util.scopeToMomentTimeKey(scopeType);
    const format = util.stringFormatForScope(scopeType);
    return moment.utc(date).endOf(timeKey).startOf('day').format(format);
  },

  dateToNormalizeScopeKey(date, scopeType) {
    if (scopeType === 'timeless') {
      return null;
    }
    const timeKey = util.scopeToMomentTimeKey(scopeType)
    const format = SCOPE_TO_KEY_FORMAT[scopeType]

    return moment.utc(date).endOf(timeKey).startOf('day').format(format)
  },

  normalizeKey(key) {
    if (key.match(MONTH_RE)) {
      if (key.length === 6) { // 2015-1
        return key.replace('-', '-0')
      }
    }
    return key
  },

  scopeKey(date, scopeType) {
    e = new Error()
    console.warn('util.scopeKey is deprecated, use dateToScopeKey instead', e.stack)
    return util.dateToScopeKey(date, scopeType);
  },

  /**
   * Convert key to scopeType
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  scopeKeyType(key) {
    if (key != null) {
      key = key.toString();
      if (key.match(MONTH_RE) != null) {
        return 'monthly';
      } else if (key.match(QUARTER_RE) != null) {
        return 'quarterly';
      } else if (key.match(FISCAL_RE) != null) {
        return 'annually';
      } else if (key.match(DAY_RE) != null) {
        return 'daily';
      } else {
        return null;
      }
    } else {
      return 'timeless';
    }
  },
  scopeKeyToDate(key, scope) {
    let date;
    if (key == null) {
      return null;
    }
    key = key.toString();
    const scopeType = scope || util.scopeKeyType(key)
    switch (scopeType) {
      case 'monthly':
        date = moment.utc(key, 'YYYY-M').endOf('month').startOf('day').toDate();
        break
      case 'quarterly':
        date = moment.utc(key, 'YYYY[Q]Q').endOf('quarter').startOf('day').toDate();
        break
      case 'annually':
        date = moment.utc(key, 'YYYY').endOf('year').startOf('day').toDate();
        break
      case 'daily':
        date = moment.utc(key, 'YYYY-M-D').startOf('day').toDate();
        break
      default:
        throw new TypeError("Unsupported key type (" + key + ")");
    }
    return date;
  },
  addScopeKey (key, i = 1) {
    const type = util.scopeKeyType(key);
    const date = util.scopeKeyToDate(key);
    const result = (function() {
      switch (type) {
        case 'monthly':
          return util.addMonth(date, i);
        case 'quarterly':
          return util.addQuarter(date, i);
        case 'annually':
          return util.addYear(date, i);
        case 'daily':
          return util.addDay(date, i);
      }
    })();
    return util.dateToScopeKey(result, type);
  },
  addNormalizedScopeKey(key, i = 1, scope) {
    if (scope === 'daily') {
      const a = util.scopeKeyToDate(key, 'daily')
      const b = util.addDay(a, i);
      return util.dateToNormalizeScopeKey(b, 'daily')
    }

    const type = scope || util.scopeKeyType(key);
    const date = util.scopeKeyToDate(key, type);
    let result
    switch (type) {
      case 'monthly':
        result = util.addMonth(date, i)
        break
      case 'quarterly':
        result = util.addQuarter(date, i)
        break
      case 'annually':
        result = util.addYear(date, i)
        break
      case 'daily':
        result = util.addDay(date, i);
        break
    }
    const output = util.dateToNormalizeScopeKey(result, type)
    return output
  },
  subtractScopeKey (key, i) {
    if (i == null) {
      i = 1;
    }
    return util.addScopeKey(key, -i);
  },
  scopeToUnit(scope) {
    var unit;
    if (scope === 'annually') {
      unit = 'year';
    } else if (scope === 'quarterly') {
      unit = 'quarter';
    } else if (scope === 'monthly') {
      unit = 'month';
    } else if (scope === 'daily') {
      unit = 'day';
    }
    return unit;
  },
  selectExistsValueFromScope(value, condition) {
    var j, len, scopeList, testScope;
    const scope = condition.scope
    let version = 'current'
    if (condition.nodeId) {
      version = _last(condition.nodeId.split('.'))
    }

    if (value == null) {
      return null;
    }
    scopeList = AVAILABLE_SCOPES
    if (value[scope]) {
      return {
        value: value[scope][version],
        scope: scope
      };
    } else {
      for (j = 0, len = scopeList.length; j < len; j++) {
        testScope = scopeList[j];
        if (value[testScope]) {
          return {
            value: value[testScope][version],
            scope: testScope,
            autoScope: true
          };
        }
      }
    }
  },
  scopeConversionTable: {
    'monthly': {
      'monthly': 1,
      'quarterly': 1 / 3,
      'annually': 1 / 12
    },
    'quarterly': {
      'monthly': 3,
      'quarterly': 1,
      'annually': 1 / 4
    },
    'annually': {
      'monthly': 12,
      'quarterly': 4,
      'annually': 1
    }
  },

  /**
   * Convert from one scope period unit to another
   * e.g. 1 annually -> 4 quarterly -> 12 monthly
   * @param  {Integer} i                 [description]
   * @param  {String} fromType [description]
   * @param  {String} toType   [description]
   * @return {Integer}                   [description]
   */
  convertScopePeriod(i, fromType, toType) {
    var mod;
    util.log("convert type " + fromType + " to type " + toType + " for period " + i);
    if (fromType === toType) {
      return i;
    }
    mod = util.scopeConversionTable[fromType][toType];
    return Math.ceil(i * mod);
  },
  compareKey(a, b) {
    var a_month, a_year, b_month, b_year, ref, ref1;
    if (b == null) {
      return 1;
    }
    if (a == null) {
      return -1;
    }
    if (a === b) {
      return 0;
    }
    if (util.scopeKeyType(a) !== 'monthly') {
      if (a > b) {
        return 1;
      } else {
        return -1;
      }
    } else {
      ref = a.split('-'), a_year = ref[0], a_month = ref[1];
      ref1 = b.split('-'), b_year = ref1[0], b_month = ref1[1];
      if (a_year === b_year) {
        if (a_month > b_month) {
          return 1;
        } else {
          return -1;
        }
      } else {
        if (a_year > b_year) {
          return 1;
        } else {
          return -1;
        }
      }
    }
  },
  log(msg) {
    if ((typeof window !== "undefined" && window !== null)) {
      if ((window.debug != null)) {
        if (window.debug) {
          return debug(msg);
        }
      } else {
        return debug(msg);
      }
    } else if ((debug != null)) {
      return debug(msg);
    }
  },
  sortSeen(a, b) {
    return a.seen - b.seen;
  },
  escapeMongoPath(path) {
    return path.replace(/\./g, '\uff0e');
  },
  validateThrow(source, def) {
    var correctType, dataType, key, type;
    debug(JSON.stringify(source));
    for (key in def) {
      type = def[key];
      if (source[key] != null) {
        dataType = typeof source[key];
        correctType = dataType === type;
        if (!correctType) {
          throw new Error(key + " should be type " + type + ", got " + dataType + ".");
        }
      } else {
        throw new Error(key + " is required.");
      }
    }
    return true;
  },
  wrapFunction(expression) {
    return "(function(){" + expression + "})()";
  },
  generateDates(from, to, scopeType) {
    var currentMoment, dates, momentType;
    momentType = util.scopeToMomentTimeKey(scopeType);
    currentMoment = moment.utc(from).endOf(momentType).startOf('day');
    dates = [];
    while (currentMoment.toDate() < to) {
      dates.push(currentMoment.toDate());
      currentMoment = currentMoment.add(1, momentType).endOf(momentType).startOf('day');
    }
    return dates;
  },
  isMongoose(obj) {
    return obj.constructor.name === 'model' || obj.constructor.name !== 'Object';
  },
  filterAscArray(arr, limitOrPred) {
    var limit, newArr, predicate;
    if (arr.length === 0) {
      return [];
    }
    if (typeof limitOrPred === 'function') {
      predicate = limitOrPred;
    } else {
      limit = limitOrPred;
    }
    newArr = arr.slice(0);
    if (predicate != null) {
      while (newArr.length > 0 && !predicate(newArr[newArr.length - 1])) {
        newArr.pop();
      }
      return newArr;
    } else {
      while (newArr.length > 0 && newArr[newArr.length - 1] > limit) {
        newArr.pop();
      }
      return newArr;
    }
  },
  getLargestKeyWithScopeType(array, scopeType) {
    const correctScopeKeys = array
      .filter(key => key != null)
      .map(key => util.convertKey(key, scopeType))
      .sort()
    return _last(correctScopeKeys)
  },

  // generate from past to now
  getKeysByScope(scope) {
    if (this.keysByScope[scope].length === 0) {
      const startDate = moment(START_YEAR)
      const keys = []
      let curentdateMom = moment(startDate)
      const endDateMom = moment()

      const period = SCOPE_TO_SUFFIX[scope]
      const format = SCOPE_TO_KEY_FORMAT[scope]
      while (!curentdateMom.isAfter(endDateMom)) {
        keys.push(curentdateMom.format(format))
        curentdateMom.add(1, period)
      }
      this.keysByScope[scope] = keys
    }
    return this.keysByScope[scope]
  },

  // potential bottleneck function (probably impossible to optimize)
  keysInRange(startKey, endKey) {
    const safeStartKey = util.normalizeKey(startKey)
    const safeEndKey = util.normalizeKey(endKey)
    const scope = util.scopeKeyType(safeStartKey)
    // const scope = 'quarterly'
    if (!util.isSameKeyType(safeStartKey, safeEndKey)) {
      throw new Error(`Mismatch key type: ${startKey} and ${endKey}`)
    }

    if (safeStartKey === safeEndKey) {
      return [safeStartKey]
    }
    if (safeStartKey >= safeEndKey) {
      return []
    }

    let keys = this.getKeysByScope(scope)
    keys = keys.filter(key => key >= safeStartKey && key <= safeEndKey)
    return keys
  },

  isSameKeyType(a, b) {
    const aType = util.scopeKeyType(a)
    const bType = util.scopeKeyType(b)
    return aType === bType
  },

  /**
   *
   * @param {*} obj
   * @param {*} endDate
   * @param {*} options
   * @param {*} options.maxLookbackPeriod
   */
  forwardFillObject(obj, endDate, options = {}) {
    const filledObject = Object.assign({}, obj)
    let lastKey = _last(Object.keys(filledObject).sort())
    if (lastKey == null) {
      return obj
    }
    const lastValue = obj[lastKey]

    const scopeType = util.scopeKeyType(lastKey)
    const endKey = util.dateToNormalizeScopeKey(endDate, scopeType)

    lastKey = util.addNormalizedScopeKey(lastKey, 1)
    if (options.maxLookbackPeriod != null) {
      const minLastKey = util.subtractScopeKey(endKey, options.maxLookbackPeriod)
      const lastKeyLessThanMin = util.compareKey(minLastKey, lastKey) === 1
      if (lastKeyLessThanMin) {
        return filledObject
      }
    }

    while (lastKey <= endKey) {
      filledObject[lastKey] = lastValue
      lastKey = util.addNormalizedScopeKey(lastKey, 1)
    }

    return filledObject
  },

  forwardFill(array, options = {
    minSeen: new Date('2002-01-01'),
    fillToDate: null
  }) {
    const filledArray = []
    const map = {}
    const seens = []

    array.forEach((v) => {
      map[v.seen] = v
      seens.push(v.seen)
    })

    seens.sort((a, b) => a - b)

    let firstDate = null
    if (seens[0] < options.minSeen) {
      firstDate = options.minSeen
      map[firstDate] = map[seens[0]]
    } else {
      firstDate = seens[0]
    }

    const lastDate = seens[seens.length - 1]
    if (options.fillToDate == null) {
      options.fillToDate = lastDate
    }

    const currentDate = new Date(firstDate)
    let lastSeenData = map[firstDate]

    while (currentDate <= options.fillToDate) {
      let data = map[currentDate]
      if (data == null) {
        data = Object.assign({}, lastSeenData)
        data._t = new Date(lastSeenData.seen)
        data.seen = new Date(currentDate)
      } else {
        lastSeenData = data
      }

      const currentData = {
        v: data.v,
        _t: data._t,
        seen: new Date(currentDate)
      }

      filledArray.push(currentData)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return filledArray
  },

  // flattenObject(source, joinString = '_') {
  //   function flatten (name, obj, target, joinString) {
  //     Object.keys(obj).forEach((key) => {
  //       const value = obj[key]
  //       const nextName = name == null ? key : `${name}${joinString}${key}`
  //       if (_.isPlainObject(value)) {
  //         return flatten(nextName, value, target, joinString)
  //       }
  //       target[nextName] = value
  //       return null
  //     })
  //   }
  //   const target = {}
  //   flatten(null, source, target, joinString)
  //   return target
  // }

  safeJSONStringify(obj) {
    return JSON.stringify(obj, (key, value) => {
      if (value === Infinity) return "Infinity"
      if (value === -Infinity) return "-Infinity"
      if (value !== value) return "NaN"
      return value
    }, 2)
  },

  /**
   *
   * @param {Date} a - the newer date
   * @param {Date} b - the older date
   * @return {Number} the difference in month of two date
   */
  differenceMonth(a, b) {
    const yearOnlyDiff = a.getFullYear() - b.getFullYear()
    const monthOnlyDiff = a.getMonth() - b.getMonth()
    const monthDiff = (yearOnlyDiff * 12) + monthOnlyDiff
    return monthDiff
  },
}


module.exports = util
