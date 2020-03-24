#!/usr/bin/env node


/*
This sample code copy meta data definitions from one item to the other.

Source and Target can have different types ( connection => asset for example )

*/

const fetch = require('node-fetch')
const yargs = require('yargs')

const argv  = yargs.option('backend', {
  description:'Source Backend address https://backend.qa.fieldap.com'
}).option('token', {
  description:'Source API token'
}).option('target-backend', {
  description:'Target Backend address https://backend.qa.fieldap.com, default to `target-backend` if not specified'
}).option('target-token', {
  description:'Target API token, default to `source-token` if not specified'
}).option('source-type', {
  description:'Source type',
  choices:[`well`, `layer`, `connection`, `asset`, `connector`]
}).option('source-id', {
  description:'Source Id'
}).option('target-type', {
  description:'Target type, default to `source-type` if not specified',
  choices:[`well`, `layer`, `connection`, `asset`, `connector`]
}).option('target-id', {
  description:'Target Id'  
}).demandOption(
  'backend'
).demandOption(
  'token'
).demandOption(
  'source-type'
).demandOption(
  'source-id'
).demandOption(
  'target-id'
).demandOption(
  'token'
).help('help').argv


/*
  Retrieve account information, we will use that to find out 
  if we need to use vendorId or vendorAttribute 
*/
const getAccount = async (options) => {
  const { backend, token } = options
  const url = new URL('/API/v1.4/', backend)
  const data = await fetch(url.href, {
    headers:{
      token:token
    }
  })

  return await data.json()
}

/*
  Retrieve all meta data definition for a given type and id
  See : https://apidocs.fieldap.com/#api-MetadataDefinitions-GetMetaDataDefinitions
*/
const getMetaDataDefinitions = async (options, relateToType, relateToId) => {
  const { backend, token } = options
  const url = new URL('/API/v1.4/metadatadefinitions', backend)
  
  url.searchParams.append('relateToType', relateToType)
  url.searchParams.append('relateToId',   `${relateToId}`)
  
  const data = await fetch(url.href, {
    headers:{
      token:token
    }
  })
  return await data.json()
}


