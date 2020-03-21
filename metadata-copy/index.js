#!/usr/bin/env node


/*
This sample code copy meta data definitions from one item to the other.

Source and Target can have different types ( connection => asset for example )

*/

const fetch = require('node-fetch')
const yargs = require('yargs')

const argv  = yargs.option('source-type', {
  description:'Source type',
  choices:[`well`, `layer`, `connection`, `asset`, `connector`]
}).option('backend', {
  alias:'b',
  description:'Backend address https://backend.qa.fieldap.com'
}).option('source-id', {
  description:'Source Id'
}).option('target-type', {
  description:'Target type, default to `source-type` if not specified',
  choices:[`well`, `layer`, `connection`, `asset`, `connector`]
}).option('target-id', {
  description:'Target Id'  
}).option('token', {
  alias:'t',
  description:'API token'
}).demandOption(
  'backend'
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
  Retrieve all meta data definition for a given type and id
  See : https://apidocs.fieldap.com/#api-MetadataDefinitions-GetMetaDataDefinitions
*/
const getMetaDataDefinitions = async (relateToType, relateToId) => {
  const url = new URL('/API/v1.4/metadatadefinitions', argv.backend)
  
  url.searchParams.append('relateToType', relateToType)
  url.searchParams.append('relateToId',   relateToId)
  
  const data = await fetch(url.href, {
    headers:{
      token:argv.token
    }
  })
  return await data.json()
}


/*
  Create a new definition
  See : https://apidocs.fieldap.com/#api-MetadataDefinitions-AddMetaDataDefinitions
*/
const postMetaDataDefinition = async (item) => {
  const url  = new URL('/API/v1.4/metadatadefinitions', argv.backend)
  const data = await fetch(url.href, {
    method: 'POST', 
    body:JSON.stringify(item),
    headers:{
      token:argv.token,
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
const patchMetaDataDefinition = async (key, item) => {
  const url  = new URL(`/API/v1.4/metadatadefinitions/${key}`, argv.backend)
  const data = await fetch(url.href, {
    method: 'PATCH', 
    body:JSON.stringify(item),
    headers:{
      token:argv.token,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
  return await data.json()
}


/*
  Main function
*/
const main = async () => {
  // if target type is not defined, default to source type
  if (!argv.targetType) {
    argv.targetType = argv.sourceType
  }

  const source = await getMetaDataDefinitions(argv.sourceType, argv.sourceId)
  const target = await getMetaDataDefinitions(argv.targetType, argv.targetId)

  // first we build a lookup map ( vendorId -> definition id ) for target, this will allow faster traversal
  // for the next step 
  const targetVendorIdToTargetId = {}

  for (const targetKey in target) {
    const targetDefinition = target[targetKey]
    if (targetDefinition.vendorId) {
      if (targetVendorIdToTargetId[targetDefinition.vendorId]) {
        console.error(`Multiple meta data definitions are present with the same vendorId ${targetDefinition.vendorId}`)
      }
      targetVendorIdToTargetId[targetDefinition.vendorId] = targetKey
    }
  }


  console.log(`=> Creating meta data definition`)

  // Go through all source meta data definitions, find out if it already exists on target: 
  // - If it is, store mapping in lookup
  // - If not create it
  // We also create a lookup map `source.id => target.id`, which we will use
  // to fix displayIfCondition and filterIf values.
  const sourceIdToTargetId = {}
  const promises           = []

  for (const sourceKey in source) {
    const sourceDefinition = source[sourceKey]
    if (sourceDefinition.vendorId && sourceDefinition.type) {
      const targetKey = targetVendorIdToTargetId[sourceDefinition.vendorId] 

      // definitions already exists on target, just store mapping in `map`
      if (targetKey) {
        sourceIdToTargetId[sourceKey] = targetKey
      } else {
        const cloned = {
          ...sourceDefinition
        }
        // Conditions will be created later, when we have all the ids in the map ( old an just created )
        delete cloned.displayIfConditions
        delete cloned.filterIf
        // this is not needed, as it will be filled by the API call.
        delete cloned.account
        // replace relateTo source by target
        cloned.relateToType = argv.targetType
        cloned.relateToId   = argv.targetId

        promises.push(
          postMetaDataDefinition(cloned)
        )
      }
    }
  }
  console.log(`=> Waiting for ${promises.length} query`)
  // wait for all POST to be done
  results = await Promise.all(promises)
  // then add all results to our `source.id => target.id` map
  results.forEach(
    created => sourceIdToTargetId[sourceKey] = created.id
  )

  // Clear promises array
  promises.length = 0
  console.log(`=> Updating filterIf and displayIfConditions`)
  // Now that we created all the definitions on the target, and we have a map 
  // `source.id => target.id`, we go through all target definitions, and replace 
  // IDs in filterIf AND displayIfConditions.
  //
  // Note that we update the whole definition, so that we are sure that if
  // an existing definition was changed, the target get the update.
  for (const sourceKey in sourceIdToTargetId) {
    const updated = {
      ...source[sourceKey]
    }
    // replace relateTo source by target
    updated.relateToType = argv.targetType
    updated.relateToId   = argv.targetId
    // remove not needed information that GET gave us
    delete updated.account
    // update filterIf using mapping
    updated.filterIf = updated.filterIf ? sourceIdToTargetId[updated.filterIf] : null

    if (Array.isArray(updated.displayIfConditions)) {
      // update displayIfConditions using mapping 
      updated.displayIfConditions = updated.displayIfConditions.map(
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
      updated.displayIfConditions = []
    }
    // finally patch the definition
    const targetKey = sourceIdToTargetId[sourceKey]
    promises.push(
      patchMetaDataDefinition(targetKey, updated)
    )
  }
  console.log(`=> Waiting for ${promises.length} query`)
  // wait for all patches to be done
  await Promise.all(promises)
}

main()
