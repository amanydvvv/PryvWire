import sys
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

def test_engine():
    print("Testing Presidio Analyzer & Anonymizer...")
    analyzer = AnalyzerEngine()
    anonymizer = AnonymizerEngine()
    
    test_text = "Hi, my name is Alice Smith, my email is alice.smith@example.com and phone is +1-202-555-0143. My SSN is 000-12-3456."
    results = analyzer.analyze(
        text=test_text,
        entities=["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "US_SSN"],
        language="en"
    )
    print(f"Entities detected: {len(results)}")
    for res in results:
        print(f" - {res.entity_type} [{res.start}:{res.end}] score={res.score:.2f} (text='{test_text[res.start:res.end]}')")
        
    anonymized = anonymizer.anonymize(text=test_text, analyzer_results=results)
    print(f"Sanitized prompt:\n{anonymized.text}")
    
    assert "<PERSON>" in anonymized.text or "<EMAIL_ADDRESS>" in anonymized.text
    print("Sanitizer engine verified successfully!")

if __name__ == "__main__":
    test_engine()
