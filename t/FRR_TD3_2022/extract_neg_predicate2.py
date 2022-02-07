import sys

predicate = sys.argv[1]

headers = []
data = []

with open("mkbodies.csv") as f:
    line = f.readline()
    first = True
    while line:
        la = line.split(",")
        if first:
            headers=la
            first = False
        else:
            data.append(la)
        line = f.readline()
        
def tovar(s):
    return s.lower().replace(" ", "").replace(".", "").replace("-", "")

for x in data:
    if x[headers.index(predicate)] == "low":
        print(f"{predicate.lower()}({tovar(x[0])}, high).")
    elif x[headers.index(predicate)] == "high":
        print(f"{predicate.lower()}({tovar(x[0])}, low).")
    

