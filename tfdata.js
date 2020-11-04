const util = require('./util')
const _ = require('lodash')
const Table = require('cli-table3')
const moment = require('moment')


const groupBy = (xs, key) => {
  return xs.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x)
    return rv
  }, {})
}

class TFdata {
  constructor(scopeType, data, options = {}) {
    this.scopeType = scopeType
    if (scopeType === 'timeless') {
      this.data = data
      return this
    }

    this.data = data.map((src) => {
      const result = Object.assign({}, src)
      result.seen = new Date(result.seen)
      result.ed = result.ed ? new Date(result.ed) : undefined
      return result
    })

    this.isTTM = options.isTTM || false

    return this
  }

  static initFromRaw(obj, formula = null) {
    if (!obj._type) {
      throw new Error('Input data is invalid TFdata (no property _type)')
    }

    if (obj._values == null && obj.value == null) {
      throw new Error('Input data is invalid TFdata (no property _values or value)')
    }

    const options = {}
    const type = obj._type
    if (type === 'timeless') {
      return new TFdata(type, obj.value)
    }

    if (formula != null) {
      if (formula.tags.indexOf('ttm') > -1) {
        options.isTTM = true
      }
    }

    return new TFdata(type, obj._values, options)
  }

  isTimeless() {
    return this.scopeType === 'timeless'
  }

  isEmpty() {
    if (this.isTimeless()) {
      return false
    }
    return this.data.length === 0
  }

  getValue() {
    if (this.isTimeless()) {
      return this.data
    }

    if (this.isEmpty()) {
      return null
    }
    if (this.data.length === 0) {
      return null
    }

    return this.data.slice(-1)[0].v
  }

  getSeens() {
    if (this.isTimeless() || this.isEmpty()) {
      return []
    }

    return this.data.map(datum => datum.seen)
  }

  getValues() {
    if (this.isTimeless()) {
      return [this.data]
    }
    return this.data || []
  }

  getRawValue() {
    return this.data
  }

  getLastValueBefore(date) {
    return this.getLastValueBeforeDate(date)
  }

  getLastValueBeforeDate(date) {
    if (this.isTimeless()) {
      return this.data
    }

    const filtered = this.data.filter(unit => unit.seen < date)
    return filtered.slice(-1)[0]
  }

  getValueForDate(date) {
    if (this.isTimeless()) {
      return this.data
    }

    const filtered = this.data.filter(unit => unit.seen <= date)
    if (filtered.length === 0) return null
    return _.last(filtered)
  }


  getLastValueBeforeKey(key) {
    const date = util.scopeKeyToDate(key)
    return this.getLastValueBeforeDate(date)
  }

  getFirstValueForFiscalKey(fk) {
    if (this.isTimeless()) {
      return this.data
    }

    const filtered = this.data.filter(unit => unit.fk === fk)
    if (filtered.length === 0) return null
    return filtered[0]
  }

  getValueForFiscalKey(fk, { fiscalOrder = 'last' } = {}) {
    if (this.isTimeless()) {
      return this.data
    }

    const filtered = this.data.filter(unit => unit.fk === fk)
    if (filtered.length === 0) return null
    // get early value right after seen not latest
    if (fiscalOrder === 'first') {
      let value = _.first(filtered)
      // workaround; fixing first null value
      if (value && value.v === null) {
        value = _.nth(filtered, 1) || value
      }
      return value
    }
    return _.last(filtered)
  }

  getValuesForCalendarKey(ck) {
    if (this.isTimeless()) {
      return this.data
    }

    const keyType = util.scopeKeyType(ck)

    const filtered = this.data.map((datum) => {
      datum.ck = util.dateToNormalizeScopeKey(datum.seen, keyType)
      return datum
    }).filter(datum => datum.ck === ck)
    return filtered
  }

  getValueForCalendarKey(ck) {
    if (this.isTimeless()) {
      return this.data
    }
    const filtered = this.getValuesForCalendarKey(ck)
    if (filtered.length === 0) return null

    return _.last(filtered)
  }

  getFiscalKeys() {
    return this.data.map(datum => datum.fk).filter(key => key != null)
  }

