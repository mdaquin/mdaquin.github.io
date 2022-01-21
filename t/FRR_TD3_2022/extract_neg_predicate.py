import pandas as pd
import sys

predicate = sys.argv[1]

df = pd.read_csv("mkbodies.csv")

def tovar(s):
    return s.lower().replace(" ", "").replace(".", "").replace("-", "")

for x in df.iloc:
    if x[predicate] == "low":
        print(f"{predicate.lower()}({tovar(x['Vehicle'])}, high).")
    elif x[predicate] == "high":
        print(f"{predicate.lower()}({tovar(x['Vehicle'])}, low).")