/*
  Create a new definition
  See : https://apidocs.fieldap.com/#api-MetadataDefinitions-AddMetaDataDefinitions
*/
const postMetaDataDefinition = async (options, item) => {
  const { backend, token } = options
  const url  = new URL('/API/v1.4/metadatadefinitions', backend)
  const data = await fetch(url.href, {
    method: 'POST', 
    body:JSON.stringify(item),
    headers:{
      token:token,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
  return await data.json()
}

/*
  Update an definition
  See : https://apidocs.fieldap.com/#api-MetadataDefinitions-PatchMetaDataDefinitions
*/
const patchMetaDataDefinition = async (options, key, item) => {
  const { backend, token } = options
  const url  = new URL(`/API/v1.4/metadatadefinitions/${key}`, backend)
  const data = await fetch(url.href, {
    method: 'PATCH', 
    body:JSON.stringify(item),
    headers:{
      token:token,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
  return await data.json()
}


const getVendor = (vendorAttributePaths, metaDatum) => vendorAttributePaths.reduce( (prev, cur) => prev && prev[cur], metaDatum)
const setVendor = (vendorAttributePaths, metaDatum, value) => {
  const last = vendorAttributePaths.length - 1
  for (let i = 0; i < last; ++i) {
    const key = vendorAttributePaths[i]
    if (!metaDatum[key]) {
      metaDatum[key] = {}
    }
    metaDatum = metaDatum[key]
  }
  metaDatum[vendorAttributePaths[last]] = value
}
/*
  Main function
*/
const main = async () => {
  // if target type is not defined, default to source type
  if (!argv.targetType) {
    argv.targetType = argv.sourceType
  }
  if (!argv.targetToken) {
    argv.targetToken = argv.token
  }
  if (!argv.targetBackend) {
    argv.targetBackend = argv.backend
  }

  const sourceOptions = {
    backend:argv.backend, 
    token:argv.token
  }
  const targetOptions = {
    backend:argv.targetBackend, 
    token:argv.targetToken
  }
  console.log(JSON.stringify(sourceOptions, null, 2))
  const sourceAccount = await getAccount(sourceOptions)
  const targetAccount = await getAccount(targetOptions)

  // Account can be configured to read vendorId from a path inside `vendorAttributes` instead of `vendorId`.
  // we need to handle that.
  const sourceVendorPaths = (sourceAccount.vendorAttributePath || 'vendorId').split('.')
  const targetVendorPaths = (targetAccount.vendorAttributePath || 'vendorId').split('.')

  console.log(sourceVendorPaths)
  console.log(targetVendorPaths)

  const source = await getMetaDataDefinitions(sourceOptions, argv.sourceType, argv.sourceId)
  const target = await getMetaDataDefinitions(targetOptions, argv.targetType, argv.targetId)

  // first we build a lookup map ( vendorId -> definition id ) for target, this will allow faster traversal
  // for the next step 
  const targetVendorIdToTargetId = {}

  for (const targetKey in target) {
    const targetDefinition = target[targetKey]
    const targetVendorId   = getVendor(targetVendorPaths, targetDefinition) 
    
    if (targetVendorId) {
      if (targetVendorIdToTargetId[targetVendorId]) {
        console.error(`Multiple meta data definitions are present with the same vendorId ${targetDefinition.vendorId}`)
      }
      targetVendorIdToTargetId[targetVendorId] = targetKey
    }
  }


  console.log(`=> Creating meta data definition`)

  // Go through all source meta data definitions, find out if it already exists on target: 
  // - If it is, store mapping in lookup
  // - If not create it
  // We also create a lookup map `source.id => target.id`, which we will use
  // to fix displayIfCondition and filterIf values.
  const sourceIdToTargetId = {}

  for (const sourceKey in source) {
    const sourceDefinition = source[sourceKey]
    const sourceVendorId   = getVendor(sourceVendorPaths, sourceDefinition)

    if (sourceVendorId && sourceDefinition.type) {
      const targetKey = targetVendorIdToTargetId[sourceVendorId] 
      // definitions already exists on target, just store mapping in `map`
      if (targetKey) {
        sourceIdToTargetId[sourceKey] = targetKey
      } else {
        const clonedDefinition = {
          ...sourceDefinition
        }
        // Conditions will be created later, when we have all the ids in the map ( old an just created )
        delete clonedDefinition.displayIfConditions
        delete clonedDefinition.filterIf
        // this is not needed, as it will be filled by the API call.
        delete clonedDefinition.account
        // replace relateTo source by target
        clonedDefinition.relateToType = argv.targetType
        clonedDefinition.relateToId   = `${argv.targetId}`
        // set vendorId ( we do that in cast the target account have a different vendorId attribute )
        setVendor(targetVendorPaths, clonedDefinition, sourceVendorId)
        // post and fill lookup
        const created = await postMetaDataDefinition(targetOptions, clonedDefinition)
        if (created.id) {
          sourceIdToTargetId[sourceKey] = created.id
        }
      }
    }
  }
  // Clear promises array
  const promises = []
  console.log(`=> Updating filterIf and displayIfConditions`)
  // Now that we created all the definitions on the target, and we have a map 
  // `source.id => target.id`, we go through all target definitions, and replace 
  // IDs in filterIf AND displayIfConditions.
  //
  // Note that we update the whole definition, so that we are sure that if
  // an existing definition was changed, the target get the update.
  for (const sourceKey in sourceIdToTargetId) {
    const updatedDefinition = {
      ...source[sourceKey]
    }
    const sourceVendorId   = getVendor(sourceVendorPaths, updatedDefinition)

    setVendor(targetVendorPaths, updatedDefinition, sourceVendorId)

    // replace relateTo source by target
    updatedDefinition.relateToType = argv.targetType
    updatedDefinition.relateToId   = `${argv.targetId}`
    // remove not needed information that GET gave us
    delete updatedDefinition.account
    // update filterIf using mapping
    updatedDefinition.filterIf = updatedDefinition.filterIf ? sourceIdToTargetId[updatedDefinition.filterIf] : null

    if (Array.isArray(updatedDefinition.displayIfConditions)) {
      // update displayIfConditions using mapping 
      updatedDefinition.displayIfConditions = updatedDefinition.displayIfConditions.map(
        condition => {
          const clone = {
            ...condition
          }
          // remove not needed information that GET gave us
          delete clone.id
          delete clone.metaDatum
          // special case, if clone.operandId is 'connection-types', we do not do anything with it
          if (clone.operandId !== 'connection-types') {
            clone.operandId = sourceIdToTargetId[clone.operandId]
          }
          return clone
        }
      )
    } else {
      updatedDefinition.displayIfConditions = []
    }
    // finally patch the definition
    const targetKey = sourceIdToTargetId[sourceKey]
    promises.push(
      patchMetaDataDefinition(targetOptions, targetKey, updatedDefinition)
    )
  }
  console.log(`=> Waiting for ${promises.length} query`)
  // wait for all patches to be done
  await Promise.all(promises)
}

main()
