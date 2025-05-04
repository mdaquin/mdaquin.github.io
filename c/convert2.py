import pandas as pd
import numpy as np
from unicodedata import normalize

df = pd.read_csv('https://mdaquin.github.io/d/recipes.csv', index_col=0)


recipes = {}
ingredients = {}
for index,recipe in enumerate(df.iloc):
    recipes[recipe.recipe_name] = []
    for ingredient in recipe.ingredients.split(","):
        ingredient = ingredient.strip() 
        if ingredient[0].isdigit() or ingredient[0] == '¾' or ingredient[0] == '½' or ingredient[0] == '¼' or ingredient[0] == '⅓' or ingredient[0] == '⅔' or ingredient[0] == '⅛' or ingredient[0] == '⅜' or ingredient[0] == '⅝' or ingredient[0] == '⅞':
            ingredient = " ".join(ingredient.split(" ")[2:]).lower()
            ingredient = ingredient.replace("%", "percent")
            if "sugar" in ingredient: ingredient = "sugar"
            if "nut" in ingredient: ingredient = "nut"
            if "flour" in ingredient: ingredient = "flour"
            if "butter" in ingredient: ingredient = "butter"
            if "milk" in ingredient: ingredient = "milk"
            if "egg" in ingredient: ingredient = "egg"
            if "chicken" in ingredient: ingredient = "chicken"
            if "beef" in ingredient: ingredient = "beef"
            if "pork" in ingredient: ingredient = "pork"
            if "fish" in ingredient: ingredient = "fish"
            if "salt" in ingredient: ingredient = "salt"
            if "pepper" in ingredient: ingredient = "pepper"
            if "water" in ingredient: ingredient = "water"
            if "oil" in ingredient: ingredient = "oil"
            if "vinegar" in ingredient: ingredient = "vinegar"
            if "cream" in ingredient: ingredient = "cream"
            if "cheese" in ingredient: ingredient = "cheese"
            if "onion" in ingredient: ingredient = "onion"
            if "garlic" in ingredient: ingredient = "garlic"
            if "tomato" in ingredient: ingredient = "tomato"
            if "potato" in ingredient: ingredient = "potato"
            if "carrot" in ingredient: ingredient = "carrot"
            if "broccoli" in ingredient: ingredient = "broccoli"
            if "spinach" in ingredient: ingredient = "spinach"
            if "apple" in ingredient: ingredient = "apple"
            if not ingredient.strip().isdecimal() and len(ingredient.split(" ")) <= 3: 
                recipes[recipe.recipe_name].append(ingredient)
                if ingredient not in ingredients: ingredients[ingredient] = 0
                ingredients[ingredient] += 1
                   
print(len(ingredients), "ingredients in", len(recipes), "recipes")
inglist = []
for ingredient in ingredients:
    if ingredients[ingredient] > 30: inglist.append(ingredient)
print("reduced to", len(inglist), "ingredients") 
nrecipes = {}
for recipe in recipes:
    rarray = [0 for i in range(len(inglist))]
    for ingredient in recipes[recipe]:
        if ingredient in inglist: rarray[inglist.index(ingredient)] = 1
    if 1 in rarray: nrecipes[recipe] = rarray

print(len(nrecipes), "recipes")
with open("recipes_ing.csv", "w") as f:
    f.write("recipe," + ",".join(inglist) + "\n")
    for recipe in nrecipes:
        f.write(recipe.replace(",", "") + "," + ",".join([str(i) for i in nrecipes[recipe]]) + "\n")
