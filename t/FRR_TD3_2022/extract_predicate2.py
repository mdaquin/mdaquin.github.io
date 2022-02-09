import sys

predicate = sys.argv[1]

headers = []
data = []

with open("mkbodies.csv") as f:
    line = f.readline().strip()
    first = True
    while line:
        la = line.split(",")
        if first:
            headers=la
            first = False
        else:
            data.append(la)
        line = f.readline().strip()
        
def tovar(s):
    return s.lower().replace(" ", "").replace(".", "").replace("-", "")

for x in data:
    print(f"{predicate.lower()}({tovar(x[0])}, {x[headers.index(predicate)]}).")


## Autres script
## working_directory(_,'/.../').
