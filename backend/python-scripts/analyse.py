import sys
import json
from collections import defaultdict
from datetime import datetime

def analyser_transactions(transactions):
    if not transactions:
        return {
            "categoriePlusDepensiere": None,
            "totalDepenses": 0,
            "totalRevenus": 0,
            "moyenneDepenseParCategorie": {},
            "tendance": "insuffisant",
            "nombreTransactions": 0,
        }

    depenses_par_categorie = defaultdict(float)
    total_depenses = 0
    total_revenus = 0

    for t in transactions:
        montant = float(t["montant"])
        if t["type"] == "depense":
            depenses_par_categorie[t["categorie"]] += montant
            total_depenses += montant
        elif t["type"] == "revenu":
            total_revenus += montant

    categorie_plus_depensiere = None
    if depenses_par_categorie:
        categorie_plus_depensiere = max(depenses_par_categorie, key=depenses_par_categorie.get)

    # Tendance simple : compare les 2 moitiés chronologiques des dépenses
    transactions_depenses = sorted(
        [t for t in transactions if t["type"] == "depense"],
        key=lambda t: t["date"]
    )
    tendance = "stable"
    if len(transactions_depenses) >= 4:
        moitie = len(transactions_depenses) // 2
        premiere_moitie = sum(float(t["montant"]) for t in transactions_depenses[:moitie])
        deuxieme_moitie = sum(float(t["montant"]) for t in transactions_depenses[moitie:])
        if deuxieme_moitie > premiere_moitie * 1.15:
            tendance = "hausse"
        elif deuxieme_moitie < premiere_moitie * 0.85:
            tendance = "baisse"

    return {
        "categoriePlusDepensiere": categorie_plus_depensiere,
        "totalDepenses": round(total_depenses, 2),
        "totalRevenus": round(total_revenus, 2),
        "moyenneDepenseParCategorie": {k: round(v, 2) for k, v in depenses_par_categorie.items()},
        "tendance": tendance,
        "nombreTransactions": len(transactions),
    }


if __name__ == "__main__":
    raw_input = sys.argv[1]
    transactions = json.loads(raw_input)
    resultat = analyser_transactions(transactions)
    print(json.dumps(resultat))