  getCalendarKeys(scope = this.scopeType) {
    // const cks = new Set()
    // this.data.forEach((datum) => {
    //   const ck = util.dateToScopeKey(datum.seen, scope)
    //   if (ck) {
    //     cks.add(ck)
    //   }
    // })
    const first = _.first(this.data)
    const last = _.last(this.data)
    if (first == null && last == null) {
      return []
    }

    const firstKey = util.dateToScopeKey(first.seen, scope)
    const lastKey = util.dateToScopeKey(last.seen, scope)
    return util.keysInRange(firstKey, lastKey)
  }


  /**
   * Convert TFdata to a Key Date Map
   * @param  {String} scopeType - see config.available_scopes
   * @param  {String} mode      - to use calendar year or fiscal year
   * @param  {Object} options
   * @param  {Boolean} options.preferFirst - use the first occurence if multiple found
   * @param  {Boolean} options.lean - return plain Number or Object with all information
   * @param  {Boolean} options.forwardFill - forward fill data
   * @param  {Date} options.fillToDate
   * @return {Object}
   */
  toKeyValue(scopeType = this.scopeType, mode = 'calendar', _options) {
    const kv = {}
    if (this.isTimeless()) {
      const key = util.dateToScopeKey(new Date(), scopeType)
      kv[key] = this.data
      return kv
    }

    const options = Object.assign({}, {
      preferFirst: false,
      lean: true,
      forwardFill: false
    }, _options)

    let dataWithGroup = []
    switch (mode) {
      case 'calendar':
        dataWithGroup = this.data.map((datum) => {
          const group = util.dateToNormalizeScopeKey(datum.seen, scopeType)
          return { ...datum, group }
        })
        break;
      case 'fiscal':
        dataWithGroup = this.data.map((datum) => {
          const group = util.convertKey(datum.fk, scopeType)
          return { ...datum, group }
        })
        break;
      default:
        throw new Error(`Unsupported mode (${mode})`)
    }
    const groupByKey = groupBy(dataWithGroup, 'group')


    // let groupByFn = null
    // switch (mode) {
    //   case 'calendar':
    //     groupByFn = (datum, _scopeType) => {
    //       return util.dateToNormalizeScopeKey(datum.seen, _scopeType)
    //     }
    //     break;
    //   case 'fiscal':
    //     groupByFn = (datum, _scopeType) => {
    //       return util.convertKey(datum.fk, _scopeType)
    //     }
    //     break;
    //   default:
    //     throw new Error(`Unsupported mode (${mode})`)
    // }
    // const groupByKey = _.groupBy(this.data, (datum) => {
    //   const groupByresult = groupByFn(datum, scopeType)
    //   return groupByresult
    // })

    const nonNullKeys = Object.keys(groupByKey).filter(datum => datum !== 'null')
    const keys = Array.from(new Set(nonNullKeys.sort()))
    const minKey = keys[0]

    const maxKey = (() => {
      let key = keys[keys.length - 1]
      if (options.fillToDate instanceof Date) {
        key = util.dateToScopeKey(options.fillToDate, scopeType)
      }
      if (key < minKey) {
        key = minKey
      }
      return key
    })()

    if (minKey == null || maxKey == null || minKey == 'null' || maxKey == 'null') {
      return {}
    }
    // bottleneck potential
    const filledKeys = util.keysInRange(minKey, maxKey)
    let lastValue = null
    filledKeys.forEach((key) => {
      if (key === 'undefined' || key === 'null') return
      let values = groupByKey[key]
      let targetValue = null
      if (values != null) {
        values = values.filter(datum => datum.v !== null)
        if (values.length !== 0) {
          targetValue = options.preferFirst ? _.first(values) : _.last(values)
        }
      }

      if (targetValue == null && options.forwardFill) {
        targetValue = lastValue
      }

      if (targetValue == null) {
        kv[key] = null
      } else {
        kv[key] = options.lean ? targetValue.v : targetValue
        lastValue = targetValue
      }
    })
    return kv
  }

