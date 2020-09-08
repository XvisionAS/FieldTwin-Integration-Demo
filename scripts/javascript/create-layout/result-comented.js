// https://apidocs.fieldap.com/ is the documentation site of our API and have also a definition of the terms used.
 //
a = {
    "stagedAssets": {         // list of Assets present (staged) in the field each one instantiate a particular asset Template 
    "-MGbSBICHwgEfazIdxaA": { // each object need a uniq id
      "isValidForCost": true, 
      "costObject": { //object that describe the cost of this Asset
        "entries": [],
        "value": 0,
        "currency": "USD"
      },
      "tags": [], // "list of string"
      "showCustomResults": false,
      "customResults": {},
      "created": "2020-09-07T07:25:38.218Z",
      "creator": "chameleon@fieldap.com",
      "name": "FPSO",    // obvious
      "hiddenLabel": false,
      "showMetaInfo": false,
      "isLocked": false,
      "initialState": { // General position in the field
        "x": 437439.2817968662, //Eastern position
        "y": 6478897.660542186, // Northen position
        "scale": 1,
        "width": 285.996308,    
        "height": 285.996308,
        "rotation": 269.81849113935425, //heading
        "opacity": 1,
        "label-offset-x": 29.079050287604332,
        "label-offset-y": 23.757900499999998,
        "z": 0 // depth from sea level nod needed at creation for type "vessel" and "structure"
      },
      "renderOrder": 0,
      "visible": true,
      "perAssetParams": {},
      "havePerAssetSockets": false,  // Have the staged asset a specific socket configuration
      "wellmasterConfiguration": {},
      "textColor": "#FFF",
      "clonedFroms": [],
      "isInactive": false,
      "subProject": "-MGbPX_9-CIo8igzDKBs",
      "asset": { // description of the asset that the staged asset instantiate. only need asset Id for staged asset creation
        "id": "-LTaY15Gd6j98cqD4DZP",
        "name": "Generic FPSO (porch)",
        "description": "",
        "params": {
          "height": 47.515800999999996,
          "left": -153.505707,
          "top": -25.230301,
          "width": 285.996308
        },
        "shared": true,
        "imageUrl": "https://storage.googleapis.com/futureon-prod-prod-bucket/assets/custom-library/generic/2D/97e8e0b0afdf--LTaY15Gd6j98cqD4DZP.svg?GoogleAccessId=futureon-prod-prod-jsonapi%40firebase-fieldapp-prod.iam.gserviceaccount.com&Expires=1599499052&Signature=pnqo%2B6TVMJkzmcym%2B1KjW0OtDjQXA1M6uYsSQEYzukbOsNkScfvtCVgoUIzcVj0VzCMFAl8KmXURLbqX%2BASYKAJXJuPQSSGv7io15vdAcnkbdi0oDQzF1ede%2B1BXKf46fxIGI%2FnT1mlduh2G8T4QDowh9ZTDzQ19mYbxhd8xzaPAOpvkzOEpGsVpbtg%2Fho1ZsbXKJI25zXcorDJF4askQYngA2x%2FJx5fFn6AvpKcxU7fEovSgCuoTcLmVM2dFM9axxl7zGZw9CaI3y%2BAcRDYZkIiZSmsxYBDfFZgP%2FeEGYG9wH9fPUK%2F%2BH1gAChII5lw7GUEuVWpVnmffLDsJ7nHvA%3D%3D",
        "model3dUrl": "https://storage.googleapis.com/futureon-prod-prod-bucket/assets/custom-library/generic/3D/f0eca6904bf5--LTaY15Gd6j98cqD4DZP.json?GoogleAccessId=futureon-prod-prod-jsonapi%40firebase-fieldapp-prod.iam.gserviceaccount.com&Expires=1599499052&Signature=ivg0qdUEG5HTYgnBPL4KJwOTh7m87vMhTA5%2BcZqxWikBQrTNVrw0BO4ofwUxUmS0%2F8EDdcxOHeRuUMfdK3V%2BgHkm4Tbl4Gs5bhHLAxwbRASFChVqvVT9JAoqnaciJBoioQmTXju3kzEnGO5CU77Xx4Yta92xJIuYiuAGJTN4%2FrR9TGC7aXmZL%2ByXG7OFx8CG6rcUZp22PzcreDzG06tt87npHdOIO%2Fb1oJIAfxPAPYOsK1gw2F%2FjP7jGg0EDsbsBftLOC3ccgqjcPhvyjuPk%2F5AkhLdOZ5YkA3vts%2FxY4k%2ButENhzv6iqFVJJ8P9bA8iGAa4T2WB1OQKBO4nFFbLbQ%3D%3D",
        "sockets2d": [
          {
            "name": "001",
            "x": 55.672737,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "002",
            "x": 48.649323,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "003",
            "x": 46.415749,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "004",
            "x": 32.759914,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "005",
            "x": 30.205168,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "006",
            "x": 8.355764,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "007",
            "x": -6.278535,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "008",
            "x": -17.512945,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "009",
            "x": -25.427418,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "010",
            "x": -28.562422,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "011",
            "x": -34.203297,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "012",
            "x": -36.427364,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "013",
            "x": -42.026325,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "014",
            "x": -51.414841,
            "y": -22.878511,
            "z": 4.634214
          },
          {
            "name": "015",
            "x": -53.688301,
            "y": -22.878511,
            "z": 4.634214
          }
        ],
        "category": "FPSO",
        "subType": "vessel",
        "type": "vessel" // define the z value behaviour of the asset: "vessel" stick to sea level. "structure" stick to sea bed, "subMerged" z can be modified
      },
      "sockets2d": [
        {
          "name": "001",
          "x": 55.672737,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "002",
          "x": 48.649323,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "003",
          "x": 46.415749,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "004",
          "x": 32.759914,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "005",
          "x": 30.205168,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "006",
          "x": 8.355764,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "007",
          "x": -6.278535,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "008",
          "x": -17.512945,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "009",
          "x": -25.427418,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "010",
          "x": -28.562422,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "011",
          "x": -34.203297,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "012",
          "x": -36.427364,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "013",
          "x": -42.026325,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "014",
          "x": -51.414841,
          "y": -22.878511,
          "z": 4.634214
        },
        {
          "name": "015",
          "x": -53.688301,
          "y": -22.878511,
          "z": 4.634214
        }
      ],
      "metaData": [ // list of metadata for this object  need Id and value for creation, update. list of definition available for te staged asset depend of "asset" value
        {
          "id": "-MGca3xUTazSE8-FaxVB", //id of metadata definition
          "name": "Number of beds",
          "type": "numerical",
          "value": 75, //value associate to definition
          "cost": 0,
          "costPerLength": false,
          "vendorAttributes": {}
        }
      ],
      "connectionsAsFrom": {}, // connections object connected to this asset as "starting point"
      "connectionsAsTo": {    // connections object connected to this asset as "ending" point"
      // in the creation scrip: not set up at staged asset creation: The connection do not exist yet
        "-MGbVOjHCSu99Y-HfBAy": { 
          "tags": [],
          "isValidForCost": true,
          "costObject": {
            "costByLength": false,
            "currency": "USD"
          },
          "showCustomResults": false,
          "customResults": {},
          "created": "2020-09-07T07:39:39.694Z",
          "creator": "chameleon@fieldap.com",
          "designType": "Riser - Lazy Wave",
          "visible": true,
          "bendable": true,
          "fromSocket": "d",
          "toSocket": "010",
          "fromCoordinate": {
            "x": 436934.1341414579,
            "y": 6478874.196764671
          },
          "toCoordinate": {
            "x": 437416.49388419563,
            "y": 6478869.025786174
          },
          "intermediaryPoints": [],
          "params": {
            "type": 2,
            "label": "Riser 3",
            "showFlow": false,
            "Riser - Lazy Wave": {
              "a": {
                "delta": 0.954,
                "heightDelta": 0.8,
                "depth": -69.13177905771033
              },
              "b": {
                "delta": 0.836,
                "heightDelta": 0.6,
                "depth": -51.99865420760774
              },
              "c": {
                "delta": 0.7010000000000001,
                "heightDelta": 1,
                "depth": -86.8854369138551
              }
            }
          },
          "renderOrder": 0,
          "showLabel": false,
          "showLength": true,
          "importParams": {},
          "straight": false,
          "isLocked": false,
          "noHeightSampling": false,
          "isInactive": false,
          "clonedFroms": [],
          "subProject": "-MGbPX_9-CIo8igzDKBs",
          "metaDataValue": {
            "-MGchJMG3adZ0EhyMUkb": true
          },
          "from": "-MGbVOjJOwGPuBP91ug3",
          "to": "-MGbSBICHwgEfazIdxaA"
        },
        "-MGbVVFyFmngiaQcFr--": {
          "tags": [],
          "isValidForCost": true,
          "costObject": {
            "costByLength": false,
            "currency": "USD"
          },
          "showCustomResults": false,
          "customResults": {},
          "created": "2020-09-07T07:40:06.426Z",
          "creator": "chameleon@fieldap.com",
          "designType": "Riser - Lazy Wave",
          "visible": true,
          "bendable": true,
          "fromSocket": "d",
          "toSocket": "007",
          "fromCoordinate": {
            "x": 436932.82629699056,
            "y": 6478904.846731934
          },
          "toCoordinate": {
            "x": 437416.42329057975,
            "y": 6478891.309561354
          },
          "intermediaryPoints": [],
          "params": {
            "type": 2,
            "label": "Riser 5",
            "showFlow": false,
            "Riser - Lazy Wave": {
              "a": {
                "delta": 0.954,
                "heightDelta": 0.8,
                "depth": -69.13177905771033
              },
              "b": {
                "delta": 0.836,
                "heightDelta": 0.6,
                "depth": -51.99865420760774
              },
              "c": {
                "delta": 0.7010000000000001,
                "heightDelta": 1,
                "depth": -86.8854369138551
              }
            }
          },
          "renderOrder": 0,
          "showLabel": false,
          "showLength": true,
          "importParams": {},
          "straight": false,
          "isLocked": false,
          "noHeightSampling": false,
          "isInactive": false,
          "clonedFroms": [],
          "subProject": "-MGbPX_9-CIo8igzDKBs",
          "metaDataValue": {
            "-MGchJMK4p_MWyx0xY_2": true
          },
          "from": "-MGbVVG-Ghp9WdHgpkLP",
          "to": "-MGbSBICHwgEfazIdxaA"
        },
        "-MGbVRpQRSKtAOvql21P": {
          "tags": [],
          "isValidForCost": true,
          "costObject": {
            "costByLength": false,
            "currency": "USD"
          },
          "showCustomResults": false,
          "customResults": {},
          "created": "2020-09-07T07:39:52.376Z",
          "creator": "chameleon@fieldap.com",
          "designType": "Riser - Lazy Wave",
          "visible": true,
          "bendable": true,
          "fromSocket": "d",
          "toSocket": "008",
          "fromCoordinate": {
            "x": 436933.34197185724,
            "y": 6478889.219383212
          },
          "toCoordinate": {
            "x": 437416.4588803143,
            "y": 6478880.075207728
          },
          "intermediaryPoints": [],
          "params": {
            "type": 2,
            "label": "Riser 4",
            "showFlow": false,
            "Riser - Lazy Wave": {
              "a": {
                "delta": 0.954,
                "heightDelta": 0.8,
                "depth": -69.13177905771033
              },
              "b": {
                "delta": 0.836,
                "heightDelta": 0.6,
                "depth": -51.99865420760774
              },
              "c": {
                "delta": 0.7010000000000001,
                "heightDelta": 1,
                "depth": -86.8854369138551
              }
            }
          },
          "renderOrder": 0,
          "showLabel": false,
          "showLength": true,
          "importParams": {},
          "straight": false,
          "isLocked": false,
          "noHeightSampling": false,
          "isInactive": false,
          "clonedFroms": [],
          "subProject": "-MGbPX_9-CIo8igzDKBs",
          "metaDataValue": {
            "-MGchJMIEpQWlojSxvp1": true
          },
          "from": "-MGbVRpSAAYn2uZjTUOJ",
          "to": "-MGbSBICHwgEfazIdxaA"
        },
        "-MGbVYFrjsbl7f9d3xCr": {
          "tags": [],
          "isValidForCost": true,
          "costObject": {
            "costByLength": false,
            "currency": "USD"
          },
          "showCustomResults": false,
          "customResults": {},
          "created": "2020-09-07T07:40:18.707Z",
          "creator": "chameleon@fieldap.com",
          "designType": "Riser - Lazy Wave",
          "visible": true,
          "bendable": true,
          "fromSocket": "d",
          "toSocket": "006",
          "fromCoordinate": {
            "x": 436932.1295387656,
            "y": 6478920.167371471
          },
          "toCoordinate": {
            "x": 437416.37693026196,
            "y": 6478905.943786919
          },
          "intermediaryPoints": [],
          "params": {
            "type": 2,
            "label": "Riser 6",
            "showFlow": false,
            "Riser - Lazy Wave": {
              "a": {
                "delta": 0.954,
                "heightDelta": 0.8,
                "depth": -69.13177905771033
              },
              "b": {
                "delta": 0.836,
                "heightDelta": 0.6,
                "depth": -51.99865420760774
              },
              "c": {
                "delta": 0.7010000000000001,
                "heightDelta": 1,
                "depth": -86.8854369138551
              }
            }
          },
          "renderOrder": 0,
          "showLabel": false,
          "showLength": true,
          "importParams": {},
          "straight": false,
          "isLocked": false,
          "noHeightSampling": false,
          "isInactive": false,
          "clonedFroms": [],
          "subProject": "-MGbPX_9-CIo8igzDKBs",
          "metaDataValue": {
            "-MGchJMLM7KOOJH6mgTH": true
          },
          "from": "-MGbVYFtU8GuGfXfem8C",
          "to": "-MGbSBICHwgEfazIdxaA"
        },
        "-MGbVagVs4GxjAcnu8ja": {
          "tags": [],
          "isValidForCost": true,
          "costObject": {
            "costByLength": false,
            "currency": "USD"
          },
          "showCustomResults": false,
          "customResults": {},
          "created": "2020-09-07T07:40:32.765Z",
          "creator": "chameleon@fieldap.com",
          "designType": "Riser - Lazy Wave",
          "visible": true,
          "bendable": true,
          "fromSocket": "d",
          "toSocket": "005",
          "fromCoordinate": {
            "x": 436931.89504389325,
            "y": 6478938.4321493
          },
          "toCoordinate": {
            "x": 437416.30771305435,
            "y": 6478927.793081279
          },
          "intermediaryPoints": [],
          "params": {
            "type": 2,
            "label": "Riser 7",
            "showFlow": false,
            "Riser - Lazy Wave": {
              "a": {
                "delta": 0.954,
                "heightDelta": 0.8,
                "depth": -69.13177905771033
              },
              "b": {
                "delta": 0.836,
                "heightDelta": 0.6,
                "depth": -51.99865420760774
              },
              "c": {
                "delta": 0.7010000000000001,
                "heightDelta": 1,
                "depth": -86.8854369138551
              }
            }
          },
          "renderOrder": 0,
          "showLabel": false,
          "showLength": true,
          "importParams": {},
          "straight": false,
          "isLocked": false,
          "noHeightSampling": false,
          "isInactive": false,
          "clonedFroms": [],
          "subProject": "-MGbPX_9-CIo8igzDKBs",
          "metaDataValue": {
            "-MGchJMND74oAR7xJXFp": true
          },
          "from": "-MGbVagYKzYgc8D_LSQA",
          "to": "-MGbSBICHwgEfazIdxaA"
        },
        "-MGbSrK3mIePfibrdwCZ": {
          "tags": [],
          "isValidForCost": true,
          "costObject": {
            "costByLength": false,
            "currency": "USD"
          },
          "showCustomResults": false,
          "customResults": {},
          "created": "2020-09-07T07:28:36.738Z",
          "creator": "chameleon@fieldap.com",
          "designType": "Riser - Lazy Wave",
          "visible": true,
          "bendable": true,
          "fromSocket": "d",
          "toSocket": "015",
          "fromCoordinate": {
            "x": 436934.2422132976,
            "y": 6478842.95946777
          },
          "toCoordinate": {
            "x": 437416.57348102046,
            "y": 6478843.900033256
          },
          "intermediaryPoints": [],
          "params": {
            "type": 2,
            "label": "Riser 1",
            "showFlow": false,
            "Riser - Lazy Wave": {
              "a": {
                "delta": 0.954,
                "heightDelta": 0.8,
                "depth": -69.13177905771033
              },
              "b": {
                "delta": 0.836,
                "heightDelta": 0.6,
                "depth": -51.99865420760774
              },
              "c": {
                "delta": 0.7010000000000001,
                "heightDelta": 1,
                "depth": -86.8854369138551
              }
            }
          },
          "renderOrder": 0,
          "showLabel": false,
          "showLength": true,
          "importParams": {},
          "straight": false,
          "isLocked": false,
          "noHeightSampling": false,
          "isInactive": false,
          "clonedFroms": [],
          "subProject": "-MGbPX_9-CIo8igzDKBs",
          "metaDataValue": {
            "-MGchJMBr6xxPsRgoZ2V": true,
            "-MGchQob4JpQnLlc7z6r": true
          },
          "from": "-MGbSonzpIN1A2jUWHDh",
          "to": "-MGbSBICHwgEfazIdxaA"
        },
        "-MGbVKKkRpRhPltGF1UT": {
          "tags": [],
          "isValidForCost": true,
          "costObject": {
            "costByLength": false,
            "currency": "USD"
          },
          "showCustomResults": false,
          "customResults": {},
          "created": "2020-09-07T07:39:21.680Z",
          "creator": "chameleon@fieldap.com",
          "designType": "Riser - Lazy Wave",
          "visible": true,
          "bendable": true,
          "fromSocket": "d",
          "toSocket": "013",
          "fromCoordinate": {
            "x": 436934.2726237385,
            "y": 6478858.429860014
          },
          "toCoordinate": {
            "x": 437416.53653679014,
            "y": 6478855.561950736
          },
          "intermediaryPoints": [],
          "params": {
            "type": 2,
            "label": "Riser 2",
            "showFlow": false,
            "Riser - Lazy Wave": {
              "a": {
                "delta": 0.954,
                "heightDelta": 0.8,
                "depth": -69.13177905771033
              },
              "b": {
                "delta": 0.836,
                "heightDelta": 0.6,
                "depth": -51.99865420760774
              },
              "c": {
                "delta": 0.7010000000000001,
                "heightDelta": 1,
                "depth": -86.8854369138551
              }
            }
          },
          "renderOrder": 0,
          "showLabel": false,
          "showLength": true,
          "importParams": {},
          "straight": false,
          "isLocked": false,
          "noHeightSampling": false,
          "isInactive": false,
          "clonedFroms": [],
          "subProject": "-MGbPX_9-CIo8igzDKBs",
          "metaDataValue": {
            "-MGchJMELE0BjvBHhlIs": true,
            "-MGchRV5bsslroAf2gnL": true
          },
          "from": "-MGbVKKp31_lEGoSt2EZ",
          "to": "-MGbSBICHwgEfazIdxaA"
        }
      }
    },
  },
  "connections": { // list of connections in the projects
    "-MGbS__tPMr0T1foEH2f": { //uniq id
      "tags": [],
      "isValidForCost": true,
      "costObject": {
        "costByLength": false,
        "currency": "USD"
      },
      "showCustomResults": false,
      "customResults": {},
      "created": "2020-09-07T07:27:23.523Z",
      "creator": "chameleon@fieldap.com",
      "designType": "Jumper - Vertical M", // if present describe a specific geometry for the connection
      "visible": true,
      "bendable": true,
      "fromSocket": "b", // name of the socket of the staged asset it's connected from
      "toSocket": "002", // name of the socket of the staged asset it's connected to
      "fromCoordinate": { // starting coordinate point of the connection
        "x": 435032.99338008557,
        "y": 6477219.889188164,
        "z": -88.33549395368156
      },
      "toCoordinate": { // ending coordinate point of the connection
        "x": 435074.8890653371,
        "y": 6477220.051845099,
        "z": -88.22823394267026
      },
      "intermediaryPoints": [ // list of "intermediary point describing the spline of the connection
        {
          "x": 435034.9933650125,
          "y": 6477219.896952959,
          "z": -88.33549395368156
        },
        {
          "x": 435034.9933650125,
          "y": 6477219.896952959,
          "z": -85.22823394267026
        },
        {
          "x": 435036.99334993947,
          "y": 6477219.904717754,
          "z": -85.22823394267026
        },
        {
          "x": 435036.99334993947,
          "y": 6477219.904717754,
          "z": -88.22823394267026
        },
        {
          "x": 435070.8890954832,
          "y": 6477220.036315509,
          "z": -88.22823394267026
        },
        {
          "x": 435070.8890954832,
          "y": 6477220.036315509,
          "z": -85.22823394267026
        },
        {
          "x": 435072.8890804101,
          "y": 6477220.044080304,
          "z": -85.22823394267026
        },
        {
          "x": 435072.8890804101,
          "y": 6477220.044080304,
          "z": -88.22823394267026
        }
      ],
      "params": {
        "type": 2,            // id of which sort of connection we got here same as "asset" for staged Asset see "definition and connection type below"
        "label": "Jumper 1",  // name of the connection
        "showFlow": false,
        "Jumper - Vertical M": { // if connection got a certain geometry, the parameter to build this geometry
          "a": {
            "highestHeightDelta": 3,
            "lowestHeightDelta": 0,
            "length": 2,
            "initialDistance": 2
          },
          "b": {
            "highestHeightDelta": 3,
            "lowestHeightDelta": 0,
            "length": 2,
            "initialDistance": 2
          }
        }
      },
      "renderOrder": 0,
      "showLabel": false,
      "showLength": true,
      "importParams": {},
      "straight": false,
      "isLocked": false,
      "noHeightSampling": false,
      "isInactive": false,
      "clonedFroms": [],
      "subProject": "-MGbPX_9-CIo8igzDKBs",
      "from": { // description of the staged asset connected at the beginning of the connection. Id only for creation of connection

        "id": "-MGbSP77oVcnXuHFPNOg",
        "isValidForCost": true,
        "costObject": {
          "entries": [],
          "value": 0,
          "currency": "USD"
        },
        "tags": [],
        "showCustomResults": false,
        "customResults": {},
        "created": "2020-09-07T07:26:34.863Z",
        "creator": "chameleon@fieldap.com",
        "name": "XMT 1",
        "hiddenLabel": true,
        "showMetaInfo": false,
        "isLocked": false,
        "initialState": {
          "x": 435029.998,
          "y": 6477220.061,
          "scale": 1,
          "width": 4.032101,
          "height": 4.032101,
          "rotation": 269.64889531671383,
          "opacity": 1,
          "lastSelectedWell": "-MGbRwGC70G3TRYRFmbF",
          "label-offset-x": 22.784299701452255,
          "label-offset-y": 2.3223,
          "z": -90.78206062257802
        },
        "renderOrder": 0,
        "visible": true,
        "perAssetParams": {},
        "perAssetSockets2d": [],
        "havePerAssetSockets": false,
        "wellmasterConfiguration": {},
        "textColor": "#FFF",
        "clonedFroms": [],
        "isInactive": false,
        "subProject": "-MGbPX_9-CIo8igzDKBs",
        "asset": {
          "category": "XMT",
          "description": "",
          "id": "-K5uq-ULO1SqquOw_YUk",
          "imageUrl": "https://storage.googleapis.com/futureon-prod-prod-bucket/assets/custom-library/generic/2D/a84a793b48f2--K5uq-ULO1SqquOw_YUk.svg?GoogleAccessId=futureon-prod-prod-jsonapi%40firebase-fieldapp-prod.iam.gserviceaccount.com&Expires=1599499054&Signature=lcxdbKlV3fBvPzRCQ%2BcmHSK2tsZABgp8bkJoWnrBrXMG20CEsLy68N5nxo%2B4DHQcFFpTtG7pHEAEv81qk8TLxBZ0vHGsoB4Kl6%2FpeJqT92lVGRYjSzAjDXFn9zwtWUGQXW9xHmg%2BaWb6u2GkW%2FhLH%2F5EXRpOD7HfylNYMK0DiOqc7%2FwDb4IPLmLy4OaIKPDHXPk8JKr4Xh7IzB2JDPIXb61AyEUYtsHTZU8mtcnYbapOtLa7xg6U59pcxMZ2dxEBzYkLeW3cd6YIzSTesrSDsvKL7au6hKd%2B%2BACLve5IOcbeoE%2BCo5aupFVv0XMWGno%2FbtFzPUaVefUxkafzisgsUw%3D%3D",
          "model3dUrl": "https://storage.googleapis.com/futureon-prod-prod-bucket/assets/custom-library/generic/3D/21983922c58e--K5uq-ULO1SqquOw_YUk.json?GoogleAccessId=futureon-prod-prod-jsonapi%40firebase-fieldapp-prod.iam.gserviceaccount.com&Expires=1599499054&Signature=EqN%2BpQGjEFxA5l%2BabNhFRBjGm1SFzNa1UUQCrBdKBwtIFsNYs%2BAool6YHeLskaJ9T7xw7TTKLgt1HW5hMiMIylhImuWnDoNzNL9YerufRXgCUZwmVsRMsHuxTB1bLUD1gyg1FgpLCOEeQd3ziBCNled%2F1ngaTepNuqX0ukmvkur6%2BWnrc%2BLJQc4vv2QLoTgn2A%2B5gwPS7hkUCH5EznCYNP6OIOpoE5EMD66wutPeBPbdRkiESktIqVe35ek6bfkFxaCdP60UbM%2B7wm41Wd6jTl3D2xaq2XGaSEMgH3ILW0mcBtn0ZqOuUcf41cwtv20p3hsFY2F6IDXD6F6DGs4HeA%3D%3D",
          "name": "XMT deep water",
          "params": {
            "height": 4.6446,
            "left": -1.788865,
            "scale": 1,
            "top": -1.509583,
            "width": 4.032101
          },
          "shared": true,
          "sockets2d": [
            {
              "name": "a",
              "x": -0.162564,
              "y": -0.553537,
              "z": 2.6808
            },
            {
              "name": "b",
              "x": -0.190164,
              "y": 2.994271,
              "z": 2.437339
            }
          ],
          "subType": "SPS",
          "type": "structure"
        },
        "metaDataValue": {},
        "socketMetaDataValue": {}
      },
      "to": { // description of the staged asset connected at the end of the connection. Id only for creation of connection

        "id": "-MGbSUSmIK5xYtPR94DJ",
        "isValidForCost": true,
        "costObject": {
          "entries": [],
          "value": 0,
          "currency": "USD"
        },
        "tags": [],
        "showCustomResults": false,
        "customResults": {},
        "created": "2020-09-07T07:26:56.717Z",
        "creator": "chameleon@fieldap.com",
        "name": "PLET  1",
        "hiddenLabel": true,
        "showMetaInfo": false,
        "isLocked": false,
        "initialState": {
          "x": 435076.3695649895,
          "y": 6477220.069338556,
          "scale": 1,
          "width": 4.0618,
          "height": 4.0618,
          "rotation": 269.32302979364135,
          "opacity": 1,
          "label-offset-x": 33.1061482578516,
          "label-offset-y": 4.388249999999999,
          "z": -90.64663547908708
        },
        "renderOrder": 0,
        "visible": true,
        "perAssetParams": {},
        "perAssetSockets2d": [
          {
            "name": "001",
            "x": 0,
            "y": 3.402275,
            "z": 0.389646,
            "types": []
          },
          {
            "name": "002",
            "x": 0,
            "y": -1.480603,
            "z": 2.422055,
            "types": [],
            "type": {
              "name": "Universal",
              "id": 0
            },
            "orientation": "vertical"
          }
        ],
        "havePerAssetSockets": true,
        "wellmasterConfiguration": {},
        "textColor": "#FFF",
        "clonedFroms": [],
        "isInactive": false,
        "subProject": "-MGbPX_9-CIo8igzDKBs",
        "asset": {
          "category": "Plet",
          "id": "-LRuawkbuyIr-rfuWV5w",
          "imageUrl": "https://storage.googleapis.com/futureon-prod-prod-bucket/assets/custom-library/generic/2D/8980d312fae8--LRuawkbuyIr-rfuWV5w.svg?GoogleAccessId=futureon-prod-prod-jsonapi%40firebase-fieldapp-prod.iam.gserviceaccount.com&Expires=1599499054&Signature=w9ddtEFjg0V8IPzM3sm%2BHS2ufhzZ%2Bo9pK6YTqM2xkZiihhXkRKPSgYwecIKLFSfoXgoW7UrXboWhWwkkIoHzu1wq3RAYg08BUEIxsXR0yv8Qrk2CIzq7MEqflvU6YJ9f2dmtMYJuy2aRhhoQS11Itck%2FFh6NefAKrZF7T0fUf1bcevlVqzU89pBiX%2B7fqLFTIBjQmF6puL0%2BY4hLDH%2F2TczTUxBGY0CMVD4UBycO3F6IXOrSAZez9SEu0apnhNfiwBNjbPfiJvX5lOmZ7cpcobOBYlO08e1SQPLPTl1MrMmFbaGoKwAYdxbXtapXrmC%2B2b9T%2FI7ab5MfLVXiixJIzg%3D%3D",
          "model3dUrl": "https://storage.googleapis.com/futureon-prod-prod-bucket/assets/custom-library/generic/3D/0566505186e5--LRuawkbuyIr-rfuWV5w.json?GoogleAccessId=futureon-prod-prod-jsonapi%40firebase-fieldapp-prod.iam.gserviceaccount.com&Expires=1599499054&Signature=nhq9j%2BSvMoBp5DfZeRZdArNtvUf0NR%2F9tckTDzMwqps4K2fZ4uDFGYOC5wP71k30Ci%2Fb8PM%2FA9Reitnn8vRyV384Nyhu2r4x92ax3x5mlogU2MWIgEzTHrrzA2U7liuImaYtG6VOieCiuUjVLUwyH%2FrT0ZJ7fJcfwUuIVG%2B2LyvszV6kGyxQM3CLjg4Jrw8kggGsBmuXOWek4St%2Bke2BVh%2FYGaI3UdfFNzQa15ZWj516adJpoBxwvmguOyraLsmHWeQFjFuLFeKl2oSHJCUF91ippg%2F%2FdKotcMZtTW7czQKYlKFAzGcO20p6xpvOPh0ulGymuSaVRE6kHl4qp3t3mA%3D%3D",
          "name": "PLET  Vertical Connector",
          "params": {
            "height": 8.776499999999999,
            "left": -2.0309,
            "top": -5.3748,
            "width": 4.0618
          },
          "shared": true,
          "sockets2d": [
            {
              "name": "001",
              "x": 0,
              "y": 3.402275,
              "z": 0.389646
            },
            {
              "name": "002",
              "x": 0,
              "y": -1.480603,
              "z": 2.422055
            }
          ],
          "subType": "piping",
          "description": "",
          "type": "structure"
        },
        "metaDataValue": {},
        "socketMetaDataValue": {}
      },
      "connectionType": {
        "id": 2,
        "name": "Oil Production",
        "symbol": "O",
        "color": "#ff0000",
        "category": 2,
        "params": {
          "width": 0.5
        }
      },
      "definition": {
        "id": 2,
        "name": "Oil Production",
        "symbol": "O",
        "color": "#ff0000",
        "category": {
          "id": 2,
          "name": "Production"
        },
        "params": {
          "width": 0.5
        }
      },
      "designName": "Jumper - Vertical M", // if present describe a specific geometry for the connection de 
      "renderAs": "Jumper - Vertical M",
      "length": 53.57725384874836,
      "metaData": [ // same as for staged asset. list of definition available are defined by params.type
        {
          "id": "-MGc_gg68T3AZJJV8HOc",
          "name": "Inner diameter",
          "type": "numerical",
          "value": 34543,
          "cost": 0,
          "costPerLength": false,
          "vendorAttributes": {},
          "option": "mm"
        },
        {
          "id": "-MGc_nXh3hNHSMGSxEST",
          "name": "jumper specific value",
          "type": "string",
          "value": "jumper",
          "cost": 0,
          "costPerLength": false,
          "vendorAttributes": {}
        },
        {
          "id": "-MGc_sykTR5kVHEmwx9g",
          "name": "riser specific value",
          "type": "string",
          "value": "riser",
          "cost": 0,
          "costPerLength": false,
          "vendorAttributes": {}
        }
      ]
    },
  },
  "wells": {   // list of well head
    "-MGbRvZji3keDy_c43eq": { //id
      "tags": [],
      "created": "2020-09-07T07:24:32.570Z",
      "creator": "chameleon@fieldap.com",
      "name": "Volve F_F-2_F-2_F2 Injector 170907_PROTOTYPE",
      "radius": 1,
      "radiusViewDependant": true,
      "x": 435047.604,  // eastern
      "y": 6478564.735, // northern
      "visible": true,
      "canBeDrag": false,
      "color": "#ff0000",
      "labelVisible": false,
      "labelOffsetX": 16,
      "labelOffsetY": 16,
      "labelRotation": 0,
      "referenceLevel": "seabed", // 'seabed','sea' or  'rkb' describe where the top hole start
      "rkb": 0,
      "fontSize": 11,
      "isInactive": false,
      "clonedFroms": [],
      "subProject": "-MGbPX_9-CIo8igzDKBs",
      "z": -91.70424050508471, // sea depth at this point calculated
      "kind": { // kind of well only id for creation/update, serve to define the metadata definitions for this object
        "name": "Default Well type",
        "id": "-MGgfWAyOlXlcLVjD3hP",
        "account": "-MF6CxQx25Z3eRIHERJN"
      },
      "metaData": [], // same as the other list of possible definition function of
      "wellBores": [ //list of the bore connected the well head
        {
          "name": "Volve F_F-2_F-2_F2 Injector 170907_PROTOTYPE",
          "kind": "-MGgf_jXnhy8kNJYSklw", // Kind of well  Bore, serve to define the metadata definitions list for this object
          "metaData": [],
          "id": "-MGbRvZoWllJ5x_JaRkk", //uniq id of the well bore
          "path": [
            {
              "x": 435047.604,
              "y": 6478564.735,
              "z": 145
            },
            {
              "x": 435047.604,
              "y": 6478564.735,
              "z": 150
            },
            {
              "x": 435047.604,
              "y": 6478564.735,
              "z": 180
            },
            {
              "x": 435047.604,
              "y": 6478564.735,
              "z": 210
            },
            {
              "x": 435047.604,
              "y": 6478564.735,
              "z": 240
            },
            {
              "x": 435047.604,
              "y": 6478564.735,
              "z": 250
            },
            {
              "x": 435047.515,
              "y": 6478564.66,
              "z": 270
            },
            {
              "x": 435047.047,
              "y": 6478564.268,
              "z": 299.99
            },
            {
              "x": 435046.178,
              "y": 6478563.539,
              "z": 329.97
            },
            {
              "x": 435044.909,
              "y": 6478562.474,
              "z": 359.92
            },
            {
              "x": 435043.24,
              "y": 6478561.074,
              "z": 389.85
            },
            {
              "x": 435042.595,
              "y": 6478560.532,
              "z": 399.81
            },
            {
              "x": 435041.145,
              "y": 6478559.315,
              "z": 419.72
            },
            {
              "x": 435038.538,
              "y": 6478557.128,
              "z": 449.53
            },
            {
              "x": 435035.413,
              "y": 6478554.506,
              "z": 479.25
            },
            {
              "x": 435031.773,
              "y": 6478551.452,
              "z": 508.87
            },
            {
              "x": 435031.065,
              "y": 6478550.858,
              "z": 514.17
            },
            {
              "x": 435027.708,
              "y": 6478548.266,
              "z": 538.42
            },
            {
              "x": 435023.39,
              "y": 6478545.526,
              "z": 567.98
            },
            {
              "x": 435018.825,
              "y": 6478543.248,
              "z": 597.54
            },
            {
              "x": 435014.014,
              "y": 6478541.432,
              "z": 627.1
            },
            {
              "x": 435008.959,
              "y": 6478540.078,
              "z": 656.63
            },
            {
              "x": 435003.66,
              "y": 6478539.187,
              "z": 686.15
            },
            {
              "x": 434998.12,
              "y": 6478538.76,
              "z": 715.63
            },
            {
              "x": 434992.341,
              "y": 6478538.795,
              "z": 745.07
            },
            {
              "x": 434986.324,
              "y": 6478539.294,
              "z": 774.45
            },
            {
              "x": 434980.07,
              "y": 6478540.257,
              "z": 803.78
            },
            {
              "x": 434973.583,
              "y": 6478541.682,
              "z": 833.03
            },
            {
              "x": 434966.863,
              "y": 6478543.569,
              "z": 862.21
            },
            {
              "x": 434959.914,
              "y": 6478545.919,
              "z": 891.29
            },
            {
              "x": 434952.736,
              "y": 6478548.729,
              "z": 920.29
            },
            {
              "x": 434945.333,
              "y": 6478552,
              "z": 949.17
            },
            {
              "x": 434937.706,
              "y": 6478555.731,
              "z": 977.94
            },
            {
              "x": 434929.857,
              "y": 6478559.919,
              "z": 1006.59
            },
            {
              "x": 434921.79,
              "y": 6478564.564,
              "z": 1035.11
            },
            {
              "x": 434913.507,
              "y": 6478569.665,
              "z": 1063.49
            },
            {
              "x": 434905.01,
              "y": 6478575.22,
              "z": 1091.72
            },
            {
              "x": 434896.301,
              "y": 6478581.227,
              "z": 1119.79
            },
            {
              "x": 434887.384,
              "y": 6478587.684,
              "z": 1147.69
            },
            {
              "x": 434878.261,
              "y": 6478594.59,
              "z": 1175.42
            },
            {
              "x": 434868.935,
              "y": 6478601.942,
              "z": 1202.97
            },
            {
              "x": 434859.408,
              "y": 6478609.738,
              "z": 1230.33
            },
            {
              "x": 434849.684,
              "y": 6478617.976,
              "z": 1257.48
            },
            {
              "x": 434839.766,
              "y": 6478626.653,
              "z": 1284.43
            },
            {
              "x": 434829.656,
              "y": 6478635.767,
              "z": 1311.16
            },
            {
              "x": 434819.359,
              "y": 6478645.314,
              "z": 1337.67
            },
            {
              "x": 434808.875,
              "y": 6478655.293,
              "z": 1363.94
            },
            {
              "x": 434798.21,
              "y": 6478665.699,
              "z": 1389.98
            },
            {
              "x": 434787.367,
              "y": 6478676.53,
              "z": 1415.76
            },
            {
              "x": 434775.346,
              "y": 6478688.816,
              "z": 1443.58
            },
            {
              "x": 434765.227,
              "y": 6478699.28,
              "z": 1466.67
            },
            {
              "x": 434754.105,
              "y": 6478710.779,
              "z": 1492.05
            },
            {
              "x": 434742.984,
              "y": 6478722.279,
              "z": 1517.42
            },
            {
              "x": 434731.863,
              "y": 6478733.778,
              "z": 1542.8
            },
            {
              "x": 434720.741,
              "y": 6478745.278,
              "z": 1568.17
            },
            {
              "x": 434709.62,
              "y": 6478756.777,
              "z": 1593.55
            },
            {
              "x": 434698.499,
              "y": 6478768.276,
              "z": 1618.92
            },
            {
              "x": 434687.377,
              "y": 6478779.776,
              "z": 1644.3
            },
            {
              "x": 434676.256,
              "y": 6478791.275,
              "z": 1669.67
            },
            {
              "x": 434665.135,
              "y": 6478802.775,
              "z": 1695.05
            },
            {
              "x": 434654.013,
              "y": 6478814.274,
              "z": 1720.42
            },
            {
              "x": 434642.892,
              "y": 6478825.774,
              "z": 1745.8
            },
            {
              "x": 434631.771,
              "y": 6478837.273,
              "z": 1771.17
            },
            {
              "x": 434620.649,
              "y": 6478848.773,
              "z": 1796.55
            },
            {
              "x": 434609.528,
              "y": 6478860.272,
              "z": 1821.92
            },
            {
              "x": 434598.407,
              "y": 6478871.772,
              "z": 1847.3
            },
            {
              "x": 434587.285,
              "y": 6478883.271,
              "z": 1872.67
            },
            {
              "x": 434576.164,
              "y": 6478894.77,
              "z": 1898.05
            },
            {
              "x": 434565.043,
              "y": 6478906.27,
              "z": 1923.42
            },
            {
              "x": 434553.921,
              "y": 6478917.769,
              "z": 1948.8
            },
            {
              "x": 434542.8,
              "y": 6478929.269,
              "z": 1974.17
            },
            {
              "x": 434531.679,
              "y": 6478940.768,
              "z": 1999.55
            },
            {
              "x": 434520.557,
              "y": 6478952.268,
              "z": 2024.93
            },
            {
              "x": 434509.436,
              "y": 6478963.767,
              "z": 2050.3
            },
            {
              "x": 434498.315,
              "y": 6478975.267,
              "z": 2075.68
            },
            {
              "x": 434487.193,
              "y": 6478986.766,
              "z": 2101.05
            },
            {
              "x": 434476.072,
              "y": 6478998.265,
              "z": 2126.43
            },
            {
              "x": 434464.951,
              "y": 6479009.765,
              "z": 2151.8
            },
            {
              "x": 434453.829,
              "y": 6479021.264,
              "z": 2177.18
            },
            {
              "x": 434442.708,
              "y": 6479032.764,
              "z": 2202.55
            },
            {
              "x": 434431.587,
              "y": 6479044.263,
              "z": 2227.93
            },
            {
              "x": 434420.465,
              "y": 6479055.763,
              "z": 2253.3
            },
            {
              "x": 434409.344,
              "y": 6479067.262,
              "z": 2278.68
            },
            {
              "x": 434398.223,
              "y": 6479078.762,
              "z": 2304.05
            },
            {
              "x": 434387.102,
              "y": 6479090.261,
              "z": 2329.43
            },
            {
              "x": 434375.98,
              "y": 6479101.76,
              "z": 2354.8
            },
            {
              "x": 434364.859,
              "y": 6479113.26,
              "z": 2380.18
            },
            {
              "x": 434353.738,
              "y": 6479124.759,
              "z": 2405.55
            },
            {
              "x": 434342.616,
              "y": 6479136.259,
              "z": 2430.93
            },
            {
              "x": 434331.495,
              "y": 6479147.758,
              "z": 2456.3
            },
            {
              "x": 434320.374,
              "y": 6479159.258,
              "z": 2481.68
            },
            {
              "x": 434309.252,
              "y": 6479170.757,
              "z": 2507.05
            },
            {
              "x": 434298.131,
              "y": 6479182.257,
              "z": 2532.43
            },
            {
              "x": 434287.01,
              "y": 6479193.756,
              "z": 2557.8
            },
            {
              "x": 434275.888,
              "y": 6479205.256,
              "z": 2583.18
            },
            {
              "x": 434264.767,
              "y": 6479216.755,
              "z": 2608.55
            },
            {
              "x": 434253.646,
              "y": 6479228.254,
              "z": 2633.93
            },
            {
              "x": 434242.524,
              "y": 6479239.754,
              "z": 2659.3
            },
            {
              "x": 434231.403,
              "y": 6479251.253,
              "z": 2684.68
            },
            {
              "x": 434220.282,
              "y": 6479262.753,
              "z": 2710.06
            },
            {
              "x": 434209.16,
              "y": 6479274.252,
              "z": 2735.43
            },
            {
              "x": 434198.039,
              "y": 6479285.752,
              "z": 2760.81
            },
            {
              "x": 434186.918,
              "y": 6479297.251,
              "z": 2786.18
            },
            {
              "x": 434178.431,
              "y": 6479306.026,
              "z": 2805.54
            },
            {
              "x": 434175.814,
              "y": 6479308.733,
              "z": 2811.57
            },
            {
              "x": 434165.15,
              "y": 6479319.759,
              "z": 2837.35
            },
            {
              "x": 434155.118,
              "y": 6479330.132,
              "z": 2863.65
            },
            {
              "x": 434145.73,
              "y": 6479339.839,
              "z": 2890.43
            },
            {
              "x": 434136.998,
              "y": 6479348.868,
              "z": 2917.67
            },
            {
              "x": 434128.931,
              "y": 6479357.209,
              "z": 2945.33
            },
            {
              "x": 434121.54,
              "y": 6479364.852,
              "z": 2973.38
            },
            {
              "x": 434114.834,
              "y": 6479371.786,
              "z": 3001.79
            },
            {
              "x": 434108.821,
              "y": 6479378.003,
              "z": 3030.51
            },
            {
              "x": 434103.508,
              "y": 6479383.497,
              "z": 3059.52
            },
            {
              "x": 434098.902,
              "y": 6479388.259,
              "z": 3088.77
            },
            {
              "x": 434095.009,
              "y": 6479392.285,
              "z": 3118.25
            },
            {
              "x": 434091.832,
              "y": 6479395.57,
              "z": 3147.89
            },
            {
              "x": 434089.377,
              "y": 6479398.109,
              "z": 3177.68
            },
            {
              "x": 434087.645,
              "y": 6479399.899,
              "z": 3207.58
            },
            {
              "x": 434086.64,
              "y": 6479400.938,
              "z": 3237.54
            },
            {
              "x": 434086.357,
              "y": 6479401.231,
              "z": 3264
            }
          ],
          "casingShoes": [],
          "targets": [
            {},
            {}
          ],
          "tags": [],
          "clonedFroms": []
        }
      ],
      "fromWaterLevel": false,
      "activeWellBore": {
        "name": "Volve F_F-2_F-2_F2 Injector 170907_PROTOTYPE",
        "path": [
          {
            "x": 435047.604,
            "y": 6478564.735,
            "z": 145
          },
          {
            "x": 435047.604,
            "y": 6478564.735,
            "z": 150
          },
          {
            "x": 435047.604,
            "y": 6478564.735,
            "z": 180
          },
          {
            "x": 435047.604,
            "y": 6478564.735,
            "z": 210
          },
          {
            "x": 435047.604,
            "y": 6478564.735,
            "z": 240
          },
          {
            "x": 435047.604,
            "y": 6478564.735,
            "z": 250
          },
          {
            "x": 435047.515,
            "y": 6478564.66,
            "z": 270
          },
          {
            "x": 435047.047,
            "y": 6478564.268,
            "z": 299.99
          },
          {
            "x": 435046.178,
            "y": 6478563.539,
            "z": 329.97
          },
          {
            "x": 435044.909,
            "y": 6478562.474,
            "z": 359.92
          },
          {
            "x": 435043.24,
            "y": 6478561.074,
            "z": 389.85
          },
          {
            "x": 435042.595,
            "y": 6478560.532,
            "z": 399.81
          },
          {
            "x": 435041.145,
            "y": 6478559.315,
            "z": 419.72
          },
          {
            "x": 435038.538,
            "y": 6478557.128,
            "z": 449.53
          },
          {
            "x": 435035.413,
            "y": 6478554.506,
            "z": 479.25
          },
          {
            "x": 435031.773,
            "y": 6478551.452,
            "z": 508.87
          },
          {
            "x": 435031.065,
            "y": 6478550.858,
            "z": 514.17
          },
          {
            "x": 435027.708,
            "y": 6478548.266,
            "z": 538.42
          },
          {
            "x": 435023.39,
            "y": 6478545.526,
            "z": 567.98
          },
          {
            "x": 435018.825,
            "y": 6478543.248,
            "z": 597.54
          },
          {
            "x": 435014.014,
            "y": 6478541.432,
            "z": 627.1
          },
          {
            "x": 435008.959,
            "y": 6478540.078,
            "z": 656.63
          },
          {
            "x": 435003.66,
            "y": 6478539.187,
            "z": 686.15
          },
          {
            "x": 434998.12,
            "y": 6478538.76,
            "z": 715.63
          },
          {
            "x": 434992.341,
            "y": 6478538.795,
            "z": 745.07
          },
          {
            "x": 434986.324,
            "y": 6478539.294,
            "z": 774.45
          },
          {
            "x": 434980.07,
            "y": 6478540.257,
            "z": 803.78
          },
          {
            "x": 434973.583,
            "y": 6478541.682,
            "z": 833.03
          },
          {
            "x": 434966.863,
            "y": 6478543.569,
            "z": 862.21
          },
          {
            "x": 434959.914,
            "y": 6478545.919,
            "z": 891.29
          },
          {
            "x": 434952.736,
            "y": 6478548.729,
            "z": 920.29
          },
          {
            "x": 434945.333,
            "y": 6478552,
            "z": 949.17
          },
          {
            "x": 434937.706,
            "y": 6478555.731,
            "z": 977.94
          },
          {
            "x": 434929.857,
            "y": 6478559.919,
            "z": 1006.59
          },
          {
            "x": 434921.79,
            "y": 6478564.564,
            "z": 1035.11
          },
          {
            "x": 434913.507,
            "y": 6478569.665,
            "z": 1063.49
          },
          {
            "x": 434905.01,
            "y": 6478575.22,
            "z": 1091.72
          },
          {
            "x": 434896.301,
            "y": 6478581.227,
            "z": 1119.79
          },
          {
            "x": 434887.384,
            "y": 6478587.684,
            "z": 1147.69
          },
          {
            "x": 434878.261,
            "y": 6478594.59,
            "z": 1175.42
          },
          {
            "x": 434868.935,
            "y": 6478601.942,
            "z": 1202.97
          },
          {
            "x": 434859.408,
            "y": 6478609.738,
            "z": 1230.33
          },
          {
            "x": 434849.684,
            "y": 6478617.976,
            "z": 1257.48
          },
          {
            "x": 434839.766,
            "y": 6478626.653,
            "z": 1284.43
          },
          {
            "x": 434829.656,
            "y": 6478635.767,
            "z": 1311.16
          },
          {
            "x": 434819.359,
            "y": 6478645.314,
            "z": 1337.67
          },
          {
            "x": 434808.875,
            "y": 6478655.293,
            "z": 1363.94
          },
          {
            "x": 434798.21,
            "y": 6478665.699,
            "z": 1389.98
          },
          {
            "x": 434787.367,
            "y": 6478676.53,
            "z": 1415.76
          },
          {
            "x": 434775.346,
            "y": 6478688.816,
            "z": 1443.58
          },
          {
            "x": 434765.227,
            "y": 6478699.28,
            "z": 1466.67
          },
          {
            "x": 434754.105,
            "y": 6478710.779,
            "z": 1492.05
          },
          {
            "x": 434742.984,
            "y": 6478722.279,
            "z": 1517.42
          },
          {
            "x": 434731.863,
            "y": 6478733.778,
            "z": 1542.8
          },
          {
            "x": 434720.741,
            "y": 6478745.278,
            "z": 1568.17
          },
          {
            "x": 434709.62,
            "y": 6478756.777,
            "z": 1593.55
          },
          {
            "x": 434698.499,
            "y": 6478768.276,
            "z": 1618.92
          },
          {
            "x": 434687.377,
            "y": 6478779.776,
            "z": 1644.3
          },
          {
            "x": 434676.256,
            "y": 6478791.275,
            "z": 1669.67
          },
          {
            "x": 434665.135,
            "y": 6478802.775,
            "z": 1695.05
          },
          {
            "x": 434654.013,
            "y": 6478814.274,
            "z": 1720.42
          },
          {
            "x": 434642.892,
            "y": 6478825.774,
            "z": 1745.8
          },
          {
            "x": 434631.771,
            "y": 6478837.273,
            "z": 1771.17
          },
          {
            "x": 434620.649,
            "y": 6478848.773,
            "z": 1796.55
          },
          {
            "x": 434609.528,
            "y": 6478860.272,
            "z": 1821.92
          },
          {
            "x": 434598.407,
            "y": 6478871.772,
            "z": 1847.3
          },
          {
            "x": 434587.285,
            "y": 6478883.271,
            "z": 1872.67
          },
          {
            "x": 434576.164,
            "y": 6478894.77,
            "z": 1898.05
          },
          {
            "x": 434565.043,
            "y": 6478906.27,
            "z": 1923.42
          },
          {
            "x": 434553.921,
            "y": 6478917.769,
            "z": 1948.8
          },
          {
            "x": 434542.8,
            "y": 6478929.269,
            "z": 1974.17
          },
          {
            "x": 434531.679,
            "y": 6478940.768,
            "z": 1999.55
          },
          {
            "x": 434520.557,
            "y": 6478952.268,
            "z": 2024.93
          },
          {
            "x": 434509.436,
            "y": 6478963.767,
            "z": 2050.3
          },
          {
            "x": 434498.315,
            "y": 6478975.267,
            "z": 2075.68
          },
          {
            "x": 434487.193,
            "y": 6478986.766,
            "z": 2101.05
          },
          {
            "x": 434476.072,
            "y": 6478998.265,
            "z": 2126.43
          },
          {
            "x": 434464.951,
            "y": 6479009.765,
            "z": 2151.8
          },
          {
            "x": 434453.829,
            "y": 6479021.264,
            "z": 2177.18
          },
          {
            "x": 434442.708,
            "y": 6479032.764,
            "z": 2202.55
          },
          {
            "x": 434431.587,
            "y": 6479044.263,
            "z": 2227.93
          },
          {
            "x": 434420.465,
            "y": 6479055.763,
            "z": 2253.3
          },
          {
            "x": 434409.344,
            "y": 6479067.262,
            "z": 2278.68
          },
          {
            "x": 434398.223,
            "y": 6479078.762,
            "z": 2304.05
          },
          {
            "x": 434387.102,
            "y": 6479090.261,
            "z": 2329.43
          },
          {
            "x": 434375.98,
            "y": 6479101.76,
            "z": 2354.8
          },
          {
            "x": 434364.859,
            "y": 6479113.26,
            "z": 2380.18
          },
          {
            "x": 434353.738,
            "y": 6479124.759,
            "z": 2405.55
          },
          {
            "x": 434342.616,
            "y": 6479136.259,
            "z": 2430.93
          },
          {
            "x": 434331.495,
            "y": 6479147.758,
            "z": 2456.3
          },
          {
            "x": 434320.374,
            "y": 6479159.258,
            "z": 2481.68
          },
          {
            "x": 434309.252,
            "y": 6479170.757,
            "z": 2507.05
          },
          {
            "x": 434298.131,
            "y": 6479182.257,
            "z": 2532.43
          },
          {
            "x": 434287.01,
            "y": 6479193.756,
            "z": 2557.8
          },
          {
            "x": 434275.888,
            "y": 6479205.256,
            "z": 2583.18
          },
          {
            "x": 434264.767,
            "y": 6479216.755,
            "z": 2608.55
          },
          {
            "x": 434253.646,
            "y": 6479228.254,
            "z": 2633.93
          },
          {
            "x": 434242.524,
            "y": 6479239.754,
            "z": 2659.3
          },
          {
            "x": 434231.403,
            "y": 6479251.253,
            "z": 2684.68
          },
          {
            "x": 434220.282,
            "y": 6479262.753,
            "z": 2710.06
          },
          {
            "x": 434209.16,
            "y": 6479274.252,
            "z": 2735.43
          },
          {
            "x": 434198.039,
            "y": 6479285.752,
            "z": 2760.81
          },
          {
            "x": 434186.918,
            "y": 6479297.251,
            "z": 2786.18
          },
          {
            "x": 434178.431,
            "y": 6479306.026,
            "z": 2805.54
          },
          {
            "x": 434175.814,
            "y": 6479308.733,
            "z": 2811.57
          },
          {
            "x": 434165.15,
            "y": 6479319.759,
            "z": 2837.35
          },
          {
            "x": 434155.118,
            "y": 6479330.132,
            "z": 2863.65
          },
          {
            "x": 434145.73,
            "y": 6479339.839,
            "z": 2890.43
          },
          {
            "x": 434136.998,
            "y": 6479348.868,
            "z": 2917.67
          },
          {
            "x": 434128.931,
            "y": 6479357.209,
            "z": 2945.33
          },
          {
            "x": 434121.54,
            "y": 6479364.852,
            "z": 2973.38
          },
          {
            "x": 434114.834,
            "y": 6479371.786,
            "z": 3001.79
          },
          {
            "x": 434108.821,
            "y": 6479378.003,
            "z": 3030.51
          },
          {
            "x": 434103.508,
            "y": 6479383.497,
            "z": 3059.52
          },
          {
            "x": 434098.902,
            "y": 6479388.259,
            "z": 3088.77
          },
          {
            "x": 434095.009,
            "y": 6479392.285,
            "z": 3118.25
          },
          {
            "x": 434091.832,
            "y": 6479395.57,
            "z": 3147.89
          },
          {
            "x": 434089.377,
            "y": 6479398.109,
            "z": 3177.68
          },
          {
            "x": 434087.645,
            "y": 6479399.899,
            "z": 3207.58
          },
          {
            "x": 434086.64,
            "y": 6479400.938,
            "z": 3237.54
          },
          {
            "x": 434086.357,
            "y": 6479401.231,
            "z": 3264
          }
        ],
        "casingShoes": [],
        "targets": [
          {},
          {}
        ],
        "tags": [],
        "clonedFroms": [],
        "id": "-MGbRvZoWllJ5x_JaRkk",
        "metaData": []
      }
    },

  },

}