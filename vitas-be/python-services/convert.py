import pandas as pd

# Đọc file CSV (giả sử file tên tickers.csv, có cột 'ticker')
df = pd.read_csv("tickers.csv")

# Lấy danh sách ticker (loại bỏ NaN nếu có)
tickers = df['ticker'].dropna().astype(str).tolist()

# Format theo dạng "XXX",
formatted = ",\n".join(f'"{t}"' for t in tickers)

# Ghi ra file kết quả
with open("formatted_tickers_92.txt", "w") as f:
    f.write(formatted)

print("Đã xuất ra formatted_tickers.txt")
