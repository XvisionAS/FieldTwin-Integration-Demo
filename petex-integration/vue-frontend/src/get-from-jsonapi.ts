import axios from 'axios'
const getWellName = async (id: string, backendurl: string) => {
  return await axios(
    {
      method: 'get',
      url: `${window.location.origin}/jsonapi/wells/${id}`,
      headers: {
        authorization: `bearer ${window.petex.token}`,
        backendurl
      }
    }
  ).then(
    (r: any) => {
      return r.data.data.attributes.name
    }
  ).catch(
    (e) => {
      console.warn(`error while retrieving well ${id}: ${e.data}`)
      return undefined
    }
  )
}

const getstagedAssetWell = async (id: any, backendurl: string) => {
  return await axios(
    {
      method: 'get',
      url: `${window.location.origin}/jsonapi/stagedAssets/${id}`,
      headers: {
        authorization: `bearer ${window.petex.token}`,
        backendurl
      }
    }
  ).then(
    (r: any) => {
      return r.data.data.attributes.initialState.well
    }
    ).catch(
      (e) => {
        console.warn(`error while retrieving staged asset ${id}: ${e.data}`)
        return undefined
      }
    )
}

export {
  getWellName,
  getstagedAssetWell
}
