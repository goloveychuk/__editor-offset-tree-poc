


class Node(object):
    __slots__ = ['children', 'is_word']


    def __init__(self):
        # self.v = v
        self.is_word = False
        self.children = None


    def add(self, word):
        p = self
        last_ind = len(word) - 1

        for ind, c in enumerate(word):
            if p.children == None:
                p.children = {}

            if c in p.children:
                p = p.children[c]
            else:
                n = Node()
                p.children[c] = n
                p = n

            if ind == last_ind:
                p.is_word = True

    def has(self, word):
        if len(word) == 0:
            return False

        p = self;
        for c in word:
            if p.children is None:
                return False
            p = p.children.get(c, None)
            if p is None:
                return False

        return p.is_word
        

def load_words():
    tree = Node()

    f = open('./all_words.txt')
    # n = 0

    for i in f:
        i = i.strip()
        tree.add(i.lower())

    return tree


class Inspections:
    def __init__(self):
        self.words = load_words()





