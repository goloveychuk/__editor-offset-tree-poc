
from itertools import groupby

def splitWithIndices(s, c=' '):
    p = 0
    for k, g in groupby(s, lambda x:x==c):
        q = p + sum(1 for i in g)
        if not k:
            yield p, q
        p = q


class State:
    def __init__(self):
        self.all_text = ''

        self.words = {}





class Client:
    def __init__(self, inspections):
        self.state = State()
        self.inspections = inspections
        self.idd = 1

    def get_inspections(self):
        all_text = self.state.all_text
        all_found_words = set()

        add_inspections = []
        for start, end in splitWithIndices(all_text):
            word = all_text[start: end]
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
        if req['type'] == 'modify':
            self.state.all_text = self.state.all_text[:req['start']] + req['text'] + self.state.all_text[req['end']:]
            print(self.state.all_text)

            new_inspections = list(self.get_inspections())
            return new_inspections, True

        return {'type': 'ok'}, False