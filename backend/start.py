
from inspections import Inspections
from server import Server
import asyncio


inspections = Inspections()






server = Server(inspections)



server.start_server()


asyncio.get_event_loop().run_forever()