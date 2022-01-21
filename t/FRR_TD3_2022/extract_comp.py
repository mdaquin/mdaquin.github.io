import pandas as pd
import sys

predicate = sys.argv[1]
opred = sys.argv[2]

df = pd.read_csv("mkbodies.csv")

def tovar(s):
    return s.lower().replace(" ", "").replace(".", "").replace("-", "")

for x in df.iloc:
    for y in df.iloc:
        if x[predicate] == "high":
            if y[predicate] == "medium" or y[predicate] == "low":
                print(f"{opred.lower()}({tovar(x['Vehicle'])}, {tovar(y['Vehicle'])}).")
        if x[predicate] == "medium":
            if y[predicate] == "low":            
                print(f"{opred.lower()}({tovar(x['Vehicle'])}, {tovar(y['Vehicle'])}).")
