

enum ServerAction {
    Add, Delete, Modify
}

interface AddReq {
    type: ServerAction.Add
    pos: number
    text: string
}

type Request = AddReq

enum InspectionType {
    Warning, Error
}

interface Inspection {
    type: InspectionType
    posStart: number
    posEnd: number
    text: string
}


interface Resp {
    newInspections: Inspection[]
    obsoleteInspections: Inspection[]
}


export class ServerSession {
    text: string
    constructor() {
        var ws = new WebSocket("ws://127.0.0.1:8765")
        
    }
    send(req: Request) {
        
    }
}




