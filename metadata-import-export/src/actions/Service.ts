import axios from 'axios';
import { 
  Store, 
  type IStore,
  type IEvent
} from './Store'

class Service {

  ftBackendurl!: String;
  tokenRenews!: Boolean;
  store!: IStore

  constructor() {
    this.store = {} as IStore
    this.tokenRenews = false
  }

  setAxiosHeaders(headers: any) {
    axios.defaults.headers.common = headers;
  }

  get token(): string {
    let jwt = ''
    Store.subscribe(e => jwt = e.token);
    return jwt
  }

  set token(token: string) {
    Store.update(old => {
      return { token: token, event: old.event }
    })

    this.setAxiosHeaders({ 'Authorization': 'Bearer ' + token });
    if (!this.tokenRenews) {
      // #17 Renew the token every 30 minutes
      setInterval(this.renewToken.bind(this), 30 * 60 * 1000);
      this.tokenRenews = true;
    }
  }

  get event(): IEvent {
    let event: IEvent = {} as IEvent
    Store.subscribe(e => event = e.event as IEvent);
    return event
  }  

  set event(event: IEvent) {
    Store.update(old => {
      return { token: old.token, event: event } as IStore
    })
  }

  // TODO use tokenRefresh
  renewToken() {
    axios.get(`${this.ftBackendurl}/token/refresh`)
      .then(resp => {
        if (resp.data && resp.data.token) {
          this.token = resp.data.token;
        }
      });
  }
  
  uploadMetaData(selectedObject: any, sheet: any) {
    console.log(selectedObject)
    console.log(sheet)
  }

  downloadMetaData(selectedObject: any, sheet: any) {
    console.log(selectedObject)
    console.log(sheet)
  }

  getMetaData(selectedObject: any) {
    console.log(selectedObject)
  }
}

export default Service

