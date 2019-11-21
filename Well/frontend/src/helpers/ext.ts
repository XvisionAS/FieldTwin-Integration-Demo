import axios from 'axios'


const getFields = async () => {
    const data = await axios(
      {
        method: 'get',
        url: `/fields`,
      }
    )
    return data.data
  }

export {
  getFields
}