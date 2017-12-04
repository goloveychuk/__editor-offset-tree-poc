const config = require('./config.json')
import {Inspection} from './models';
import {Observable, Observer} from 'rxjs'

export namespace Request {
    interface BaseReq {
        rev: number        
    }
    export enum Type {
        Modify = 'modify'
    }

    export interface ModifydReq extends BaseReq {
        type: Type.Modify
        start: number
        end: number
        text: string
    }
    export type Request = ModifydReq
}

export namespace Response {
    interface BaseResp {
        rev: number        
    }
    export enum Type {
        AddInspection = 'add_inspection',
        RemoveInspection = 'remove_inspection',
        Ok = 'ok'
    }
    interface AddInspection extends Inspection, BaseResp {
        type: Type.AddInspection
    }
    interface RemoveInspection  extends BaseResp {
        id: number
        type: Type.RemoveInspection
    }

    interface Ok extends BaseResp {
        rev: number
        type: Type.Ok
    }

    export type Response = AddInspection | RemoveInspection | Ok
}

interface ApiSerializer {
    serialize(req: Request.Request): string
    deserialize(resp: string): Response.Response
}

class JsonSerializer implements ApiSerializer {
    serialize(req: Request.Request) {
        return JSON.stringify(req)
    }
    deserialize(resp: string): Response.Response {
        return JSON.parse(resp)
    }
}



export type ApiEvent = {kind: 'connected'} | {kind: 'msg', msg: Response.Response}

export class Api {
    private ws: WebSocket
    private connected = false
    messagesStream: Observable<Response.Response>
    connectionStream: Observable<boolean>
    private nextMsg: (ev: Response.Response) => void
    private nextConnStatus: (connected: boolean) => void
    private serializer: ApiSerializer = new JsonSerializer()

    constructor() {
        this.messagesStream = Observable.create((observer: Observer<Response.Response>) => {
            this.nextMsg = observer.next.bind(observer)
        })
        this.connectionStream = Observable.create((observer: Observer<boolean>) => {
            this.nextConnStatus = observer.next.bind(observer)
        })
    }
    connect() {
        this.ws = new WebSocket(config.api.endpoint)
        this.ws.onopen = () => {
            this.connected = true
            this.nextConnStatus(true)
        }
        this.ws.onclose = () => {
            this.connected = false
            this.nextConnStatus(false)
            setTimeout(()=>{
                this.connect()
            }, 1000)
        }
        this.ws.onmessage = this.onMessage
    }
    send(req: Request.Request) {
        if (!this.connected) {
            return false
        }
        const msg = this.serializer.serialize(req)
        this.ws.send(msg)
        return true
    }
    private onMessage = (ev: MessageEvent) => {
        const resp = this.serializer.deserialize(ev.data)
        this.nextMsg(resp)
    }
}




