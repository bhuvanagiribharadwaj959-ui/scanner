#!/usr/bin/env python3
"""
seed_chroma.py
Populates ChromaDB with rich vulnerability security context documents.
Database location: ./vulnerability_vector_db/chroma
"""

import json
import os
import sys

def seed_chroma():
    db_path = os.path.join(os.path.dirname(__file__), "..", "vulnerability_vector_db")
    json_path = os.path.join(db_path, "vulnerabilities.json")
    chroma_dir = os.path.join(db_path, "chroma")

    if not os.path.exists(json_path):
        print(f"Error: {json_path} does not exist", file=sys.stderr)
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        vulnerabilities = json.load(f)

    print(f"[*] Loaded {len(vulnerabilities)} vulnerability records from vulnerabilities.json")

    try:
        import chromadb
        from chromadb.config import Settings
        
        client = chromadb.PersistentClient(path=chroma_dir)
        collection = client.get_or_create_collection(
            name="vulnerability_exploits",
            metadata={"description": "Open source package vulnerability exploit patterns and safe remediation"}
        )

        documents = []
        metadatas = []
        ids = []

        for idx, vuln in enumerate(vulnerabilities):
            cve_id = vuln.get("cve_id", f"VULN-{idx}")
            pkg = vuln.get("package_name", "unknown")
            methods = ", ".join(vuln.get("vulnerable_methods", []))
            behavior = vuln.get("exploit_behavior", "")
            remediation = vuln.get("remediation_pattern", "")
            safe_code = vuln.get("safe_alternative_code", "")

            # Rich text document representation for vector semantic search
            doc_text = (
                f"CVE ID: {cve_id}\n"
                f"Package Name: {pkg}\n"
                f"Ecosystem: {vuln.get('ecosystem', 'npm')}\n"
                f"Severity: {vuln.get('severity', 'HIGH')}\n"
                f"Vulnerable Methods: {methods}\n"
                f"Exploit Behavior: {behavior}\n"
                f"Exploit Code Pattern: {vuln.get('exploit_code_pattern', '')}\n"
                f"Remediation Pattern: {remediation}\n"
                f"Safe Alternative Code: {safe_code}\n"
            )

            documents.append(doc_text)
            metadatas.append({
                "cve_id": cve_id,
                "package_name": pkg,
                "severity": vuln.get("severity", "HIGH"),
                "fixed_version": vuln.get("fixed_version", ""),
                "safe_alternative": safe_code
            })
            ids.append(f"{pkg}_{cve_id}_{idx}")

        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

        print(f"[+] Successfully seeded {len(documents)} vulnerability documents into ChromaDB at {chroma_dir}")
        print("[+] Chroma collection 'vulnerability_exploits' is ready for RAG querying.")

    except ImportError:
        print("[!] Note: 'chromadb' Python package not installed globally.")
        print("[+] The app's built-in TypeScript RAG Vector Store will directly query ./vulnerability_vector_db/vulnerabilities.json with token and cosine similarity.")
        print("[+] If you want ChromaDB native storage: pip install chromadb && python3 scripts/seed_chroma.py")

if __name__ == "__main__":
    seed_chroma()