  groupByScope(scopeType = this.scopeType, mode = 'calendar') {
    if (this.isTimeless()) {
      const key = util.dateToScopeKey(new Date(), scopeType)
      kv[key] = this.data
      return kv
    }

    let dataWithGroup = []
    switch (mode) {
      case 'calendar':
        dataWithGroup = this.data.map((datum) => {
          const group = util.dateToNormalizeScopeKey(datum.seen, scopeType)
          return { ...datum, group }
        })
        break;
      case 'fiscal':
        dataWithGroup = this.data.map((datum) => {
          const group = util.convertKey(datum.fk, scopeType)
          return { ...datum, group }
        })
        break;
      default:
        throw new Error(`Unsupported mode (${mode})`)
    }
    const groupByKey = groupBy(dataWithGroup, 'group')
    return groupByKey
  }


  static groupToKeyValue(groupResult, { seen, maxKey }, _options) {
    const kv = {}
    const options = Object.assign({}, {
      preferFirst: false,
      lean: true,
      forwardFill: false
    }, _options)
    const nonNullKeys = Object.keys(groupResult).filter(datum => datum !== 'null')
    const keys = Array.from(new Set(nonNullKeys.sort()))
    const minKey = keys[0]

    // const maxKey = (() => {
    //   let key = keys[keys.length - 1]
    //   if (options.fillToDate instanceof Date) {
    //     key = util.dateToScopeKey(options.fillToDate, scopeType)
    //   }
    //   if (key < minKey) {
    //     key = minKey
    //   }
    //   return key
    // })()

    if (minKey == null || maxKey == null || minKey == 'null' || maxKey == 'null') {
      return {}
    }

    // bottleneck potential
    const filledKeys = util.keysInRange(minKey, maxKey)
    let lastValue = null
    filledKeys.forEach((key) => {
      if (key === 'undefined' || key === 'null') return
      let values = groupResult[key]
      let targetValue = null
      if (values != null) {
        values = values.filter(datum => datum.v !== null && datum.seen <= seen)
        if (values.length !== 0) {
          targetValue = options.preferFirst ? _.first(values) : _.last(values)
        }
      }

      if (targetValue == null && options.forwardFill) {
        targetValue = lastValue
      }

      if (targetValue == null) {
        kv[key] = null
      } else {
        kv[key] = options.lean ? targetValue.v : targetValue
        lastValue = targetValue
      }
    })
    return kv
  }


  /**
   * Calculate the number of periods the array
   * have been trending
   * also count if in trend and value does not change
   *
   * @static
   * @param {[Number]} array - ascending array, newest last
   * @returns 0, 1, -1
   * @memberof TFdata
   */
  static trendCount(array) {
    if (array.length <= 1) return 0

    const nullIndex = array.lastIndexOf(null)
    let cleanedArray = array
    if (nullIndex >= 0) {
      cleanedArray = array.slice(nullIndex + 1)
    }

    let trend = null
    let loopCount = 0
    for (let i = cleanedArray.length - 1; i > 0; i -= 1) {
      loopCount += 1
      if (cleanedArray[i - 1] < cleanedArray[i]) {
        if (trend == null) {
          // use loopCount so that we also count the unchange data at the
          // end of the array. for example [1, 2, 3, 3, 3]
          // we should count 3, 3, 3 portion as a part of the trend
          trend = loopCount
          continue
        } else if (trend <= 0) {
          break
        }
        trend += 1
      } else if (cleanedArray[i - 1] > cleanedArray[i]) {
        if (trend == null) {
          trend = -loopCount
          continue
        } else if (trend >= 0) {
          break
        }
        trend -= 1
      } else { // equal
        if (trend < 0) {
          trend -= 1
        } else if (trend > 0) {
          trend += 1
        }
        // continue until a trend is found
      }
    }

    return trend || 0
  }

