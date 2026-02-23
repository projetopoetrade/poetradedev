import requests
import json
import os

# Pega o secret do seu ambiente ou insira-o diretamente aqui
WEBHOOK_SECRET = "GjACnljC98QFRO9MkVc7d7XPrfqMc7lqeyMPQ4yLkGolm1gL8RWkZQlAil6KpT0we7b2bB3CqnqDpa97deWB0k5wWmhzTGHS6yPYFBCdxadZY4D9KnpZQxP9U4l05JlC" 
URL = "http://localhost:3000/api/webhooks/sanity-product"

payload = {
    # Todos esses campos serao usados caso o produto ainda nao exista
    "name": "Test Upsert Orb",
    "slug": "test-upsert-orb",
    "category": "Currency",
    "gameVersion": "path-of-exile-1",
    "league": "Standard",
    "difficulty": "softcore",
    
    # Texto rico que a API Next.js vai formatar para os blocos PortableText automaticamente
    "contentEn": "This is a test product created entirely via the python script.\n\nIt features multiple paragraphs, converted into Sanity Blocks.",
    "contentPtBr": "Este é um produto de teste criado inteiramente através do script python.\n\nApresenta múltiplos parágrafos, convertidos para Blocos do Sanity."
}

headers = {
    "Authorization": f"Bearer {WEBHOOK_SECRET}",
    "Content-Type": "application/json"
}

print("Enviando webhook para atualizar/criar produto no Sanity...")
response = requests.post(URL, json=payload, headers=headers)

print(f"Status Code: {response.status_code}")
try:
    print("Response JSON:", json.dumps(response.json(), indent=2))
except:
    print("Response Text:", response.text)
