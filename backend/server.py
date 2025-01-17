
import asyncio
import websockets
from client import Client
import json
import time

class Connection:
    def __init__(self, socket, inspections):
        self.socket = socket
        self.client = Client(self.send, inspections)

    async def send(self, res):
        resp_data = json.dumps(res)
        await self.socket.send(resp_data)


    async def loop(self):
        while True:
            data = await self.socket.recv()

            req = json.loads(data)
            # time.sleep(1)

            await self.client.onRequest(req)










class Server:

    def __init__(self, inspections):
        self.inspections = inspections


    async def onConnect(self, websocket, path):
        cl = Connection(websocket, self.inspections)

        await cl.loop()


    def start_server(self):

        server = websockets.serve(self.onConnect, '0.0.0.0', 8002)

        asyncio.get_event_loop().run_until_complete(server)
        print('server started')