  /**
   * Calculate the number of periods the array
   * have been trending, does not count if value
   * does not change
   *
   * @static
   * @param {[Number]} array
   * @returns 0, 1, -1
   * @memberof TFdata
   */
  static trendCountStrict(array) {
    if (array.length <= 1) return 0

    const nullIndex = array.lastIndexOf(null)
    let cleanedArray = array
    if (nullIndex >= 0) {
      cleanedArray = array.slice(nullIndex + 1)
    }

    let trend = null
    for (let i = cleanedArray.length - 1; i > 0; i -= 1) {
      if (cleanedArray[i - 1] < cleanedArray[i]) {
        if (trend == null) {
          trend = 1
          continue
        }
        if (trend > 0) {
          trend += 1
          continue
        }
        break
      } else if (cleanedArray[i - 1] > cleanedArray[i]) {
        if (trend == null) {
          trend = -1
          continue
        }
        if (trend < 0) {
          trend -= 1
          continue
        }
        break
      } else {
        if (trend == null) {
          trend = 0
          break;
        }
        break;
      }
    }

    return trend || 0
  }


  /**
   * @return {Object} Key Value Map of number of years the following
   *                  key has a trend
   *                  negative -> decreasing
   *                  positive -> increasing
   *                  0        -> no trend
   */
  yearlyTrendingPeriods() {
    if (this.data == null) {
      return null
    }
    if (this.isTimeless()) {
      throw new Error('Cannot find yoyTrendingPeriod for timeless dataType')
    }
    if (this.scopeType !== 'annually') {
      throw new Error(`\
        [TFdata] Warning: yearlyTrendingPeriods only works with annually,\
 recieved ${this.scopeType}\
      `)
    }

    const yearlyResult = {}
    const yearlyValues = this.toKeyValue('annually', 'fiscal')
    const firstValue = this.data.filter(datum => datum.fk != null)[0]
    if (firstValue == null) {
      return null
    }

    const firstFiscal = firstValue.fk
    this.data.forEach((value) => {
      const currentCalendarKey = util.dateToScopeKey(value.seen, 'quarterly')
      const currentFiscal = value.fk
      if (currentFiscal == null || firstFiscal == null) {
        yearlyResult[currentCalendarKey] = null
        return null
      }
      const fiscalRange = util.keysInRange(firstFiscal, currentFiscal)
      const values = fiscalRange.map(q => yearlyValues[q])
      yearlyResult[currentCalendarKey] = TFdata.trendCount(values)
      return null
    })

    // forward fill
    const result = Object.keys(yearlyResult).reduce((result, key, idx, array) => {
      const value = yearlyResult[key]
      result[key] = value
      result[util.addScopeKey(key, 1)] = value
      result[util.addScopeKey(key, 2)] = value
      result[util.addScopeKey(key, 3)] = value
      return result
    }, {})

    return result
  }

  yoyTrendingPeriods() {
    // console.time('yoyTrendingPeriods')
    if (this.data == null) {
      return null
    }
    if (this.isTimeless()) {
      throw new Error('Cannot find yoyTrendingPeriod for timeless dataType')
    }
    const result = {}
    const quarterValues = this.toKeyValue('quarterly', 'fiscal')
    const firstValue = this.data.filter(datum => datum.fk != null)[0]
    if (firstValue == null) {
      return null
    }

    const firstFiscal = firstValue.fk
    this.data.forEach((value) => {
      const currentCalendarKey = util.dateToScopeKey(value.seen, 'quarterly')
      const currentFiscal = value.fk
      if (currentFiscal == null || firstFiscal == null) {
        result[currentCalendarKey] = null
        return
      }
      const currentQuarter = currentFiscal[currentFiscal.length - 1]

      const fiscalRange = util.keysInRange(firstFiscal, currentFiscal)
      const matchingQKeys = fiscalRange.filter(q => q.match(new RegExp(`Q${currentQuarter}`)))

      const values = matchingQKeys.map(q => quarterValues[q])
      result[currentCalendarKey] = TFdata.trendCount(values)
    })
    // console.timeEnd('yoyTrendingPeriods')
    return result
  }

