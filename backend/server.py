
import asyncio
import websockets
from client import Client
import json

class Connection:
    def __init__(self, socket, inspections):
        self.socket = socket
        self.client = Client(inspections)



    async def loop(self):
        while True:
            data = await self.socket.recv()

            req = json.loads(data)

            resp, many = self.client.onRequest(req)

            if not many:
                resp = [resp]

            for r in resp:
                resp_data = json.dumps(r)
                await self.socket.send(resp_data)








class Server:

    def __init__(self, inspections):
        self.inspections = inspections


    async def onConnect(self, websocket, path):
        cl = Connection(websocket, self.inspections)

        await cl.loop()


    def start_server(self):

        server = websockets.serve(self.onConnect, 'localhost', 8765)

        asyncio.get_event_loop().run_until_complete(server)
        print('server started')