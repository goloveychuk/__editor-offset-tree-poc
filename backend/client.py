import re
import asyncio

def splitWithIndices(s):
    res = [(m.group(0), m.start(), m.end()) for m in re.finditer(r'[\S\\n]+', s)]
    print(res)
    return res


class State:
    def __init__(self):
        self.all_text = ''

        self.words = {}





class Client:
    def __init__(self, send, inspections):
        self.state = State()
        self.inspections = inspections
        self.idd = 1
        self.send = send
        self.req_buffer = []
        loop = asyncio.get_event_loop()

        task = loop.create_task(self.loop())


    async def loop(self):
        while True:
            await asyncio.sleep(1)
            await self.processRequests()

    def get_inspections(self):
        all_text = self.state.all_text
        all_found_words = set()

        add_inspections = []
        for word, start, end in splitWithIndices(all_text):
            # word = all_text[start: end]
            all_found_words.add(word)
            if word not in self.state.words:
                word_exists = self.inspections.words.has(word)
                res = {"exists": word_exists, 'id': self.idd}

                self.state.words[word] = res
                if not word_exists:
                    add_inspections.append({'type': 'add_inspection', 'kind': 'unknown_word', 'start': start, 'end': end, 'id': self.idd})

                self.idd+=1

        to_remove = set(self.state.words.keys()) - all_found_words

        for word in to_remove:
            ins = self.state.words[word]
            self.state.words.pop(word)
            if not ins['exists']:
                yield {'type': 'remove_inspection', 'id': ins['id']}

        yield from add_inspections

    def onRequest(self, req):
        self.req_buffer.append(req)


    async def processRequests(self):
        if not self.req_buffer:
            return

        for req in self.req_buffer:
            if req['type'] == 'modify':
                self.state.all_text = self.state.all_text[:req['start']] + req['text'] + self.state.all_text[req['end']:]
                print(self.state.all_text)

        new_inspections = list(self.get_inspections())
        if new_inspections:
            for ins in new_inspections:
                await self.send(ins)
        else:
            await self.send({'type': 'ok'})

        self.req_buffer = []