  qoqTrendingPeriods() {
    // console.time('qoqTrendingPeriods')
    if (this.data == null) {
      return null
    }
    if (this.isTimeless()) {
      throw new Error('Cannot find yoyTrendingPeriod for timeless dataType')
    }
    const result = {}
    const quarterValues = this.toKeyValue('quarterly', 'fiscal')
    const firstValue = this.data.filter(datum => datum.fk != null)[0]
    if (firstValue == null) {
      return null
    }
    const firstFiscal = firstValue.fk
    this.data.forEach((value) => {
      const currentCalendarKey = util.dateToScopeKey(value.seen, 'quarterly')
      const currentFiscal = value.fk
      if (currentFiscal == null || firstFiscal == null) {
        result[currentCalendarKey] = null
        return null
      }

      const fiscalRange = util.keysInRange(firstFiscal, currentFiscal)
      const values = fiscalRange.map(q => quarterValues[q])
      result[currentCalendarKey] = TFdata.trendCount(values)
      return null
    })
    // console.timeEnd('qoqTrendingPeriods')
    return result
  }

  lastQGrowth(method) {
    let subtractQ = null
    if (method === 'qoq') {
      subtractQ = 1
    } else if (method === 'yoy') {
      subtractQ = 4
    } else {
      throw new Error(`Unsupported lastQGrowth method ${method}, only support ['yoy', 'qoq']`)
    }

    if (this.scopeType !== 'quarterly') {
      return null
    }

    const result = {}
    const calendarKeys = this.getCalendarKeys('quarterly').reverse()
    // console.time('after-get-calendar-key')
    // console.log('count ', calendarKeys.length)
    const jdata = new TFdata('quarterly', this.data)
    const groupResult = jdata.groupByScope('quarterly', 'fiscal')
    const filteredData = [...this.data]
    calendarKeys.forEach((ck) => {
      const seen = util.scopeKeyToDate(ck)
      // get current fk for calendarKey fiscalKey
      _.remove(filteredData, datum => datum.seen > seen)
      const maxKey = filteredData[filteredData.length - 1].fk
      const kv = TFdata.groupToKeyValue(groupResult, {
        maxKey,
        seen
      })

      const quarters = Object.keys(kv).sort()

      const lastQ = quarters[quarters.length - 1]
      const lastYoYQ = util.subtractScopeKey(lastQ, subtractQ)

      const endingValue = kv[lastQ]
      const beginningValue = kv[lastYoYQ]

      if (endingValue == null || beginningValue == null) {
        result[ck] = null
        return
      }

      // hack to allow dividend growth calculation (dividend is negative)
      const isSameSign = (endingValue < 0 && beginningValue < 0) ||
        (endingValue > 0 && beginningValue > 0)

      if (!isSameSign && beginningValue <= 0) {
        result[ck] = null
        return
      }

      const growth = (endingValue - beginningValue) / beginningValue
      result[ck] = growth
    })
    // console.timeEnd('after-get-calendar-key')
    return result
  }

  ttmCagr(numYear) {
    if (!this.isTTM) {
      throw new Error('expected ttmCagr to be called on TTM')
    }
    // console.time('ttmCagr')
    const result = {}
    const calendarKeys = this.getCalendarKeys('quarterly').reverse()
    const jdata = new TFdata('quarterly', this.data)
    const groupResult = jdata.groupByScope('quarterly', 'fiscal')
    const filteredData = [...this.data]
    calendarKeys.forEach((ck) => {
      const seen = util.scopeKeyToDate(ck)
      // const data = this.data.filter(datum => datum.seen <= seen)
      // const jdata = new TFdata('quarterly', data)
      // const kv = jdata.toKeyValue('quarterly', 'fiscal')
      _.remove(filteredData, datum => datum.seen > seen)
      const maxKey = filteredData[filteredData.length - 1].fk

      const kv = TFdata.groupToKeyValue(groupResult, {
        maxKey,
        seen
      })

      const quarters = Object.keys(kv)
      const lastQuarter = quarters[quarters.length - 1]
      const beginningQ = util.subtractScopeKey(lastQuarter, numYear * 4)

      const endingValue = kv[lastQuarter]
      const beginningValue = kv[beginningQ]
      if (endingValue == null || beginningValue == null) {
        result[ck] = null
        return
      }

      if (endingValue <= 0 || beginningValue <= 0) {
        result[ck] = null
        return
      }
      const growth = Math.pow(endingValue / beginningValue, 1 / numYear) - 1

      result[ck] = growth
    })
    // console.timeEnd('ttmCagr')
    return result
  }


