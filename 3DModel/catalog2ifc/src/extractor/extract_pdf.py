import sys
try:
    from PyPDF2 import PdfReader
except ImportError:
    try:
        from pypdf import PdfReader
    except ImportError:
        print("Neither pypdf nor PyPDF2 is installed.")
        sys.exit(1)

def extract_text(pdf_path, output_path):
    reader = PdfReader(pdf_path)
    with open(output_path, "w", encoding="utf-8") as f:
        for i, page in enumerate(reader.pages):
            f.write(f"--- PAGE {i+1} ---\n")
            try:
                text = page.extract_text()
                if text:
                    f.write(text + "\n")
                else:
                    f.write("(No text extracted from this page)\n")
            except Exception as e:
                f.write(f"(Error extracting text: {str(e)})\n")

if __name__ == "__main__":
    import os
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level to 'src' and then to 'catalogs'
    pdf_path = os.path.join(script_dir, "..", "..", "catalogs", "Carrier-42TGV-CP-Catalog.pdf")
    output_path = os.path.join(script_dir, "tgv_text.txt")
    
    if os.path.exists(pdf_path):
        extract_text(pdf_path, output_path)
    else:
        print(f"Error: PDF not found at {pdf_path}")
