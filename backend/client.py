


class State:
    def __init__(self):
        self.all_text = ''




class Client:
    def __init__(self, inspections):
        self.state = State()
        self.inspections = inspections

    def onRequest(self, req):
        return self.inspections.words.has(req['word'])