  /**
   *
   * @param {Integer} numYear
   * @param {Boolean} force - force the method to calculate regardless of the data scopeType
   * @return {Object} - CAGR for each quarterly ck in the data
   */
  quarterlyCagr(numYear, force = false) {
    // console.time('quarterlyCagr')
    if (this.scopeType !== 'annually' && force === false) {
      throw new Error(`expected quarterlyCagr to be called on annually, got ${this.scopeType}`)
    }
    
    const result = {}
    const calendarKeys = this.getCalendarKeys('quarterly').reverse()
    const filteredData = [...this.data]
    const jdata = new TFdata('annually', this.data)
    const groupResult = jdata.groupByScope('annually', 'fiscal')
    calendarKeys.forEach((ck) => {
      const seen = util.scopeKeyToDate(ck)
      _.remove(filteredData, datum => datum.seen > seen)
      const maxKey = util.convertKey(filteredData[filteredData.length - 1].fk, 'annually')

      const kv = TFdata.groupToKeyValue(groupResult, {
        maxKey,
        seen
      })

      const years = Object.keys(kv)
      const lastEndedFiscal = years[years.length - 1]
      const beginningQ = util.subtractScopeKey(lastEndedFiscal, numYear)

      const endingValue = kv[lastEndedFiscal]
      const beginningValue = kv[beginningQ]
      if (endingValue == null || beginningValue == null) {
        result[ck] = null
        return
      }
      if (endingValue <= 0 || beginningValue <= 0) {
        result[ck] = null
        return
      }
      const growth = Math.pow(endingValue / beginningValue, 1 / numYear) - 1

      result[ck] = growth
    })
    // console.timeEnd('quarterlyCagr')
    return result
  }

  toString() {
    if (this.scopeType === 'timeless') {
      return this
    }

    const table = new Table({
      head: ['seen', 'v', 'fiscal']
    })

    this.data.forEach((datum) => {
      const date = datum.seen.toISOString().split('T')[0]
      let value = datum.v
      if (value == null) {
        value = '-'
      }
      table.push([date, value, datum.fk || '-'])
    })
    return table.toString()
  }

  inspect() {
    return this.toString()
  }

  daysTrailingValues(days) {
    const last = _.last(this.data)
    if (last == null) {
      return []
    }
    const lastDate = last.seen
    const limitDate = moment(lastDate).subtract(days, 'days').toDate()
    const periodValues = this.data.filter(d => d.seen >= limitDate)
    return periodValues
  }

  ttm() {
    const hash = this.toKeyValue(this.scopeType, 'fiscal')
    const keys = Object.keys(hash).sort()
    if (keys.length === 0) {
      return null
    }
    const maxKey = _.last(keys)
    const startKey = util.subtractScopeKey(maxKey, 3)
    const targetKeys = util.keysInRange(startKey, maxKey)

    const values = targetKeys.map(key => hash[key] || 0)
    return _.sum(values)
  }

  getLastFiscalKey() {
    const values = this.getValues()
    if (values.length === 0) {
      return null
    }

    return _.last(values).fk
  }

  toRaw() {
    if (this.isTimeless()) {
      return {
        _type: 'timeless',
        _values: this.data
      }
    }

    return {
      _type: this.scopeType,
      _values: this.getValues()
    }
  }

  toFiscalYear() {
    if (this.scopeType !== 'quarterly') {
      throw new TypeError('toAnnually() only support quarterly data')
    }
    const values = this.getValues()
    const validValues = values
      .filter(datum => datum.fk && datum.fk.split('Q')[1] === '4')
      .map(datum => ({
        fk: datum.fk.split('Q')[0],
        v: datum.v,
        seen: datum.seen,
        ed: datum.ed
      }))

    return new TFdata('annually', validValues)
  }
}

module.exports = TFdata
