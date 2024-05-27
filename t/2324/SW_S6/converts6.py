from rdflib import Graph, URIRef, Literal, RDF, RDFS
import pandas as pd

op = "https://idmc.univ-lorraine.fr/ontologies/sws6#"
dp = "https://idmc.univ-lorraine.fr/graph/sws6/"

Course   = URIRef(op+"Course")
Lecturer = URIRef(op+"Lecturer")
iflo    = URIRef(op+"isFirstLecturerOn")
islo    = URIRef(op+"isSecondLecturerOn")

df = pd.read_csv("s6example.csv")
g = Graph()
for l in df.iloc:
    cURI = URIRef(dp+l.ID.replace(" ", "_"))
    l1URI = URIRef(dp+l["Lecturer 1"])
    l2URI = URIRef(dp+l["Lecturer 2"])
    g.add((cURI, RDF.type, Course))
    g.add((cURI, RDFS.label, Literal(l.Title)))    
    g.add((l1URI, RDF.type, Lecturer))    
    g.add((l2URI, RDF.type, Lecturer))     
    g.add((l1URI, iflo, cURI))
    g.add((l2URI, islo, cURI))    

g.serialize("converteds6.ttl", format="turtle")
