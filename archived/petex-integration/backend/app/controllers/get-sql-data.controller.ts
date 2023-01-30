/* app/controllers/initial.controller.ts */
// tslint:disable:trailing-comma

import tedious from 'tedious'

import { Router } from 'express'
import { IpetexConfig } from '../interfaces'

const PETEX_SQL_ENCRYPT = process.env.PETEX_SQL_ENCRYPT === undefined ? true : process.env.PETEX_SQL_ENCRYPT === 'true'

const petexConfig: IpetexConfig = {
  userName: process.env.PETEX_SQL_LOGIN || 'guest',
  password: process.env.PETEX_SQL_PASSWORD || 'guest',
  server: process.env.PETEX_SQL_SERVER || 'localhost',
  options: {
    encrypt: PETEX_SQL_ENCRYPT,
    database: process.env.PETEX_SQL_DATABASE || 'IVMConfig',
  },
}

const getSqlData: Router = Router()

const SQLRequest = (config: IpetexConfig, SQL: string) => {
  return new Promise(
    (resolve, reject) => {
      const connection = new tedious.Connection(config)
      connection.on('connect', (err) => {
        if (err) {
          reject(err)
        } else {
          const result: any[] = []
          const request = new tedious.Request(SQL,
            (error: Error, _rowCount: number, _rows: any[]) => {
              connection.close()
              if (error) {
                reject(error)
              } else {
                resolve(result)
              }
            })
          request.on('row', (columns) => {
            const obj: {
              [key: string]: any,
            } = {}
            columns.forEach((column) => {
              if (column.value !== null) {
                const name: string = column.metadata.colName
                obj[name] = column.value
              }
            })
            result.push(obj)
          })
          connection.execSql(request)
        }
      })
    },
  )
}

getSqlData.get('/objectsType', (_req, res) => {
    // Get list of object type present in DB
    const SQL = `
      SELECT DISTINCT
        ObjectTypeName,
        ObjectTypeId
      FROM
        IVMPetexDP.ext.vw_CurrentValues
    `

    SQLRequest(petexConfig, SQL).then(
      (result) => res.json(result)
      ).catch(
      (err) => res.status(500).json(err)
    )
  })

getSqlData.get('/', (_req, res) => {
    res.json({root: 66})
  })

// get list of object of a certain type
getSqlData.get('/:objectTypeId/objects', (req, res) => {
  const objectTypeId: any = req.params.objectTypeId
  const SQL = `
  select distinct
    ObjectInstanceId,
    ObjectInstanceName
  from IVMPetexDP.ext.vw_CurrentValues
    WHERE ObjectTypeId = ${objectTypeId}
`
  SQLRequest(petexConfig, SQL).then(

    (result) => res.json(result)
  ).catch(

    (err) => res.status(500).json(err)
  )
})

getSqlData.get('/:objectInstanceId/current', (req, res) => {
  // Get list of Real Time current value and associate dataset
  const objectInstanceId = req.params.objectInstanceId
  const SQL = `
  SELECT DISTINCT
    [datasetId],
    [ObjectTypePropertyID],
    [ObjectTypePropertyName],
    [dataSourceName],
    [CurrentValue],
    [AliasText],
    [isString]
  FROM [IVMPetexDP].[ext].[vw_CurrentValues]
  WHERE ObjectInstanceId  = ${objectInstanceId} AND DataSourceName = 'Real Time'
  `
  SQLRequest(petexConfig, SQL).then(
    (result: any) => {
      const response = result.filter(
        (a: any) => !a.isString &&
                    !isNaN(a.CurrentValue) &&
                    (a.AliasText && (typeof a.AliasText === 'string') && a.AliasText !== '' )
      )
      res.json(response)}
  ).catch(
    (err) => res.status(500).json(err)
  )
})

getSqlData.get('/:dataSetId/historical', (req, res) => {
  // Get list of Real Time current value and associate dataset
  const dataSetId = req.params.dataSetId
  const SQL = `
  SELECT TOP 5000 *
  FROM [IVMPetexDP].[ext].vw_History
  WHERE DataSetId = ${dataSetId}
  `
  SQLRequest(petexConfig, SQL).then(
    (result) => res.json(result)
  ).catch(
    (err) => res.status(500).json(err)
  )
})

export {
  getSqlData,
}
