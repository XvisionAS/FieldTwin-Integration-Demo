
const express       = require('express')

const router        = express.Router()

const computeCost = (metaDatas, baseName) => {
  const add = (vendorId, name, cost, description, costPerLength, length) => {
    if (cost) {
      let quantity = 1
      if (costPerLength) {
        quantity *= length
      }
      ret.push({
        number:vendorId,
        item:name,
        cost:cost,
        description:description,
        quantity:quantity
      })
    }
  }

  let ret = []
  if (Array.isArray(metaDatas)) {
    metaDatas.forEach(
      (meta) => {
        if (meta.value) {
          let actualBaseName = baseName
          if (!actualBaseName) {
            actualBaseName = meta.fromName ? `${meta.fromName} (${meta.fromTypeName}):` : ''
          }
          if (meta.type === 'boolean') {
            if (meta.value === 'true') {
              add(meta.vendorId, `${actualBaseName}${meta.name}`, meta.cost, '', meta.costPerLength || false, meta.length || 0)
            }
          } else if (meta.type === 'choices') {
            if (Array.isArray(meta.value)) {
              meta.value.forEach(
                value => add(value.vendorId, `${actualBaseName}${value.name}`, value.cost, meta.name, meta.costPerLength || false, meta.length || 0)
              )
            } else {
              add(meta.value.vendorId, `${actualBaseName}${meta.value.name}`, meta.value.cost, meta.name, meta.costPerLength || false, meta.length || 0)
            }
          } else if((meta.type === 'numerical' || meta.type === 'slider') && meta.cost > 0) {
            add(meta.vendorId, `${actualBaseName}${meta.name}`, meta.cost || 0, '', meta.costPerLength || false, meta.length || 0)
          } else if ( meta.type === 'asset' && meta.value && meta.value.id && meta.value.metaDataValue) {
            ret = ret.concat(
              computeCost(meta.value.metaDataValue, `${actualBaseName}${meta.name}:`)
            )
          }
        }
      }
    )
  }
  return ret
}

router.post('/',
  function(req, res, next) {
    const metaDatas = req.body
    const ret       = {}
    const models    = ['stagedAssets', 'connections']
    const options   = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    const date      = (new Date()).toLocaleString('US-us', options)

    models.forEach(
      sub => {
        const items = metaDatas[sub]
        ret[sub] = {}
        for (const key in items) {
          ret[sub][key] = {
            entries:computeCost(items[key]),
            stateText:`Computed on ${date}`,
            stateType:'success'
          }
        }
      }
    )
    return res.json(ret)
  }
)

module.exports = router
