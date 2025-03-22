import pandas as pd
from rdflib import Graph, URIRef, Literal, Namespace, RDF, RDFS, OWL, XSD
from rdflib.namespace import DC, DCTERMS
import numpy as np
from unicodedata import normalize

saip7 = Namespace('https://mdaquin.github.io/kg/recipes#')
fo = Namespace('http://purl.org/ontology/fo/')

df = pd.read_csv('https://mdaquin.github.io/d/recipes.csv', index_col=0)

g = Graph()

for index,recipe in enumerate(df.iloc):
    recipe_uri = URIRef(saip7[str(index)])
    g.add((recipe_uri, RDF.type, fo.Recipe))
    g.add((recipe_uri, RDFS.label, Literal(recipe.recipe_name)))
    if type(recipe.prep_time) == str:
          pt = 0
          spt = recipe.prep_time
          if "hrs" in spt:
               nh = int(recipe.prep_time[:recipe.prep_time.find("hrs")])
               pt = nh * 60
               spt = spt[spt.find("hrs")+3:]
          if "mins" in spt:
               pt += int(spt.replace("mins", "").strip())
          if pt!=0:
               g.add((recipe_uri, saip7.prep_time_mins, Literal(pt, datatype=XSD.integer)))
    if type(recipe.cook_time) == str:
          ct = 0
          sct = recipe.cook_time
          if "hrs" in sct:
               nh = int(sct[:sct.find("hrs")])
               ct = nh * 60
               sct = sct[sct.find("hrs")+3:]
          if "mins" in sct:
               ct += int(sct.replace("mins", "").strip())
          if ct!=0:
               g.add((recipe_uri, saip7.cook_time_mins, Literal(ct, datatype=XSD.integer)))
    g.add((recipe_uri, fo.serves, Literal(recipe.servings, datatype=XSD.integer)))
    for ingredient in recipe.ingredients.split(","):
        ingredient = ingredient.strip() 
        if ingredient[0].isdigit() or ingredient[0] == '¾' or ingredient[0] == '½' or ingredient[0] == '¼' or ingredient[0] == '⅓' or ingredient[0] == '⅔' or ingredient[0] == '⅛' or ingredient[0] == '⅜' or ingredient[0] == '⅝' or ingredient[0] == '⅞':
            quantity = " ".join(ingredient.split(" ")[0:2])
            ingredient = " ".join(ingredient.split(" ")[2:])
            ingredient = ingredient.replace("%", "percent")
            iname = quantity+"_"+ingredient
            iname = normalize('NFKD', iname).encode('ascii', 'ignore').decode('ascii').replace(" ", "_")
            iuri = saip7[iname]
            g.add((recipe_uri, fo.ingredients, iuri))
            furi = saip7[ingredient.replace(" ", "_")]
            g.add((iuri, fo.food, furi))
            g.add((iuri, fo.imperial_quantity, Literal(quantity)))
            if "sugar" in ingredient.lower(): g.add((furi, RDF.type, saip7.Sugar))
            if "nut" in ingredient.lower(): g.add((furi, RDF.type, saip7.Nut))
            if "flour" in ingredient.lower(): g.add((furi, RDF.type, saip7.Flour))
            if "butter" in ingredient.lower(): g.add((furi, RDF.type, saip7.Butter))
            if "milk" in ingredient.lower(): g.add((furi, RDF.type, saip7.Milk))
            if "egg" in ingredient.lower(): g.add((furi, RDF.type, saip7.Egg))
            if "chicken" in ingredient.lower(): g.add((furi, RDF.type, saip7.Chicken))
            if "beef" in ingredient.lower(): g.add((furi, RDF.type, saip7.Beef))
            if "pork" in ingredient.lower(): g.add((furi, RDF.type, saip7.Pork))
            if "fish" in ingredient.lower(): g.add((furi, RDF.type, saip7.Fish))
    muri = saip7[str(index)+"_method"]
    g.add((recipe_uri, fo.method, muri))
    for di, direction in enumerate(recipe.directions.split(".")):
        stepuri = saip7[str(index)+"_step"+str(di)]
        g.add((muri, DCTERMS.hasPart, stepuri))
        g.add((stepuri, fo.instruction, Literal(direction.strip())))

g.add((saip7.Sugar, RDFS.subClassOf, saip7.PlantBasedFood))
g.add((saip7.Nut, RDFS.subClassOf, saip7.PlantBasedFood))
g.add((saip7.Flour, RDFS.subClassOf, saip7.PlantBasedFood))
g.add((saip7.Butter, RDFS.subClassOf, saip7.DairyFood))
g.add((saip7.Milk, RDFS.subClassOf, saip7.DairyFood))
g.add((saip7.Egg, RDFS.subClassOf, saip7.AnimalBasedFood))
g.add((saip7.Chicken, RDFS.subClassOf, saip7.Meat))
g.add((saip7.Beef, RDFS.subClassOf, saip7.Meat))
g.add((saip7.Pork, RDFS.subClassOf, saip7.Meat))
g.add((saip7.Fish, RDFS.subClassOf, saip7.Meat))
g.add((saip7.PlantBasedFood, RDFS.subClassOf, fo.Food))
g.add((saip7.DairyFood, RDFS.subClassOf, saip7.AnimalBasedFood))
g.add((saip7.AnimalBasedFood, RDFS.subClassOf, fo.Food))
g.add((saip7.Meat, RDFS.subClassOf, saip7.AnimalBasedFood))

g.serialize("kg/recipes", format='turtle')