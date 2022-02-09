import sys

predicate = sys.argv[1]
opred = sys.argv[2]

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
    for y in data:
        if x[headers.index(predicate)] == "high":
            if y[headers.index(predicate)] == "medium" or y[headers.index(predicate)] == "low":
                print(f"{opred.lower()}({tovar(x[0])}, {tovar(y[0])}).")
        if x[headers.index(predicate)] == "medium":
            if y[headers.index(predicate)] == "low":            
                print(f"{opred.lower()}({tovar(x[0])}, {tovar(y[0])}).")

