const config = require('./config.json')
import {Inspection} from './models';

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


type MsgCb = (resp: Response.Response) => void

export class Api {
    private ws: WebSocket
    private connected = false

    private serializer: ApiSerializer = new JsonSerializer()

    constructor(private onConnect:()=>void, private onMsgCb: MsgCb) {

    }
    connect() {
        this.ws = new WebSocket(config.api.endpoint)
        this.ws.onopen = () => {
            this.connected = true
            this.onConnect()
        }
        this.ws.onclose = () => {
            this.connected = false
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
        this.onMsgCb(resp)
    }


}




